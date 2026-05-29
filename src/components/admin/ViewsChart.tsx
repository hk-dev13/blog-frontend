'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DailyView {
  view_date: string;
  view_count: number;
  unique_visitors: number;
}

import { fetchApi } from '@/lib/api';

const numberFormatter = new Intl.NumberFormat('en-US');
const chartDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-blue-500">
            Views: <span className="font-medium">{payload[0].value}</span>
          </p>
          {payload[1] && (
            <p className="text-sm text-indigo-500">
              Unique: <span className="font-medium">{payload[1].value}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function ViewsChart({
  days = 14,
  onDaysChange,
  showRangeControls = true,
  height = 256,
  compact = false,
}: {
  days?: number;
  onDaysChange?: (days: number) => void;
  showRangeControls?: boolean;
  height?: number;
  compact?: boolean;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fillMissingDays = (rows: Array<DailyView & { formattedDate: string }>, windowDays: number) => {
    const byDate = new Map<string, DailyView & { formattedDate: string }>();
    rows.forEach(r => byDate.set(r.view_date, r));

    const todayUtc = new Date();
    const end = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate()));
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (windowDays - 1));

    const filled: Array<DailyView & { formattedDate: string }> = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const existing = byDate.get(key);
      if (existing) filled.push(existing);
      else {
        filled.push({
          view_date: key,
          view_count: 0,
          unique_visitors: 0,
          formattedDate: chartDateFormatter.format(new Date(key + 'T00:00:00Z')),
        });
      }
    }
    return filled;
  };

  const load = useCallback((windowDays: number) => {
    setIsLoading(true);
    setErrorMessage('');

    fetchApi<DailyView[]>(`/posts/admin/analytics/views?days=${windowDays}`)
      .then((rows) => {
        const formattedData = rows.map(d => ({
          ...d,
          formattedDate: chartDateFormatter.format(new Date(d.view_date + 'T00:00:00Z')),
        }));
        setData(fillMissingDays(formattedData, windowDays));
      })
      .catch((e: unknown) => {
        console.error('Error fetching chart data:', e);
        setErrorMessage(e instanceof Error ? e.message : 'Failed to load analytics');
        setData([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    load(days);
  }, [days, load]);

  if (!isMounted || isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Daily Views ({days} days)</h3>
          <button
            type="button"
            onClick={() => load(days)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            Retry
          </button>
        </div>
        <div className="h-56 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 text-center">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">Couldn&apos;t load analytics</div>
            <div className="mt-1">{errorMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 ${compact ? 'p-4' : 'p-6'}`}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Daily Views ({days} days)</h3>
        <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
          No analytics data yet.
        </div>
      </div>
    );
  }

  const totalViews = data.reduce((sum, d) => sum + d.view_count, 0);
  const totalVisitors = data.reduce((sum, d) => sum + d.unique_visitors, 0);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 ${compact ? 'p-4' : 'p-6'}`}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${compact ? 'mb-3' : 'mb-6'}`}>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Daily Views</h3>
          {showRangeControls && onDaysChange && (
            <div className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-1 py-1">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDaysChange(d)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    days === d ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          )}
        </div>
        {!compact && (
          <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              {numberFormatter.format(totalViews)} views
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              {numberFormatter.format(totalVisitors)} unique
            </span>
          </div>
        )}
      </div>

      <div className="w-full" style={{ width: '100%', height, minHeight: height }}>
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700 opacity-50" />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
            <Bar dataKey="view_count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="unique_visitors" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
