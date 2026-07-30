'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPaginatedApi } from '@/lib/api';
import { Post } from '@/types';
import Link from 'next/link';
import {
  FileText,
  Eye,
  TrendingUp,
  PenLine,
  Loader2,
  Calendar,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import ViewsChart from '@/components/admin/ViewsChart';
import AdminSessionExpired from '@/components/admin/AdminSessionExpired';
import AdminLoadError from '@/components/admin/AdminLoadError';
import { safeFormatDate } from '@/lib/editorUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard-posts'],
    queryFn: () => fetchPaginatedApi<Post>('/posts/admin/list?limit=100'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    { label: 'Total Posts', value: totalPosts, icon: FileText, subtext: 'All articles in system', badge: 'Active' },
    { label: 'Published', value: publishedPosts, icon: TrendingUp, subtext: 'Live on website', badge: 'Live' },
    { label: 'Scheduled', value: scheduledPosts, icon: Calendar, subtext: 'Upcoming publication', badge: 'Queued' },
    { label: 'Drafts', value: draftPosts, icon: PenLine, subtext: 'Work in progress', badge: 'In Dev' },
    { label: 'Total Views', value: totalViews, icon: Eye, subtext: 'Cumulative readers', badge: '+12.5%' },
  ];

  const getSafeTime = (d?: string) => {
    if (!d) return 0;
    const t = new Date(d).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Content performance overview and publication activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-xl font-semibold gap-1.5">
            <Link href="/admin/posts/create">
              <Plus className="w-4 h-4" /> Create Post
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl font-semibold">
            <Link href="/admin/posts">
              Manage Posts
            </Link>
          </Button>
        </div>
      </div>

      {/* SectionCards (Shadcn Dashboard-01 exact card grid style) */}
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-5 dark:*:data-[slot=card]:bg-card">
        {stats.map((stat) => (
          <Card key={stat.label} className="@container/card">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stat.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="text-[11px] gap-1">
                  <stat.icon className="size-3" />
                  {stat.badge}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-xs text-muted-foreground">
              <div className="line-clamp-1 flex items-center gap-1.5 font-medium text-foreground">
                {stat.subtext}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Views Chart & Side Analytics Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Traffic & Views Trend</CardTitle>
            <CardDescription className="text-xs">Reader page views over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ViewsChart days={7} showRangeControls={false} height={175} compact />
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Editorial Analytics</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Deep dive into article performance, reader retention, and top performing categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="secondary" className="w-full rounded-xl gap-2 text-xs font-semibold" asChild>
              <Link href="/admin/analytics">
                Open Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Continue Writing (Active Draft Recovery Widget) */}
      {(() => {
        const draftPostsList = posts
          .filter((p) => p.status === 'draft')
          .sort((a, b) => getSafeTime(b.updated_at) - getSafeTime(a.updated_at))
          .slice(0, 3);

        if (draftPostsList.length === 0) return null;

        return (
          <Card className="border-l-4 border-l-amber-500 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-base font-semibold">Continue Writing</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Pick up right where you left off on your active draft articles.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {draftPostsList.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-accent/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {draft.title || 'Untitled Draft'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last modified {safeFormatDate(draft.updated_at, 'MMM d, yyyy · HH:mm')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4 rounded-xl gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40" asChild>
                      <Link href={`/admin/posts/${draft.id}/edit`}>
                        <PenLine className="w-3.5 h-3.5" /> Continue →
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Recent Posts Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Posts</CardTitle>
            <CardDescription className="text-xs">Latest updates across drafts, scheduled, and published articles.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-semibold rounded-xl" asChild>
            <Link href="/admin/posts">
              View all →
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentPosts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No posts yet. <Link href="/admin/posts/create" className="text-primary font-medium hover:underline">Create your first post!</Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[45%]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <p className="text-sm font-semibold text-foreground truncate max-w-md">{post.title}</p>
                      <p className="text-xs text-muted-foreground truncate">/{post.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          post.status === 'published'
                            ? 'default'
                            : post.status === 'scheduled'
                              ? 'secondary'
                              : 'outline'
                        }
                        className={
                          post.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-0'
                            : post.status === 'scheduled'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border-0'
                              : 'text-muted-foreground'
                        }
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {post.status === 'published' || post.status === 'scheduled'
                        ? safeFormatDate(post.published_at || post.created_at, 'MMM d, yyyy')
                        : safeFormatDate(post.created_at, 'MMM d, yyyy')
                      }
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" /> {post.views || 0}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
