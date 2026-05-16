'use client';

import { useState, useCallback } from 'react';
import PostCard from '@/components/shared/PostCard';
import { Post, Category } from '@/types';
import { Loader2, BookOpen, Zap } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.envoyou.com/api';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-block px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Category
              </span>
              {meta.total > 0 && (
                <span className="inline-block px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full">
                  {meta.total} {meta.total === 1 ? 'Article' : 'Articles'}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              {category.name}
            </h1>

            {/* Description */}
            {category.description && (
              <p className="text-xl text-slate-700 dark:text-slate-200 mb-6 leading-relaxed">
                {category.description}
              </p>
            )}

            {/* Meta Description */}
            {category.meta_description && !category.description && (
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                {category.meta_description}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 md:gap-8 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">Total Articles</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{meta.total}</p>
              </div>
              {initialPosts.length > 0 && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">First Article</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {firstArticleDateFormatter.format(new Date(initialPosts[0].published_at || initialPosts[0].created_at))}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Side Info Card */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 sticky top-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Quick Stats</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Category</span>
                  <span className="font-medium text-slate-900 dark:text-white">{category.name}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Posts</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">{meta.total}</span>
                </div>
                {hasMore && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {meta.totalPages} pages of content
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
              className="group px-8 py-3 bg-primary-600 dark:bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
        <section className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
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
                  className="group p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
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
