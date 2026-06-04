'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { BarChart3, ExternalLink, Loader2, Download } from 'lucide-react';
import ViewsChart from '@/components/admin/ViewsChart';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';
import AdminLoadError from '@/components/admin/AdminLoadError';

type TopPostRow = {
  post_id: string;
  title: string;
  slug: string;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  view_count: number;
  unique_visitors: number;
};

const numberFormatter = new Intl.NumberFormat('en-US');

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-analytics-top', days],
    queryFn: () => fetchApi<TopPostRow[]>(`/posts/admin/analytics/top?days=${days}&limit=25`),
  });

  const topPosts = useMemo(() => data || [], [data]);

  const totals = useMemo(() => {
    return topPosts.reduce(
      (acc, p) => {
        acc.views += p.view_count || 0;
        acc.unique += p.unique_visitors || 0;
        return acc;
      },
      { views: 0, unique: 0 },
    );
  }, [topPosts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error instanceof Error && /401|403|Authentication required|Unauthorized|Forbidden/i.test(error.message)) {
    return <AdminSessionExpired />;
  }

  if (error instanceof Error) {
    return <AdminLoadError title="We couldn't load analytics right now." onRetry={() => void refetch()} />;
  }

  const exportTopPostsCsv = () => {
    const escapeCsv = (value: unknown) => {
      const s = String(value ?? '');
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = ['post_id', 'title', 'slug', 'published_at', 'views', 'unique_visitors', 'is_featured'];
    const lines = [
      header.join(','),
      ...topPosts.map((p) => ([
        p.post_id,
        p.title,
        p.slug,
        p.published_at ?? '',
        p.view_count,
        p.unique_visitors,
        p.is_featured ? 'true' : 'false',
      ].map(escapeCsv).join(','))),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top-posts-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="admin-page-hero overflow-hidden">
        <div className="admin-page-hero-bg" />
        <div className="admin-page-hero-content">
          <div className="max-w-2xl">
            <div className="admin-page-hero-icon">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="admin-page-title">Analytics</h1>
            <p className="admin-page-description">
              Track real audience interest for editorial and ads decisions.
            </p>
          </div>
          <div className="admin-hero-actions">
            <div className="admin-segmented">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  data-active={days === d}
                  className="admin-segmented-item"
                >
                  {d}d
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportTopPostsCsv}
              className="admin-hero-button"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <ViewsChart days={days} onDaysChange={setDays} showRangeControls={false} height={320} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Top Posts</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ranked by total views in the selected window.
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {numberFormatter.format(totals.views)} views • {numberFormatter.format(totals.unique)} unique
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200/70 dark:border-slate-800/70 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-6 py-4">Post</th>
                  <th className="px-6 py-4 text-right">Views</th>
                  <th className="px-6 py-4 text-right">Unique</th>
                  <th className="px-6 py-4 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {topPosts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      No data yet for this window.
                    </td>
                  </tr>
                ) : (
                  topPosts.map((p) => (
                    <tr key={p.post_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 min-w-[320px]">
                        <div className="font-semibold text-slate-950 dark:text-white truncate">{p.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">/{p.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-950 dark:text-white tabular-nums">
                        {numberFormatter.format(p.view_count)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300 tabular-nums">
                        {numberFormatter.format(p.unique_visitors)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/posts/${p.post_id}/edit`}
                            className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/posts/${p.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                            title="Open public page"
                          >
                            View <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Notes</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Data comes from daily aggregation (`post_views_daily`).</li>
            <li>Days with no traffic are shown as 0 to avoid misleading gaps.</li>
            <li>Use Top Posts to prioritize updates, internal linking, and ad placements.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
