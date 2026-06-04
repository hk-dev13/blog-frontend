'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPaginatedApi, fetchApi } from '@/lib/api';
import { Comment } from '@/types';
import { format } from 'date-fns';
import { Loader2, CheckCircle, XCircle, MessageSquare, ExternalLink, Bookmark, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';
import AdminLoadError from '@/components/admin/AdminLoadError';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';

interface AdminComment extends Comment {
  post_title: string;
  post_slug: string;
}

type SavedCommentView = {
  id: string;
  name: string;
  statusFilter: string;
  createdAt: number;
};

type CommentColumnPrefs = {
  comment: boolean;
  post: boolean;
  date: boolean;
  status: boolean;
};

export default function AdminCommentsPage() {
  const queryClient = useQueryClient();
  const user = useAppStore(state => state.user);
  const pushToast = useToastStore(state => state.push);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const limit = 10;
  const [savedViews, setSavedViews] = useState<SavedCommentView[]>([]);
  const [activeViewId, setActiveViewId] = useState('');
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columns, setColumns] = useState<CommentColumnPrefs>({
    comment: true,
    post: true,
    date: true,
    status: true,
  });

  const storageKeyBase = `admin:savedViews:${user?.id || user?.email || 'anon'}:comments`;
  const viewsKey = `${storageKeyBase}:list`;
  const activeKey = `${storageKeyBase}:active`;
  const columnsKey = `${storageKeyBase}:columns`;

  const loadSavedViews = useCallback(() => {
    try {
      const raw = localStorage.getItem(viewsKey);
      const parsed = raw ? (JSON.parse(raw) as SavedCommentView[]) : [];
      if (Array.isArray(parsed)) setSavedViews(parsed);
    } catch {
      setSavedViews([]);
    }
  }, [viewsKey]);

  const persistSavedViews = (next: SavedCommentView[]) => {
    setSavedViews(next);
    try {
      localStorage.setItem(viewsKey, JSON.stringify(next));
    } catch {}
  };

  const applyView = useCallback((view: Pick<SavedCommentView, 'statusFilter'>) => {
    setStatusFilter(view.statusFilter);
    setPage(1);
  }, []);

  const setActiveView = (id: string) => {
    setActiveViewId(id);
    try {
      if (id) localStorage.setItem(activeKey, id);
      else localStorage.removeItem(activeKey);
    } catch {}
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadSavedViews();
    try {
      const active = localStorage.getItem(activeKey) || '';
      setActiveViewId(active);
    } catch {}
  }, [activeKey, loadSavedViews]);

  // Load column prefs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(columnsKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CommentColumnPrefs>;
      setColumns(prev => ({
        comment: parsed.comment ?? prev.comment,
        post: parsed.post ?? prev.post,
        date: parsed.date ?? prev.date,
        status: parsed.status ?? prev.status,
      }));
    } catch {}
  }, [columnsKey]);

  const setColumn = (key: keyof CommentColumnPrefs, value: boolean) => {
    const next = { ...columns, [key]: value };
    setColumns(next);
    try {
      localStorage.setItem(columnsKey, JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    if (!activeViewId) return;
    const view = savedViews.find(v => v.id === activeViewId);
    if (view) applyView(view);
  }, [activeViewId, applyView, savedViews]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-comments', page, statusFilter],
    queryFn: () => {
      let url = `/comments/admin/list?page=${page}&limit=${limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      return fetchPaginatedApi<AdminComment>(url);
    },
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => 
      fetchApi(`/comments/${id}/moderate`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      pushToast({ variant: 'success', title: 'Comment updated' });
    }
    ,
    onError: (err: unknown) => {
      pushToast({ variant: 'error', title: 'Moderation failed', description: err instanceof Error ? err.message : 'Unable to update comment' });
    }
  });

  const handleModerate = (id: string, status: 'approved' | 'rejected') => {
    moderateMutation.mutate({ id, status });
  };

  const comments = data?.data || [];
  const meta = data?.meta;

  if (error instanceof Error && /401|403|Authentication required|Unauthorized|Forbidden/i.test(error.message)) {
    return <AdminSessionExpired />;
  }

  if (error instanceof Error) {
    return <AdminLoadError onRetry={() => void refetch()} />;
  }

  const visibleOptionalColumns = [
    columns.comment,
    columns.post,
    columns.date,
    columns.status,
  ].filter(Boolean).length;
  const tableColSpan = 2 + visibleOptionalColumns; // author + actions + optional

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="admin-page-hero overflow-hidden">
        <div className="admin-page-hero-bg" />
        <div className="admin-page-hero-content">
          <div className="max-w-2xl">
            <div className="admin-page-hero-icon">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h1 className="admin-page-title">Manage Comments</h1>
            <p className="admin-page-description">
              Review, approve, or reject user discussions.
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="admin-surface flex flex-col sm:flex-row gap-4 items-center justify-between p-4">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              loadSavedViews();
              setViewsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-950"
            title="Saved views"
          >
            <Bookmark className="h-4 w-4" />
            Views
          </button>

          {savedViews.length > 0 && (
            <select
              value={activeViewId}
              onChange={(e) => {
                const id = e.target.value;
                setActiveView(id);
                const view = savedViews.find(v => v.id === id);
                if (view) applyView(view);
              }}
              className="min-w-[180px] px-3.5 py-2.5 text-sm bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
              title="Select a saved view"
            >
              <option value="">Default</option>
              {savedViews.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={() => setColumnsOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-950"
          title="Column preferences"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Columns
        </button>

        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none min-w-[140px] appearance-none cursor-pointer w-full sm:w-auto shadow-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Views Modal */}
      {viewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Saved views</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Persisted per user in this browser.</p>
              </div>
              <button
                type="button"
                onClick={() => setViewsModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewViewName('');
                    setSaveModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  Save current view
                </button>
                <button
                  type="button"
                  onClick={() => {
                    applyView({ statusFilter: '' });
                    setActiveView('');
                    setViewsModalOpen(false);
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-950"
                >
                  Reset to default
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {savedViews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200/70 p-6 text-center dark:border-slate-800/70">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">No saved views yet</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Save your current filters to reuse later.</p>
                  </div>
                ) : (
                  savedViews
                    .slice()
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{v.name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {v.statusFilter ? `Status: ${v.statusFilter}` : 'Status: all'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              applyView(v);
                              setActiveView(v.id);
                              setViewsModalOpen(false);
                            }}
                            className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                          >
                            Apply
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = savedViews.filter(x => x.id !== v.id);
                              persistSavedViews(next);
                              if (activeViewId === v.id) setActiveView('');
                            }}
                            className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-950"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save View Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Save view</h3>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              className="p-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const name = newViewName.trim();
                if (!name) return;
                const view: SavedCommentView = {
                  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                  name,
                  statusFilter,
                  createdAt: Date.now(),
                };
                const next = [view, ...savedViews].slice(0, 30);
                persistSavedViews(next);
                setActiveView(view.id);
                setSaveModalOpen(false);
                setViewsModalOpen(false);
              }}
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g. Pending comments"
                  className="w-full rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-white"
                  autoFocus
                />
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-xs text-slate-600 dark:border-slate-800/70 dark:bg-slate-950/30 dark:text-slate-300">
                <div className="font-semibold text-slate-700 dark:text-slate-200">Will save</div>
                <div className="mt-1">Status: {statusFilter || 'all'}</div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="rounded-xl border border-slate-200/70 bg-white/70 px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Columns Modal */}
      {columnsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Columns</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Saved per user in this browser.</p>
              </div>
              <button
                type="button"
                onClick={() => setColumnsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {(
                  [
                    { key: 'comment' as const, label: 'Comment' },
                    { key: 'post' as const, label: 'Post' },
                    { key: 'date' as const, label: 'Date' },
                    { key: 'status' as const, label: 'Status' },
                  ] as const
                ).map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40"
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                    <input
                      type="checkbox"
                      checked={columns[key]}
                      onChange={(e) => setColumn(key, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500"
                    />
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next: CommentColumnPrefs = { comment: true, post: true, date: true, status: true };
                    setColumns(next);
                    try { localStorage.setItem(columnsKey, JSON.stringify(next)); } catch {}
                  }}
                  className="rounded-xl border border-slate-200/70 bg-white/70 px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-950"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setColumnsOpen(false)}
                  className="rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="admin-surface overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <MessageSquare className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-900 dark:text-white">No comments found</p>
            <p className="text-sm">Try changing your filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200/70 dark:border-slate-800/70 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-6 py-4">Author</th>
                  {columns.comment && <th className="px-6 py-4">Comment</th>}
                  {columns.post && <th className="px-6 py-4">Post</th>}
                  {columns.date && <th className="px-6 py-4">Date</th>}
                  {columns.status && <th className="px-6 py-4">Status</th>}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{comment.name}</div>
                      <div className="text-sm text-slate-500">{comment.email}</div>
                    </td>
                    {columns.comment && (
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 max-w-md" title={comment.content}>
                          {comment.content}
                        </p>
                      </td>
                    )}
                    {columns.post && (
                      <td className="px-6 py-4">
                        <Link 
                          href={`/posts/${comment.post_slug}`}
                          target="_blank"
                          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 max-w-[200px] truncate"
                          title={comment.post_title}
                        >
                          {comment.post_title}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </Link>
                      </td>
                    )}
                    {columns.date && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                    )}
                    {columns.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          comment.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                          comment.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                        }`}>
                          {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {comment.status !== 'approved' && (
                          <button
                            onClick={() => handleModerate(comment.id, 'approved')}
                            disabled={moderateMutation.isPending}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        {comment.status !== 'rejected' && (
                          <button
                            onClick={() => handleModerate(comment.id, 'rejected')}
                            disabled={moderateMutation.isPending}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/50 px-4 py-3 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl shadow-sm">
          <div className="text-sm text-slate-500">
            Showing page <span className="font-medium text-slate-900 dark:text-white">{meta.page}</span> of{' '}
            <span className="font-medium text-slate-900 dark:text-white">{meta.totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-200/70 dark:border-slate-800/70 rounded-xl text-sm font-semibold hover:bg-white/70 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1.5 border border-slate-200/70 dark:border-slate-800/70 rounded-xl text-sm font-semibold hover:bg-white/70 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
