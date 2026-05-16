'use client';

import PostCard from '@/components/shared/PostCard';
import CategoryPills from '@/components/shared/CategoryPills';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Post, Tag, Category } from '@/types';
import { Locale } from '@/lib/i18n';
import { Loader2, ArrowRight, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import Link from 'next/link';

interface HomeContentProps {
  initialPosts: Post[];
  initialMeta: { page: number; limit: number; total: number; totalPages: number };
  trendingPosts: Post[];
  tags: Tag[];
  categories?: Category[];
  locale?: Locale;
  notice?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.envoyou.com/api';

export default function HomeContent({
  initialPosts,
  initialMeta,
  trendingPosts,
  tags,
  categories = [],
  locale = 'id',
  notice,
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
        `${API_URL}/posts?limit=${meta.limit}&page=${nextPage}&language=${locale}${tagParam}`,
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
  }, [isLoadingMore, hasMore, meta, activeTag, locale]);

  // ── Derive featured post (only when no tag filter) ──────────
  const featuredPost = !activeTag && posts.length > 0 ? posts[0] : null;
  const feedPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      {notice && (
        <div className="rounded-2xl border border-primary-500/20 bg-primary-50 px-5 py-4 text-sm text-primary-700 dark:border-primary-400/20 dark:bg-primary-900/20 dark:text-primary-300">
          {notice}
        </div>
      )}
      {/* Featured Post Hero Section */}
      {featuredPost && (
        <section>
          <h2 className="sr-only">Featured Article</h2>
          <PostCard post={featuredPost} featured={true} priority={true} locale={locale} />
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
              <PostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by Category Section */}
      {!activeTag && categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                Browse by Category
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${locale}/categories/${cat.slug}`}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-500/60"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-300 group-hover:border-primary-500 group-hover:text-primary-600 dark:border-slate-700 dark:text-slate-400 dark:group-hover:border-primary-400 dark:group-hover:text-primary-400">
                      <CategoryIcon category={cat} className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 -translate-x-2 text-primary-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:text-primary-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Feed & Tag Filter */}
      <section>
        <div className="mb-8">
          <CategoryPills tags={tags} currentTagSlug={activeTag} locale={locale} />
        </div>

        <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mb-6">
          {activeTag
            ? `Latest in ${tags.find((t) => t.slug === activeTag)?.name || activeTag}`
            : 'Latest Feed'}
        </h2>

        {feedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} locale={locale} />
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
