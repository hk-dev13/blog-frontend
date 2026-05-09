'use client';

import PostCard from '@/components/shared/PostCard';
import CategoryPills from '@/components/shared/CategoryPills';
import { Post, Tag } from '@/types';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';

interface HomeContentProps {
  initialPosts: Post[];
  initialMeta: { page: number; limit: number; total: number; totalPages: number };
  trendingPosts: Post[];
  tags: Tag[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.envoyou.com/api';

export default function HomeContent({
  initialPosts,
  initialMeta,
  trendingPosts,
  tags,
}: HomeContentProps) {
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag') || undefined;

  // ── Pagination state ────────────────────────────────────────
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = meta.page < meta.totalPages;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = meta.page + 1;
      const tagParam = activeTag ? `&tag=${activeTag}` : '';
      const res = await fetch(
        `${API_URL}/posts?limit=${meta.limit}&page=${nextPage}${tagParam}`,
      );
      const json = await res.json();
      if (json.success) {
        setPosts((prev) => [...prev, ...json.data]);
        setMeta(json.meta);
      }
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, meta, activeTag]);

  // ── Derive featured post (only when no tag filter) ──────────
  const featuredPost = !activeTag && posts.length > 0 ? posts[0] : null;
  const feedPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      {/* Featured Post Hero Section */}
      {featuredPost && (
        <section>
          <h2 className="sr-only">Featured Article</h2>
          <PostCard post={featuredPost} featured={true} priority={true} />
        </section>
      )}

      {/* Trending Section */}
      {!activeTag && trendingPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              Trending Now
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Feed & Tag Filter */}
      <section>
        <div className="mb-8">
          <CategoryPills tags={tags} currentTagSlug={activeTag} />
        </div>

        <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mb-6">
          {activeTag
            ? `Latest in ${tags.find((t) => t.slug === activeTag)?.name || activeTag}`
            : 'Latest Feed'}
        </h2>

        {feedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No posts found.
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-12">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="group px-8 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full font-medium text-slate-700 dark:text-slate-200 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More Articles
                  <span className="text-slate-400 dark:text-slate-500 text-sm">
                    ({meta.total - posts.length} remaining)
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
