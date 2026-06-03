'use client';

import { useState, useCallback } from 'react';
import PostCard from '@/components/shared/PostCard';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Post, Category } from '@/types';
import { Loader2, BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { API_URL } from '@/lib/env';
const firstArticleDateFormatter = new Intl.DateTimeFormat('id-ID', {
  year: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

interface CategoryWithDesc extends Category {
  description?: string;
  meta_description?: string;
  post_count?: number;
}

interface Props {
  category: CategoryWithDesc;
  allCategories?: CategoryWithDesc[];
  initialPosts: Post[];
  initialMeta: { page: number; limit: number; total: number; totalPages: number };
  slug: string;
}

export default function CategoryPageContent({ category, allCategories = [], initialPosts, initialMeta, slug }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const otherCategories = allCategories.filter((c) => c.slug !== slug).slice(0, 4);

  const hasMore = meta.page < meta.totalPages;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = meta.page + 1;
      const res = await fetch(
        `${API_URL}/posts?category=${slug}&limit=${meta.limit}&page=${nextPage}`,
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
  }, [isLoadingMore, hasMore, meta, slug]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="container mx-auto max-w-5xl px-4 py-10 md:py-16">
        <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-12 shadow-2xl shadow-slate-950/10 md:px-10 md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_0%,rgba(13,135,207,0.32),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
          <div className="relative z-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-">
                <CategoryIcon category={category} className="h-8 w-8" />
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-primary-200">
                  <BookOpen className="h-4 w-4" />
                  Category
                </span>
                {meta.total > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-300">
                    {meta.total} {meta.total === 1 ? 'Article' : 'Articles'}
                  </span>
                )}
              </div>

              <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-white md:text-6xl">
                {category.name}
              </h1>

              {category.description && (
                <p className="max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
                  {category.description}
                </p>
              )}

              {category.meta_description && !category.description && (
                <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                  {category.meta_description}
                </p>
              )}
            </div>

            <div className="grid min-w-44 grid-cols-2 gap-3 text-sm md:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">Total Articles</p>
                <p className="text-2xl font-bold text-white">{meta.total}</p>
              </div>
              {initialPosts.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">First Article</p>
                  <p className="font-medium text-slate-100">
                    {firstArticleDateFormatter.format(new Date(initialPosts[0].published_at || initialPosts[0].created_at))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>
      </section>

      {/* Posts Section */}
      <section className="container mx-auto px-4 pb-12 md:pb-20 max-w-5xl">
        {/* Posts Grid */}
        {posts.length > 0 ? (
          <>
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-8">
              Latest Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} activeCategorySlug={slug} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
            <p className="text-xl text-slate-600 dark:text-slate-300 font-medium">No articles in this category yet.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Check back soon for new content!</p>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="group px-8 py-3 border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-400 dark:hover:text-slate-50 rounded-full flex items-center gap-2 disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More Articles
                  <span className="text-sm opacity-90">
                    ({meta.total - posts.length} remaining)
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* Cross-Category Navigation (CTA) */}
      {otherCategories.length > 0 && (
        <section className="border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/50">
          <div className="container mx-auto px-4 py-20 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-4">
                Explore Other Topics
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Discover more insights and stories across our diverse range of categories.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-500/60"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-300 group-hover:border-primary-500 group-hover:text-primary-600 dark:border-slate-700 dark:text-slate-400 dark:group-hover:border-slate-50 dark:group-hover:text-slate-50">
                      <CategoryIcon category={cat} className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 -translate-x-2 text-primary-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:text-primary-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
