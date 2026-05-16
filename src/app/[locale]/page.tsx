import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PostGridSkeleton, CategoryPillsSkeleton } from '@/components/shared/Skeletons';
import { serverFetchPaginated, serverFetch } from '@/lib/serverApi';
import { Post, Tag, Category } from '@/types';
import HomeContent from '@/components/home/HomeContent';
import type { Metadata } from 'next';
import { isLocale, Locale } from '@/lib/i18n';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { tag } = await searchParams;
  if (!isLocale(locale)) return {};

  const canonical = `https://blog.envoyou.com/${locale}`;
  if (!tag) {
    return {
      alternates: {
        canonical,
        languages: {
          id: 'https://blog.envoyou.com/id',
          en: 'https://blog.envoyou.com/en',
        },
      },
    };
  }

  return {
    robots: { index: false, follow: true },
    alternates: { canonical },
  };
}

export default async function LocalizedHome({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { locale: localeParam } = await params;
  const { notice } = await searchParams;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;

  let latestData: Post[] = [];
  let latestMeta = { page: 1, limit: 6, total: 0, totalPages: 0 };
  let trendingData: Post[] = [];
  let tagsData: Tag[] = [];
  let categoriesData: Category[] = [];

  try {
    const [latestRes, trendingRes, tags, categories] = await Promise.all([
      serverFetchPaginated<Post>(`/posts?limit=6&language=${locale}`, { revalidate: 300 }),
      serverFetchPaginated<Post>(`/posts?limit=4&sort=views&order=desc&language=${locale}`, { revalidate: 300 }),
      serverFetch<Tag[]>('/tags', { revalidate: 3600 }),
      serverFetch<Category[]>(`/categories?language=${locale}`, { revalidate: 3600 }),
    ]);
    latestData = latestRes.data;
    latestMeta = latestRes.meta;
    trendingData = trendingRes.data;
    tagsData = tags;
    categoriesData = categories;
  } catch (err) {
    console.error('[Homepage] Failed to fetch initial data:', err);
  }

  const noticeText = notice === 'translation-missing'
    ? locale === 'en'
      ? 'This article is not available in English yet.'
      : 'Artikel ini belum tersedia dalam Bahasa Indonesia.'
    : undefined;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 space-y-16">
          <PostGridSkeleton count={1} featured />
          <CategoryPillsSkeleton />
          <PostGridSkeleton count={4} />
        </div>
      }
    >
      <HomeContent
        initialPosts={latestData}
        initialMeta={latestMeta}
        trendingPosts={trendingData}
        tags={tagsData}
        categories={categoriesData}
        locale={locale}
        notice={noticeText}
      />
    </Suspense>
  );
}
