import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/serverApi';
import { SITE_URL } from '@/lib/env';
import { Category } from '@/types';
import { Layers, ArrowRight, BookOpen } from 'lucide-react';
import CategoryIcon from '@/components/shared/CategoryIcon';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Explore all article categories on E-Blog — from AI, Technology, Business to Investment.',
  openGraph: {
    title: 'Categories | E-Blog',
    description: 'Explore all article categories on E-Blog.',
    url: `${SITE_URL}/categories`,
  },
};

interface CategoryWithCount extends Category {
  post_count?: number;
}

export default async function CategoriesPage() {
  let categories: CategoryWithCount[] = [];

  try {
    categories = await serverFetch<CategoryWithCount[]>('/categories', { revalidate: 3600 });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[CategoriesPage] Failed to fetch categories:', err);
    }
  }

  const sortedCategories = [...categories].sort(
    (a, b) => (b.post_count ?? 0) - (a.post_count ?? 0),
  );
  const featuredCategory = sortedCategories[0];
  const secondaryCategories = sortedCategories.slice(1);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10 md:py-16">

      {/* ── Header ──────────────────────────────── */}
      <header className="relative mb-12 overflow-hidden rounded-2xl bg-slate-950 px-6 py-12 text-center shadow-2xl shadow-slate-950/10 md:px-10 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(13,135,207,0.28),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/[0.06] text-white shadow-lg shadow-white/5">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="mb-4 font-serif text-4xl font-bold text-white md:text-5xl">
            Categories
          </h1>
          <p className="mx-auto max-w-lg text-base leading-7 text-slate-300 md:text-lg">
            Find articles that match your interests by exploring our categories.
          </p>
        </div>
      </header>

      {/* ── Grid ────────────────────────────────── */}
      {sortedCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <BookOpen className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No categories available.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {featuredCategory && (
            <Link
              key={featuredCategory.id}
              href={`/categories/${featuredCategory.slug}`}
              className="group grid gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-500/60 hover:bg-slate-100 dark:hover:bg-slate-800/50 md:grid-cols-[auto_1fr_auto] md:items-center md:p-8"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition-colors duration-300 group-hover:border-primary-500 group:hover:bg-primary-100 group-hover:text-primary-900 dark:border-slate-700 dark:group:hover:bg-slate-800 dark:text-slate-400 dark:group-hover:border-slate-50 dark:group-hover:text-primary-50">
                <CategoryIcon category={featuredCategory} className="h-8 w-8" />
              </div>

              <div>
                <div className="mb-3 inline-flex rounded-full border border-primary-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:border-primary-400/20 dark:text-primary-400">
                  Popular Topic
                </div>
                <h2 className="mb-3 font-serif text-2xl font-bold text-slate-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 md:text-3xl">
                  {featuredCategory.name}
                </h2>

                {featuredCategory.description && (
                  <p className="max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400 md:text-base">
                    {featuredCategory.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 md:flex-col md:items-end md:border-t-0 md:pt-0">
                {featuredCategory.post_count != null ? (
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    {featuredCategory.post_count} {featuredCategory.post_count === 1 ? 'article' : 'articles'}
                  </span>
                ) : (
                  <span />
                )}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition-all dark:text-primary-400 group-hover:gap-1.5">
                  View articles
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )}

          {secondaryCategories.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {secondaryCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/50 dark:hover:border-primary-500/60 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                >
                  <div>
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-300 group-hover:border-primary-500 group-hover:bg-primary-100 group-hover:text-primary-900 dark:border-slate-700 dark:group-hover:bg-slate-800 dark:text-slate-400 dark:group-hover:border-slate-50 dark:group-hover:text-primary-50">
                      <CategoryIcon category={cat} className="h-6 w-6" />
                    </div>

                    <h2 className="mb-2 text-base font-bold text-slate-900 transition-colors dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {cat.name}
                    </h2>

                    {cat.description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                    {cat.post_count != null ? (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {cat.post_count} {cat.post_count === 1 ? 'article' : 'articles'}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 transition-all dark:text-primary-400 group-hover:gap-1.5">
                      View articles
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

    </main>
  );
}
