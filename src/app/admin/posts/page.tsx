'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { Category, Post, Tag } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { Edit, Trash2, Eye, Globe, Lock, Loader2, CalendarClock, Search, ChevronLeft, ChevronRight, Bookmark, SlidersHorizontal, X, Sparkles, Download, FolderSync } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';
import AdminLoadError from '@/components/admin/AdminLoadError';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';

const LIMIT = 10;

type SavedPostView = {
  id: string;
  name: string;
  search: string;
  statusFilter: string;
  createdAt: number;
};

type PostColumnPrefs = {
  category: boolean;
  status: boolean;
  date: boolean;
  views: boolean;
};

export default function AdminPostsPage() {
  const queryClient = useQueryClient();
  const user = useAppStore(state => state.user);
  const pushToast = useToastStore(state => state.push);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savedViews, setSavedViews] = useState<SavedPostView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>('');
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkTaxonomyOpen, setBulkTaxonomyOpen] = useState<null | 'categories' | 'tags'>(null);
  const [bulkSelectedCategoryIds, setBulkSelectedCategoryIds] = useState<string[]>([]);
  const [bulkSelectedTagIds, setBulkSelectedTagIds] = useState<string[]>([]);
  const [bulkFeaturedOpen, setBulkFeaturedOpen] = useState(false);

  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columns, setColumns] = useState<PostColumnPrefs>({
    category: true,
    status: true,
    date: true,
    views: true,
  });

  const storageKeyBase = `admin:savedViews:${user?.id || user?.email || 'anon'}:posts`;
  const viewsKey = `${storageKeyBase}:list`;
  const activeKey = `${storageKeyBase}:active`;
  const columnsKey = `${storageKeyBase}:columns`;

  const loadSavedViews = () => {
    try {
      const raw = localStorage.getItem(viewsKey);
      const parsed = raw ? (JSON.parse(raw) as SavedPostView[]) : [];
      if (Array.isArray(parsed)) setSavedViews(parsed);
    } catch {
      setSavedViews([]);
    }
  };

  const persistSavedViews = (next: SavedPostView[]) => {
    setSavedViews(next);
    try {
      localStorage.setItem(viewsKey, JSON.stringify(next));
    } catch {}
  };

  const applyView = (view: Pick<SavedPostView, 'search' | 'statusFilter'>) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearch(view.search);
    setDebouncedSearch(view.search);
    setStatusFilter(view.statusFilter);
    setPage(1);
  };

  const setActiveView = (id: string) => {
    setActiveViewId(id);
    try {
      if (id) localStorage.setItem(activeKey, id);
      else localStorage.removeItem(activeKey);
    } catch {}
  };

  // Load saved views (per user) + restore active view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadSavedViews();
    try {
      const active = localStorage.getItem(activeKey) || '';
      setActiveViewId(active);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewsKey, activeKey]);

  // Load column prefs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(columnsKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PostColumnPrefs>;
      setColumns(prev => ({
        category: parsed.category ?? prev.category,
        status: parsed.status ?? prev.status,
        date: parsed.date ?? prev.date,
        views: parsed.views ?? prev.views,
      }));
    } catch {}
  }, [columnsKey]);

  const setColumn = (key: keyof PostColumnPrefs, value: boolean) => {
    const next = { ...columns, [key]: value };
    setColumns(next);
    try {
      localStorage.setItem(columnsKey, JSON.stringify(next));
    } catch {}
  };

  // Apply active view when available
  useEffect(() => {
    if (!activeViewId) return;
    const view = savedViews.find(v => v.id === activeViewId);
    if (view) applyView(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeViewId, savedViews]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    return params.toString();
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-posts', page, debouncedSearch, statusFilter],
    queryFn: () => fetchPaginatedApi<Post>(`/posts/admin/list?${buildQuery()}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      pushToast({ variant: 'success', title: 'Post deleted' });
    },
    onError: (err: unknown) => {
      pushToast({
        variant: 'error',
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete post',
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => fetchApi(`/posts/${id}`, { method: 'DELETE' })));
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      pushToast({ variant: 'success', title: 'Bulk delete completed' });
    },
    onError: (err: unknown) => {
      pushToast({
        variant: 'error',
        title: 'Bulk delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete selected posts',
      });
    },
  });

  const bulkPublishNow = async (ids: string[]) => {
    await Promise.all(
      ids.map((id) =>
        fetchApi(`/posts/${id}/publish`, { method: 'POST', body: JSON.stringify({}) }),
      ),
    );
  };

  const bulkUnpublish = async (ids: string[]) => {
    await Promise.all(
      ids.map((id) =>
        fetchApi(`/posts/${id}/unpublish`, { method: 'POST' }),
      ),
    );
  };

  const bulkUpdatePosts = async (ids: string[], payload: Record<string, unknown>) => {
    await Promise.all(
      ids.map((id) =>
        fetchApi(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
      ),
    );
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedIds.size} selected post(s)? This cannot be undone.`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'admin-bulk'],
    queryFn: () => fetchPaginatedApi<Category>('/categories?limit=200'),
    enabled: bulkTaxonomyOpen === 'categories',
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags', 'admin-bulk'],
    queryFn: () => fetchPaginatedApi<Tag>('/tags?limit=200'),
    enabled: bulkTaxonomyOpen === 'tags',
  });

  const categories = categoriesData?.data || [];
  const tags = tagsData?.data || [];

  const posts = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages || 1;

  if (error instanceof Error && /401|403|Authentication required|Unauthorized|Forbidden/i.test(error.message)) {
    return <AdminSessionExpired />;
  }

  if (error instanceof Error) {
    return <AdminLoadError onRetry={() => void refetch()} />;
  }

  const allSelected = posts.length > 0 && posts.every(p => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        posts.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        posts.forEach(p => next.add(p.id));
        return next;
      });
    }
  };

  const selectedIdList = Array.from(selectedIds);
  const selectedCount = selectedIdList.length;
  const selectedPostsForCsv = selectedIdList.map((id) => posts.find(p => p.id === id)).filter(Boolean) as Post[];

  const visibleOptionalColumns = [
    columns.category,
    columns.status,
    columns.date,
    columns.views,
  ].filter(Boolean).length;
  const tableColSpan = 3 + visibleOptionalColumns; // select + title + actions + optional

  const exportPostsCsv = (rows: Post[], filename: string) => {
    const escapeCsv = (value: unknown) => {
      const s = String(value ?? '');
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = [
      'id',
      'title',
      'slug',
      'status',
      'is_featured',
      'views',
      'published_at',
      'created_at',
      'updated_at',
      'categories',
      'tags',
    ];
    const lines = [
      header.join(','),
      ...rows.map((p) => {
        const categoryNames = (p.categories || []).map(c => c.name).join('|');
        const tagNames = (p.tags || []).map(t => t.name).join('|');
        return [
          p.id,
          p.title,
          p.slug,
          p.status,
          p.is_featured ? 'true' : 'false',
          p.views ?? 0,
          p.published_at ?? '',
          p.created_at,
          p.updated_at,
          categoryNames,
          tagNames,
        ].map(escapeCsv).join(',');
      }),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    pushToast({ variant: 'success', title: 'CSV exported', description: filename });
  };

  const runBulk = async (fn: () => Promise<void>) => {
    setBulkError('');
    setBulkWorking(true);
    try {
      await fn();
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      pushToast({ variant: 'success', title: 'Bulk action completed' });
    } catch (err: unknown) {
      setBulkError(err instanceof Error ? err.message : 'Bulk action failed');
      pushToast({
        variant: 'error',
        title: 'Bulk action failed',
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setBulkWorking(false);
      setBulkMenuOpen(false);
      setBulkFeaturedOpen(false);
      setBulkTaxonomyOpen(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-10 shadow-2xl shadow-slate-950/10 md:px-10 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_0%,rgba(13,135,207,0.24),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.06] text-white shadow-lg shadow-white/5">
              <Edit className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white md:text-4xl">Manage Posts</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300 md:text-base">
              Search, filter, and manage your drafts, scheduled, and published posts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/posts/create"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-primary-400 hover:bg-primary-500/10"
            >
              Create Post
            </Link>
          </div>
        </div>
      </header>

      {/* Search, Filter & Bulk Action Bar */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => handleStatusChange(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none min-w-[140px] appearance-none cursor-pointer shadow-sm"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>

        {/* Bulk Action */}
        {someSelected && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setBulkMenuOpen(v => !v)}
              disabled={bulkWorking || bulkDeleteMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-950 hover:bg-slate-900 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              {bulkWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderSync className="w-4 h-4" />}
              Bulk actions ({selectedCount})
            </button>

            {bulkMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200/70 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Selected: {selectedCount}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Apply actions to selected posts.</p>
                </div>
                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => runBulk(() => bulkPublishNow(selectedIdList))}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-900/50"
                  >
                    <Globe className="h-4 w-4 text-slate-500" />
                    Publish now
                  </button>

                  <button
                    type="button"
                    onClick={() => runBulk(() => bulkUnpublish(selectedIdList))}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-900/50"
                  >
                    <Lock className="h-4 w-4 text-slate-500" />
                    Unpublish (set to draft)
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkFeaturedOpen(true)}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-900/50"
                  >
                    <Sparkles className="h-4 w-4 text-slate-500" />
                    Set featured…
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkSelectedCategoryIds([]);
                      setBulkTaxonomyOpen('categories');
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-900/50"
                  >
                    <FolderSync className="h-4 w-4 text-slate-500" />
                    Set categories…
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulkSelectedTagIds([]);
                      setBulkTaxonomyOpen('tags');
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-900/50"
                  >
                    <FolderSync className="h-4 w-4 text-slate-500" />
                    Set tags…
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportPostsCsv(selectedPostsForCsv, `posts-selected-${new Date().toISOString().slice(0, 10)}.csv`);
                      setBulkMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-900/50 disabled:opacity-50"
                    disabled={selectedPostsForCsv.length === 0}
                    title={selectedPostsForCsv.length === 0 ? 'CSV export only includes items from the current page' : undefined}
                  >
                    <Download className="h-4 w-4 text-slate-500" />
                    Export CSV (current page data)
                  </button>
                </div>
                <div className="p-2 border-t border-slate-200/70 dark:border-slate-800/70">
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending || bulkWorking}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete selected
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {bulkError && (
        <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {bulkError}
        </div>
      )}

      {/* Featured Bulk Modal */}
      {bulkFeaturedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Set featured</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Apply to {selectedCount} selected posts.</p>
              </div>
              <button
                type="button"
                onClick={() => setBulkFeaturedOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <button
                type="button"
                disabled={bulkWorking}
                onClick={() => runBulk(() => bulkUpdatePosts(selectedIdList, { is_featured: true }))}
                className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                Mark as featured
              </button>
              <button
                type="button"
                disabled={bulkWorking}
                onClick={() => runBulk(() => bulkUpdatePosts(selectedIdList, { is_featured: false }))}
                className="w-full rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white disabled:opacity-50 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-950"
              >
                Remove featured
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Taxonomy Bulk Modal */}
      {bulkTaxonomyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4 dark:border-slate-800/70">
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Set {bulkTaxonomyOpen === 'categories' ? 'categories' : 'tags'}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">This replaces current taxonomy on each selected post.</p>
              </div>
              <button
                type="button"
                onClick={() => setBulkTaxonomyOpen(null)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="max-h-[45vh] overflow-auto rounded-xl border border-slate-200/70 bg-white/60 p-2 dark:border-slate-800/70 dark:bg-slate-950/30">
                {bulkTaxonomyOpen === 'categories' ? (
                  categories.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No categories found.</div>
                  ) : (
                    <div className="space-y-1">
                      {categories.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-slate-100/70 dark:hover:bg-slate-900/50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.slug}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={bulkSelectedCategoryIds.includes(c.id)}
                            onChange={(e) => {
                              setBulkSelectedCategoryIds(prev => e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id));
                            }}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500"
                          />
                        </label>
                      ))}
                    </div>
                  )
                ) : tags.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No tags found.</div>
                ) : (
                  <div className="space-y-1">
                    {tags.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-slate-100/70 dark:hover:bg-slate-900/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{t.slug}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={bulkSelectedTagIds.includes(t.id)}
                          onChange={(e) => {
                            setBulkSelectedTagIds(prev => e.target.checked ? [...prev, t.id] : prev.filter(x => x !== t.id));
                          }}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBulkTaxonomyOpen(null)}
                  className="rounded-xl border border-slate-200/70 bg-white/70 px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={bulkWorking}
                  onClick={() => {
                    if (bulkTaxonomyOpen === 'categories') {
                      runBulk(() => bulkUpdatePosts(selectedIdList, { category_ids: bulkSelectedCategoryIds }));
                    } else {
                      runBulk(() => bulkUpdatePosts(selectedIdList, { tag_ids: bulkSelectedTagIds }));
                    }
                  }}
                  className="rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    applyView({ search: '', statusFilter: '' });
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
                            {v.search ? `Search: “${v.search}”` : 'Search: —'} • {v.statusFilter ? `Status: ${v.statusFilter}` : 'Status: all'}
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
                const view: SavedPostView = {
                  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                  name,
                  search,
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
                  placeholder="e.g. Scheduled posts"
                  className="w-full rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-white"
                  autoFocus
                />
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-xs text-slate-600 dark:border-slate-800/70 dark:bg-slate-950/30 dark:text-slate-300">
                <div className="font-semibold text-slate-700 dark:text-slate-200">Will save</div>
                <div className="mt-1">Search: {search ? `“${search}”` : '—'}</div>
                <div>Status: {statusFilter || 'all'}</div>
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
                    { key: 'category' as const, label: 'Category' },
                    { key: 'status' as const, label: 'Status' },
                    { key: 'date' as const, label: 'Date' },
                    { key: 'views' as const, label: 'Views' },
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
                    const next: PostColumnPrefs = { category: true, status: true, date: true, views: true };
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
      <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-800/70 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50/60 dark:bg-slate-950/40">
                  <tr>
                    <th scope="col" className="pl-6 pr-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                    {columns.category && (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                    )}
                    {columns.status && (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    )}
                    {columns.date && (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    )}
                    {columns.views && (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Views</th>
                    )}
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/40 dark:bg-slate-900/20 divide-y divide-slate-200 dark:divide-slate-800">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={tableColSpan} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        {debouncedSearch || statusFilter
                          ? 'No posts match your filters.'
                          : 'No posts found. Create your first post!'}
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id} className={`transition-colors ${selectedIds.has(post.id) ? 'bg-primary-50/80 dark:bg-primary-900/10' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'}`}>
                        <td className="pl-6 pr-2 py-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(post.id)}
                            onChange={() => toggleSelect(post.id)}
                            className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-slate-900 dark:text-white max-w-[200px] truncate">{post.title}</div>
                            {post.source === 'eai' && (
                              <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                                EAI
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">/{post.slug}</div>
                          {post.source_ref && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">{post.source_ref}</div>
                          )}
                        </td>
                        {columns.category && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {(post as any).categories && (post as any).categories.length > 0 ? (
                                (post as any).categories.map((cat: any) => (
                                  <span key={cat.id} className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                    {cat.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400 italic">—</span>
                              )}
                            </div>
                          </td>
                        )}
                        {columns.status && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            {post.status === 'scheduled' ? (
                              <div className="relative group">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 cursor-default">
                                  <CalendarClock className="w-3.5 h-3.5" />
                                  scheduled
                                </span>
                                {post.published_at && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                    <div className="font-medium">Scheduled for:</div>
                                    <div>{format(new Date(post.published_at), 'MMM d, yyyy • HH:mm')} WIB</div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                post.status === 'published'
                                  ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {post.status === 'published' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                {post.status}
                              </span>
                            )}
                          </td>
                        )}
                        {columns.date && (
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {post.status === 'scheduled' && post.published_at ? (
                              <div>
                                <div>{format(new Date(post.published_at), 'MMM d, yyyy')}</div>
                                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">{format(new Date(post.published_at), 'HH:mm')} WIB</div>
                              </div>
                            ) : post.status === 'published' && post.published_at ? (
                              format(new Date(post.published_at), 'MMM d, yyyy')
                            ) : (
                              format(new Date(post.created_at), 'MMM d, yyyy')
                            )}
                          </td>
                        )}
                        {columns.views && (
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {post.views || 0}
                          </td>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium pr-6">
                          <div className="flex items-center justify-end gap-3">
                            {post.status === 'published' && (
                              <Link 
                                href={`/posts/${post.slug}`}
                                target="_blank"
                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                title="View Public Page"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            )}
                            <Link 
                              href={`/admin/posts/${post.id}/edit`}
                              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(post.id, post.title)}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/70 dark:border-slate-800/70 bg-white/40 dark:bg-slate-900/20">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing <span className="font-medium text-slate-700 dark:text-slate-300">{(page - 1) * LIMIT + 1}</span>
                  –<span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(page * LIMIT, meta?.total || 0)}</span>
                  {' '}of <span className="font-medium text-slate-700 dark:text-slate-300">{meta?.total || 0}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-sm font-semibold transition-colors ${
                        p === page
                          ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
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
          </>
        )}
      </div>
    </div>
  );
}
