'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { Post } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { Edit, Trash2, Eye, Globe, Lock, Loader2, CalendarClock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';

const LIMIT = 10;

export default function AdminPostsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const { data, isLoading } = useQuery({
    queryKey: ['admin-posts', page, debouncedSearch, statusFilter],
    queryFn: () => fetchPaginatedApi<Post>(`/posts/admin/list?${buildQuery()}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => fetchApi(`/posts/${id}`, { method: 'DELETE' })));
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });

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

  const posts = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages || 1;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Manage Posts</h1>
        <Link 
          href="/admin/posts/create"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create Post
        </Link>
      </div>

      {/* Search, Filter & Bulk Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => handleStatusChange(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none min-w-[140px] appearance-none cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>

        {/* Bulk Action */}
        {someSelected && (
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
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
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Views</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        {debouncedSearch || statusFilter
                          ? 'No posts match your filters.'
                          : 'No posts found. Create your first post!'}
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id} className={`transition-colors ${selectedIds.has(post.id) ? 'bg-primary-50 dark:bg-primary-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
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
                        <td className="px-4 py-4 whitespace-nowrap">
                          {post.status === 'scheduled' ? (
                            <div className="relative group">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 cursor-default">
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
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {post.status === 'published' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              {post.status}
                            </span>
                          )}
                        </td>
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
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {post.views || 0}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium pr-6">
                          <div className="flex items-center justify-end gap-3">
                            {post.status === 'published' && (
                              <Link 
                                href={`/posts/${post.slug}`}
                                target="_blank"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                title="View Public Page"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            )}
                            <Link 
                              href={`/admin/posts/${post.id}/edit`}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(post.id, post.title)}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing <span className="font-medium text-slate-700 dark:text-slate-300">{(page - 1) * LIMIT + 1}</span>
                  –<span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(page * LIMIT, meta?.total || 0)}</span>
                  {' '}of <span className="font-medium text-slate-700 dark:text-slate-300">{meta?.total || 0}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-primary-600 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
