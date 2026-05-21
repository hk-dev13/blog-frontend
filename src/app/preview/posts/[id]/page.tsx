'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { fetchApi } from '@/lib/api';
import { SITE_URL } from '@/lib/env';
import { useAppStore } from '@/store/useAppStore';
import { Post } from '@/types';
import ReadingProgress from '@/components/shared/ReadingProgress';
import ArticleRenderer from '@/components/shared/ArticleRenderer';

export default function PreviewPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const token = useAppStore(state => state.token);
  const hydrated = useAppStore.persist.hasHydrated();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace('/admin/login');
    }
  }, [hydrated, router, token]);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['admin-preview-post', postId],
    queryFn: () => fetchApi<Post>(`/posts/admin/${postId}`),
    enabled: hydrated && !!token && !!postId,
  });

  if (!hydrated || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!token) {
    return null;
  }

  if (error || !post) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Preview unavailable</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          We couldn&apos;t load this draft preview. Please save your draft and try again.
        </p>
      </div>
    );
  }

  const postUrl = `${SITE_URL}/posts/${post.slug}`;

  return (
    <>
      <ReadingProgress />
      <ArticleRenderer
        post={post}
        postUrl={postUrl}
        relatedPosts={[]}
        showEngagement={false}
        showComments={false}
        showRelatedPosts={false}
      />
    </>
  );
}
