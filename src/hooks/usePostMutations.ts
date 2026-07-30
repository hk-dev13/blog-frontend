'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import type { PostBasePayload, PostSchedulePayload } from './usePostEditorForm';
import type { Post } from '@/types';

interface UsePostMutationsOptions {
  mode: 'create' | 'edit';
  postId?: string;
  buildBasePayload: () => PostBasePayload;
  buildSchedulePayload: (scheduleDate?: string) => PostSchedulePayload;
  clearAutosave: () => void;
  markServerClean: () => void;
}

/**
 * Encapsulates backend mutations for saving drafts, updating posts,
 * publishing immediately, and scheduling.
 */
export function usePostMutations({
  mode,
  postId,
  buildBasePayload,
  buildSchedulePayload,
  clearAutosave,
  markServerClean,
}: UsePostMutationsOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pushToast = useToastStore((state) => state.push);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  /** Save draft handler (Create mode returns `{ id: string }`). */
  const handleSaveDraft = useCallback(async (): Promise<{ id: string } | null> => {
    const payload = buildBasePayload();
    if (!payload.title.trim() || !payload.content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required before saving.' });
      return null;
    }

    setIsSaving(true);
    isSavingRef.current = true;

    try {
      if (mode === 'create') {
        const created = await fetchApi<{ id: string }>('/posts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        markServerClean();
        clearAutosave();
        router.push('/admin/posts');
        return created;
      } else {
        await fetchApi(`/posts/${postId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        markServerClean();
        clearAutosave();
        queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
        queryClient.invalidateQueries({ queryKey: ['admin-post', postId] });
        router.push('/admin/posts');
        return { id: postId! };
      }
    } catch (err: unknown) {
      pushToast({
        variant: 'error',
        title: mode === 'create' ? 'Failed to save draft' : 'Failed to update post',
        description: err instanceof Error ? err.message : undefined,
      });
      return null;
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [mode, postId, buildBasePayload, markServerClean, clearAutosave, router, queryClient, pushToast]);

  /** Preview handler — saves then opens preview URL in a new tab. */
  const handlePreview = useCallback(async (): Promise<void> => {
    const payload = buildBasePayload();
    if (!payload.title.trim() || !payload.content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required to preview.' });
      return;
    }

    setIsSaving(true);
    isSavingRef.current = true;

    try {
      if (mode === 'create') {
        const created = await fetchApi<{ id: string }>('/posts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        markServerClean();
        clearAutosave();
        window.open(`/preview/posts/${created.id}`, '_blank', 'noopener,noreferrer');
        router.replace(`/admin/posts/${created.id}/edit`);
      } else {
        await fetchApi(`/posts/${postId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        markServerClean();
        clearAutosave();
        window.open(`/preview/posts/${postId}`, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      pushToast({
        variant: 'error',
        title: 'Failed to open preview',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [mode, postId, buildBasePayload, markServerClean, clearAutosave, router, pushToast]);

  /** Publish immediately handler. */
  const handlePublishNow = useCallback(async (): Promise<void> => {
    const payload = buildBasePayload();
    if (!payload.title.trim() || !payload.content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required to publish.' });
      return;
    }

    setIsSaving(true);
    isSavingRef.current = true;

    try {
      if (mode === 'create') {
        await fetchApi('/posts/publish', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi(`/posts/${postId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        await fetchApi(`/posts/${postId}/publish`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
      }
      markServerClean();
      clearAutosave();
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      if (postId) queryClient.invalidateQueries({ queryKey: ['admin-post', postId] });
      router.push('/admin/posts');
    } catch (err: unknown) {
      pushToast({
        variant: 'error',
        title: 'Failed to publish post',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [mode, postId, buildBasePayload, markServerClean, clearAutosave, router, queryClient, pushToast]);

  /** Schedule publication handler. */
  const handleSchedule = useCallback(async (scheduleDate: string): Promise<void> => {
    const payload = buildSchedulePayload(scheduleDate);
    if (!payload.title.trim() || !payload.content.trim()) {
      pushToast({ variant: 'error', title: 'Title and content are required to schedule.' });
      return;
    }
    if (!scheduleDate) {
      pushToast({ variant: 'error', title: 'Please select a date and time for scheduling.' });
      return;
    }

    setIsSaving(true);
    isSavingRef.current = true;

    try {
      if (mode === 'create') {
        await fetchApi('/posts/publish', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi(`/posts/${postId}`, {
          method: 'PUT',
          body: JSON.stringify(buildBasePayload()),
        });
        await fetchApi(`/posts/${postId}/publish`, {
          method: 'POST',
          body: JSON.stringify({ published_at: payload.published_at }),
        });
      }
      markServerClean();
      clearAutosave();
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      if (postId) queryClient.invalidateQueries({ queryKey: ['admin-post', postId] });
      router.push('/admin/posts');
    } catch (err: unknown) {
      pushToast({
        variant: 'error',
        title: 'Failed to schedule post',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [mode, postId, buildBasePayload, buildSchedulePayload, markServerClean, clearAutosave, router, queryClient, pushToast]);

  return {
    isSaving,
    isSavingRef,
    handleSaveDraft,
    handlePreview,
    handlePublishNow,
    handleSchedule,
  };
}
