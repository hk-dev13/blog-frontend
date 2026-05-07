import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { serverFetchPaginated, serverFetch } from '@/lib/serverApi';
import { Post, Tag } from '@/types';
import HomeContent from '@/components/home/HomeContent';

// ISR — revalidate every 300 seconds (5 min)
export const revalidate = 300;

// Allow dynamic rendering when API is unreachable at build time
export const dynamic = 'force-dynamic';

export default async function Home() {
  // ── Parallel fetch — keeps TTFB low ─────────────────────────
  let latestData: Post[] = [];
  let latestMeta = { page: 1, limit: 6, total: 0, totalPages: 0 };
  let trendingData: Post[] = [];
  let tagsData: Tag[] = [];

  try {
    const [latestRes, trendingRes, tags] = await Promise.all([
      serverFetchPaginated<Post>('/posts?limit=6', { revalidate: 300 }),
      serverFetchPaginated<Post>('/posts?limit=4&sort=views&order=desc', { revalidate: 300 }),
      serverFetch<Tag[]>('/tags', { revalidate: 3600 }),
    ]);
    latestData = latestRes.data;
    latestMeta = latestRes.meta;
    trendingData = trendingRes.data;
    tagsData = tags;
  } catch (err) {
    console.error('[Homepage] Failed to fetch initial data:', err);
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <HomeContent
        initialPosts={latestData}
        initialMeta={latestMeta}
        trendingPosts={trendingData}
        tags={tagsData}
      />
    </Suspense>
  );
}
