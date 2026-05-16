import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/serverApi';
import { Category } from '@/types';
import { Layers, ArrowRight, BookOpen } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Jelajahi semua kategori artikel di Envoyou — dari AI & Teknologi, Bisnis, Investasi, hingga Web3.',
  openGraph: {
    title: 'Categories | Envoyou',
    description: 'Jelajahi semua kategori artikel di Envoyou.',
    url: 'https://blog.envoyou.com/categories',
  },
};

interface CategoryWithCount extends Category {
  post_count?: number;
}

// Warna aksen per index agar grid terasa hidup
const ACCENT_COLORS = [
  'from-blue-500 to-primary-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
  'from-indigo-500 to-blue-600',
  'from-lime-500 to-green-600',
];

export default async function CategoriesPage() {
  let categories: CategoryWithCount[] = [];

  try {
    categories = await serverFetch<CategoryWithCount[]>('/categories', { revalidate: 3600 });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[CategoriesPage] Failed to fetch categories:', err);
    }
  }

  return (
    <main className="container mx-auto px-4 py-16 max-w-5xl">

      {/* ── Header ──────────────────────────────── */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 mb-4">
          <Layers className="w-5 h-5" />
        </div>
        <h1 className="text-4xl font-bold font-serif text-slate-900 dark:text-white mb-3">
          Categories
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Temukan artikel berdasarkan topik yang paling relevan untuk Anda.
        </p>
      </div>

      {/* ── Grid ────────────────────────────────── */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <BookOpen className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">Belum ada kategori tersedia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, i) => {
            const gradient = ACCENT_COLORS[i % ACCENT_COLORS.length];
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />

                <div>
                  {/* Category icon / initial */}
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white font-bold text-sm mb-4 shadow-sm`}>
                    {cat.name.charAt(0).toUpperCase()}
                  </div>

                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {cat.name}
                  </h2>

                  {cat.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {cat.post_count != null ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {cat.post_count} artikel
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-1.5 transition-all">
                    Lihat artikel
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </main>
  );
}
