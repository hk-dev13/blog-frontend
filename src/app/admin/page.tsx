'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPaginatedApi } from '@/lib/api';
import { Post } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, Eye, TrendingUp, PenLine, Loader2, Calendar, Clock } from 'lucide-react';
import ViewsChart from '@/components/admin/ViewsChart';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-posts'],
    queryFn: () => fetchPaginatedApi<Post>('/posts/admin/list?limit=100'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const posts = data?.data || [];
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
  const draftPosts = posts.filter(p => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const recentPosts = posts.slice(0, 5);

  const stats = [
    { label: 'Total Posts', value: totalPosts, icon: FileText, color: 'bg-blue-500' },
    { label: 'Published', value: publishedPosts, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Scheduled', value: scheduledPosts, icon: Calendar, color: 'bg-orange-500' },
    { label: 'Drafts', value: draftPosts, icon: PenLine, color: 'bg-yellow-500' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Views Chart */}
      <ViewsChart />

      {/* Recent Posts */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Posts</h2>
          <Link href="/admin/posts" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {recentPosts.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No posts yet. <Link href="/admin/posts/create" className="text-primary-600 hover:underline">Create your first post!</Link>
            </div>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">/{post.slug}</p>
                    <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                    <p className="text-xs text-slate-400">
                      {post.status === 'published' || post.status === 'scheduled'
                        ? format(new Date(post.published_at || post.created_at), 'MMM d, yyyy')
                        : format(new Date(post.created_at), 'MMM d, yyyy')
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.status === 'published'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : post.status === 'scheduled'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {post.status}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {post.views || 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
