'use client';

import PostCard from '@/components/shared/PostCard';
import CategoryPills from '@/components/shared/CategoryPills';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Post, Tag, Category } from '@/types';
import { Loader2, ArrowRight, LayoutGrid, BookOpen, Tags, UserRound } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

interface HomeContentProps {
  initialPosts: Post[];
  initialMeta: { page: number; limit: number; total: number; totalPages: number };
  trendingPosts: Post[];
  tags: Tag[];
  categories?: Category[];
}

import { API_URL } from '@/lib/env';

type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export default function HomeContent({
  initialPosts,
  initialMeta,
  trendingPosts,
  tags,
  categories = [],
}: HomeContentProps) {
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag') || undefined;

  // ── Pagination state ────────────────────────────────────────
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [clientTrendingPosts, setClientTrendingPosts] = useState<Post[]>(trendingPosts);
  const [clientTags, setClientTags] = useState<Tag[]>(tags);
  const [clientCategories, setClientCategories] = useState<Category[]>(categories);
  const [isHydratingInitial, setIsHydratingInitial] = useState(false);

  const hasMore = meta.page < meta.totalPages;

  useEffect(() => {
    const needsClientFallback =
      posts.length === 0 &&
      meta.total === 0 &&
      (clientTrendingPosts.length === 0 || clientTags.length === 0 || clientCategories.length === 0);

    if (!needsClientFallback) return;

    let cancelled = false;
    const fetchJson = async <T,>(endpoint: string): Promise<T> => {
      const res = await fetch(`${API_URL}${endpoint}`);
      if (!res.ok) {
        throw new Error(`${endpoint} -> ${res.status}`);
      }
      return res.json() as Promise<T>;
    };

    const hydrateFromClient = async () => {
      setIsHydratingInitial(true);
      const tagParam = activeTag ? `&tag=${activeTag}` : '';
      const [latestRes, trendingRes, tagsRes, categoriesRes] = await Promise.allSettled([
        fetchJson<PaginatedResponse<Post>>(`/posts?limit=${meta.limit || 6}${tagParam}`),
        fetchJson<PaginatedResponse<Post>>('/posts?limit=4&sort=views&order=desc'),
        fetchJson<ApiResponse<Tag[]>>('/tags'),
        fetchJson<ApiResponse<Category[]>>('/categories'),
      ]);

      if (cancelled) return;

      if (latestRes.status === 'fulfilled' && latestRes.value.success) {
        setPosts(latestRes.value.data);
        setMeta(latestRes.value.meta);
      }
      if (trendingRes.status === 'fulfilled' && trendingRes.value.success) {
        setClientTrendingPosts(trendingRes.value.data);
      }
      if (tagsRes.status === 'fulfilled' && tagsRes.value.success) {
        setClientTags(tagsRes.value.data);
      }
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success) {
        setClientCategories(categoriesRes.value.data);
      }
      setIsHydratingInitial(false);
    };

    hydrateFromClient().catch((err) => {
      if (!cancelled) {
        console.error('Failed to hydrate homepage from client:', err);
        setIsHydratingInitial(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeTag,
    clientCategories.length,
    clientTags.length,
    clientTrendingPosts.length,
    meta.limit,
    meta.total,
    posts.length,
  ]);

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
  const trendingTags = [...clientTags].sort((a, b) => (b.post_count ?? 0) - (a.post_count ?? 0));

  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      {!activeTag && (
        <section className="max-w-3xl pt-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
            Envoyou Blog
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight text-slate-950 dark:text-white md:text-5xl">
            Wawasan teknologi, AI, dan strategi digital masa depan.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
            Riset, analisis, dan panduan praktis tentang artificial intelligence, bisnis modern,
            cloud infrastructure, dan investasi digital.
          </p>
        </section>
      )}

      {/* Featured Post Hero Section */}
      {featuredPost && (
        <section>
          <h2 className="sr-only">Featured Article</h2>
          <PostCard post={featuredPost} featured={true} priority={true} />
        </section>
      )}

      {/* Browse by Category Section */}
      {!activeTag && clientCategories.length > 0 && (
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
            {clientCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-500/60"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-300 group-hover:border-primary-500 group-hover:text-primary-900 dark:border-slate-700 dark:text-slate-400 dark:group-hover:border-primary-400 dark:group-hover:text-primary-50">
                      <CategoryIcon category={cat} className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 -translate-x-2 text-primary-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:text-primary-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {cat.name}
                  </h3>
                  {cat.post_count != null && (
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                      {cat.post_count} artikel
                    </p>
                  )}
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

      {!activeTag && (
        <section className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-500/60 md:p-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-300 group-hover:border-primary-500 group-hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-hover:border-primary-400 dark:group-hover:text-slate-50">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-slate-950 dark:text-white">
              About Envoyou
            </h2>
            <div className="mt-5 space-y-4 text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
              <p>
                Envoyou adalah publication platform yang berfokus pada Artificial Intelligence,
                teknologi, data, dan strategi digital.
              </p>
              <p>
                Kami menerbitkan riset, analisis, dan panduan praktis untuk membantu pembaca
                memahami perubahan teknologi dan bisnis modern.
              </p>
            </div>
            <Link
              href="/about"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-400 dark:hover:text-primary-400"
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Latest Feed */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            {activeTag
              ? `Latest in ${clientTags.find((t) => t.slug === activeTag)?.name || activeTag}`
              : 'Latest Feed'}
          </h2>
        </div>

        {feedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : isHydratingInitial ? (
          <div className="flex justify-center py-12 text-slate-500 dark:text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading articles...
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
                  <span className="text-slate-500 dark:text-slate-300 text-sm">
                    ({meta.total - posts.length} remaining)
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {!activeTag && trendingTags.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <Tags className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                Trending Topics
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Topik yang sedang paling banyak muncul di Envoyou.
              </p>
            </div>
          </div>
          <CategoryPills tags={trendingTags} currentTagSlug={activeTag} />
        </section>
      )}

      {/* Trending Section */}
      {!activeTag && clientTrendingPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              Trending Now
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {clientTrendingPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {!activeTag && (
        <section className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-500/60 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-2xl gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-300 group-hover:border-primary-500 group-hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:group-hover:border-primary-400 dark:group-hover:text-slate-50">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                  Meet The Author
                </p>
                <h2 className="font-serif text-2xl font-bold text-slate-950 dark:text-white">
                  Husni Kusuma
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                  Penulis Envoyou yang membahas AI, teknologi, data, dan strategi digital melalui
                  riset ringkas, analisis praktis, dan perspektif bisnis modern.
                </p>
              </div>
            </div>
            <Link
              href="/author/husni-kusuma"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-400 dark:hover:text-primary-400"
            >
              View Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
