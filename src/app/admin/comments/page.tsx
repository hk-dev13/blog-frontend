'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPaginatedApi, fetchApi } from '@/lib/api';
import { Comment } from '@/types';
import { format } from 'date-fns';
import { Loader2, CheckCircle, XCircle, Search, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface AdminComment extends Comment {
  post_title: string;
  post_slug: string;
}

export default function AdminCommentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const limit = 10;

  const { data, isLoading } = useQuery({
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
    }
  });

  const handleModerate = (id: string, status: 'approved' | 'rejected') => {
    moderateMutation.mutate({ id, status });
  };

  const comments = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">Manage Comments</h1>
          <p className="text-sm text-slate-500 mt-1">Moderate user feedback and discussion</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none min-w-[140px] appearance-none cursor-pointer w-full sm:w-auto"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
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
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Post</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{comment.name}</div>
                      <div className="text-sm text-slate-500">{comment.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 max-w-md" title={comment.content}>
                        {comment.content}
                      </p>
                    </td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        comment.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                        comment.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                      }`}>
                        {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                      </span>
                    </td>
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
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
          <div className="text-sm text-slate-500">
            Showing page <span className="font-medium text-slate-900 dark:text-white">{meta.page}</span> of{' '}
            <span className="font-medium text-slate-900 dark:text-white">{meta.totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
