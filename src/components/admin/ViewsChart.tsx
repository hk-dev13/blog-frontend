'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

interface DailyView {
  view_date: string;
  view_count: number;
  unique_visitors: number;
}

export default function ViewsChart() {
  const [data, setData] = useState<DailyView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApi<DailyView[]>('/analytics/daily-views?days=14')
      .then(setData)
      .catch(() => {
        // Fallback: fetch directly from Supabase if admin API doesn't support this
        setData([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Daily Views (14 days)</h3>
        <div className="h-48 flex items-center justify-center text-sm text-slate-400">
          No analytics data yet. Views will appear after the daily aggregation runs.
        </div>
      </div>
    );
  }

  // Find max for scale
  const maxViews = Math.max(...data.map((d) => d.view_count), 1);
  const totalViews = data.reduce((sum, d) => sum + d.view_count, 0);
  const totalVisitors = data.reduce((sum, d) => sum + d.unique_visitors, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Daily Views (14 days)</h3>
        <div className="flex gap-4 text-xs text-slate-500">
          <span>{totalViews} views</span>
          <span>{totalVisitors} unique</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end gap-1.5 h-48">
        {data.map((day) => {
          const height = (day.view_count / maxViews) * 100;
          const date = new Date(day.view_date);
          const label = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

          return (
            <div key={day.view_date} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                {day.view_count}
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-t-sm bg-primary-500/80 hover:bg-primary-500 transition-all duration-200 min-h-[2px]"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${label}: ${day.view_count} views, ${day.unique_visitors} unique`}
              />

              {/* Date label (show every other on small screens) */}
              <span className="text-[10px] text-slate-400 mt-1 hidden sm:block">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
