'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPaginatedApi } from '@/lib/api';
import { useState } from 'react';
import { History, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';
import AdminLoadError from '@/components/admin/AdminLoadError';

type ActivityLog = {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  meta: any;
  created_at: string;
};

const LIMIT = 20;

export default function AdminActivityPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    if (entityType) params.set('entityType', entityType);
    if (action) params.set('action', action);
    return params.toString();
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-activity', page, entityType, action],
    queryFn: () => fetchPaginatedApi<ActivityLog>(`/activity?${buildQuery()}`),
  });

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
    return <AdminLoadError title="We couldn't load activity logs right now." onRetry={() => void refetch()} />;
  }

  const rows = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="admin-page-hero overflow-hidden">
        <div className="admin-page-hero-bg" />
        <div className="admin-page-hero-content">
          <div className="max-w-2xl">
            <div className="admin-page-hero-icon">
              <History className="h-5 w-5" />
            </div>
            <h1 className="admin-page-title">Activity</h1>
            <p className="admin-page-description">
              Lightweight audit log of key actions in the admin panel.
            </p>
          </div>
        </div>
      </header>

      <div className="admin-surface flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Filter className="h-4 w-4 text-slate-500" />
          Filters
        </div>
        <input
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          placeholder="entityType (e.g. post, tag)"
          className="w-full sm:w-auto min-w-[220px] px-4 py-2.5 text-sm bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
        />
        <input
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          placeholder="action (e.g. post.publish)"
          className="w-full sm:w-auto min-w-[260px] px-4 py-2.5 text-sm bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
        />
      </div>

      <div className="admin-surface overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">No activity yet</p>
            <p className="mt-1 text-xs">Actions will appear here once you start managing content.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200/70 dark:border-slate-800/70 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{r.action}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">role: {r.actor_role}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{r.entity_type}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">{r.entity_id || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <pre className="max-w-[520px] whitespace-pre-wrap break-words text-xs text-slate-600 dark:text-slate-300">
                        {r.meta ? JSON.stringify(r.meta, null, 2) : '—'}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/50 px-4 py-3 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl shadow-sm">
          <div className="text-sm text-slate-500">
            Page <span className="font-semibold text-slate-900 dark:text-white">{meta?.page}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{meta?.totalPages}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
