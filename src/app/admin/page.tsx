'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPaginatedApi } from '@/lib/api';
import { Post } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, Eye, TrendingUp, PenLine, Loader2, Calendar } from 'lucide-react';
import ViewsChart from '@/components/admin/ViewsChart';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';
import AdminLoadError from '@/components/admin/AdminLoadError';

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
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

  if (error instanceof Error && /401|403|Authentication required|Unauthorized|Forbidden/i.test(error.message)) {
    return <AdminSessionExpired />;
  }

  if (error instanceof Error) {
    return <AdminLoadError onRetry={() => void refetch()} />;
  }

  const posts = data?.data || [];
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
  const draftPosts = posts.filter(p => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const recentPosts = posts.slice(0, 5);

  const stats = [
    { label: 'Total Posts', value: totalPosts, icon: FileText, color: 'bg-slate-900 dark:bg-slate-800' },
    { label: 'Published', value: publishedPosts, icon: TrendingUp, color: 'bg-slate-900 dark:bg-slate-800' },
    { label: 'Scheduled', value: scheduledPosts, icon: Calendar, color: 'bg-slate-900 dark:bg-slate-800' },
    { label: 'Drafts', value: draftPosts, icon: PenLine, color: 'bg-slate-900 dark:bg-slate-800' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'bg-slate-900 dark:bg-slate-800' },
  ];

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-10 shadow-2xl shadow-slate-950/10 md:px-10 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_0%,rgba(13,135,207,0.26),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.18),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.06] text-white shadow-lg shadow-white/5">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white md:text-4xl">Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300 md:text-base">
              A quick overview of content performance and recent activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/posts/create"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-primary-400 hover:bg-primary-500/10"
            >
              Create Post
            </Link>
            <Link
              href="/admin/posts"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-primary-400 hover:bg-primary-500/10"
            >
              Manage Posts
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 dark:border-slate-800/70 dark:bg-slate-900/50"
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-2xl shadow-sm ring-4 ring-white/40 dark:ring-white/5`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-slate-950 dark:text-white tabular-nums">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Views Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ViewsChart days={7} showRangeControls={false} height={160} compact />
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Analytics</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-6">
            Open detailed trends, top posts, and export reports for editorial and ads decisions.
          </p>
          <Link
            href="/admin/analytics"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            Open Analytics →
          </Link>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
        <div className="relative overflow-hidden border-b border-slate-200/70 p-6 dark:border-slate-800/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(13,135,207,0.12),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.55),transparent)] dark:bg-[radial-gradient(circle_at_30%_0%,rgba(13,135,207,0.18),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent Posts</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Latest updates across drafts, scheduled, and published posts.</p>
            </div>
            <Link href="/admin/posts" className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              View all →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {recentPosts.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No posts yet. <Link href="/admin/posts/create" className="text-primary-600 hover:underline">Create your first post!</Link>
            </div>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white truncate">{post.title}</p>
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
