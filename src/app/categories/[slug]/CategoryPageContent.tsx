'use client';

import { useState, useCallback } from 'react';
import PostCard from '@/components/shared/PostCard';
import { Post, Category } from '@/types';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.envoyou.com/api';

interface CategoryWithDesc extends Category {
  description?: string;
  post_count?: number;
}

interface Props {
  category: CategoryWithDesc;
  initialPosts: Post[];
  initialMeta: { page: number; limit: number; total: number; totalPages: number };
  slug: string;
}

export default function CategoryPageContent({ category, initialPosts, initialMeta, slug }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
      {/* Category Header */}
      <header className="text-center mb-12">
        <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-full">
          Category
        </span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {category.description}
          </p>
        )}
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {meta.total} {meta.total === 1 ? 'article' : 'articles'}
        </p>
      </header>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          <p className="text-xl">No articles in this category yet.</p>
        </div>
      )}

      {/* Load More */}
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
    </div>
  );
}
