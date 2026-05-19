'use client';

import { useEffect, useState } from 'react';

interface DailyView {
  view_date: string;
  view_count: number;
  unique_visitors: number;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const numberFormatter = new Intl.NumberFormat('en-US');
const chartDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export default function ViewsChart() {
  const [data, setData] = useState<DailyView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch directly from Supabase — post_views_daily is readable by anon
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const since = cutoff.toISOString().split('T')[0];

    fetch(
      `${SUPABASE_URL}/rest/v1/post_views_daily?view_date=gte.${since}&order=view_date.asc&select=view_date,view_count,unique_visitors`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
      },
    )
      .then((r) => r.json())
      .then((rows: DailyView[]) => {
        // Aggregate by date (multiple posts per day → sum)
        const byDate = new Map<string, DailyView>();
        for (const row of rows) {
          const existing = byDate.get(row.view_date);
          if (existing) {
            existing.view_count += row.view_count;
            existing.unique_visitors += row.unique_visitors;
          } else {
            byDate.set(row.view_date, { ...row });
          }
        }
        setData(Array.from(byDate.values()));
      })
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="h-52 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Daily Views (14 days)</h3>
        <div className="h-52 flex items-center justify-center text-sm text-slate-400">
          No analytics data yet. Data akan muncul setelah pg_cron berjalan (01:00 UTC).
        </div>
      </div>
    );
  }

  const maxViews = Math.max(...data.map((d) => d.view_count), 1);
  const totalViews = data.reduce((sum, d) => sum + d.view_count, 0);
  const totalVisitors = data.reduce((sum, d) => sum + d.unique_visitors, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Daily Views (14 days)</h3>
        <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
            {numberFormatter.format(totalViews)} views
          </span>
          <span>{numberFormatter.format(totalVisitors)} unique</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end gap-1.5 h-48">
        {data.map((day) => {
          const height = (day.view_count / maxViews) * 100;
          const label = chartDateFormatter.format(new Date(day.view_date + 'T00:00:00Z'));

          return (
            <div key={day.view_date} className="flex-1 flex flex-col items-center group">
              {/* Count tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 whitespace-nowrap">
                {day.view_count}
              </div>

              {/* Bar */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t bg-primary-500/75 hover:bg-primary-500 transition-colors duration-200 min-h-[3px]"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${label}: ${day.view_count} views · ${day.unique_visitors} unique`}
                />
              </div>

              {/* Date label */}
              <span className="text-[10px] text-slate-400 mt-1.5 hidden md:block">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
