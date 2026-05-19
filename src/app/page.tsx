import { Suspense } from 'react';
import { PostGridSkeleton, CategoryPillsSkeleton } from '@/components/shared/Skeletons';
import { serverFetchPaginated, serverFetch } from '@/lib/serverApi';
import { SITE_URL } from '@/lib/env';
import { Post, Tag, Category } from '@/types';
import HomeContent from '@/components/home/HomeContent';
import type { Metadata } from 'next';

// ISR — revalidate every 300 seconds (5 min)
export const revalidate = 300;

// Allow dynamic rendering when API is unreachable at build time
export const dynamic = 'force-dynamic';

// ── SEO: noindex + canonical for parameterised tag views ─────────────
// /?tag=ai is a filtered view of the homepage, not a unique page.
// Tell Google the canonical is always '/' to avoid duplicate content.
export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ tag?: string }> }
): Promise<Metadata> {
  const { tag } = await searchParams;
  if (!tag) return {};   // Normal homepage — no special metadata needed

  return {
    robots: { index: false, follow: true },
    alternates: { canonical: SITE_URL },
  };
}

export default async function Home() {
  // ── Parallel fetch — keeps TTFB low ─────────────────────────
  let latestData: Post[] = [];
  let latestMeta = { page: 1, limit: 6, total: 0, totalPages: 0 };
  let trendingData: Post[] = [];
  let tagsData: Tag[] = [];
  let categoriesData: Category[] = [];

  try {
    const [latestRes, trendingRes, tags, categories] = await Promise.all([
      serverFetchPaginated<Post>('/posts?limit=6', { revalidate: 300 }),
      serverFetchPaginated<Post>('/posts?limit=4&sort=views&order=desc', { revalidate: 300 }),
      serverFetch<Tag[]>('/tags', { revalidate: 3600 }),
      serverFetch<Category[]>('/categories', { revalidate: 3600 }),
    ]);
    latestData = latestRes.data;
    latestMeta = latestRes.meta;
    trendingData = trendingRes.data;
    tagsData = tags;
    categoriesData = categories;
  } catch (err) {
    console.error('[Homepage] Failed to fetch initial data:', err);
  }

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
      />
    </Suspense>
  );
}
