import { Suspense } from 'react';
import { PostGridSkeleton, CategoryPillsSkeleton } from '@/components/shared/Skeletons';
import { serverFetchPaginated, serverFetch } from '@/lib/serverApi';
import { Post, Tag, Category } from '@/types';
import HomeContent from '@/components/home/HomeContent';

// ISR — revalidate every 300 seconds (5 min)
export const revalidate = 300;

export default async function Home() {
  // Server-render the homepage through ISR so repeat visits can
  // reuse cached HTML instead of rebuilding the page on every request.
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
