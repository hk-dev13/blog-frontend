'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { usePostEditorForm, type InitialPostFormData } from './usePostEditorForm';
import { usePostTaxonomy } from './usePostTaxonomy';
import { usePostAutosave } from './usePostAutosave';
import { usePostMutations } from './usePostMutations';
import { useCoverImageUpload } from './useCoverImageUpload';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';
import {
  buildComparablePayload,
  serializeSnapshot,
  serializeServerPost,
} from '@/lib/postSnapshot';
import type { Post } from '@/types';

interface UsePostEditorOptions {
  mode: 'create' | 'edit';
  postId?: string;
  serverPost?: Post | null;
  initialData?: InitialPostFormData;
}

/**
 * Thin composition hook combining focused editor sub-hooks:
 * - `form` (field state, validation, payload builders)
 * - `taxonomy` (categories & tags queries + creation)
 * - `autosave` (localStorage persistence & conflict prompts)
 * - `mutations` (save draft, update, preview, publish, schedule)
 * - `coverUpload` (image upload & drag-and-drop)
 * - `guard` (unsaved changes navigation guard)
 * - `isServerDirty` (canonical snapshot dirty state)
 */
export function usePostEditor({
  mode,
  postId = 'new',
  serverPost,
  initialData,
}: UsePostEditorOptions) {
  const form = usePostEditorForm(initialData);
  const taxonomy = usePostTaxonomy();

  // Canonical Snapshot & Server Dirty Tracking (koreksi #3)
  const hasInitializedRef = useRef(false);
  const [lastServerSnapshot, setLastServerSnapshot] = useState<string | null>(null);

  // Initialize server snapshot ONCE when server data arrives in edit mode
  useEffect(() => {
    if (!serverPost || hasInitializedRef.current) return;
    form.hydrateFromPost(serverPost);
    setLastServerSnapshot(serializeServerPost(serverPost));
    hasInitializedRef.current = true;
  }, [serverPost, form]);

  const currentSnapshot = useMemo(
    () => serializeSnapshot(buildComparablePayload(form.getFormSnapshot())),
    [form],
  );

  // dirty state is null when not yet initialized, preventing false dirty signals
  const isServerDirty =
    mode === 'edit'
      ? lastServerSnapshot !== null && currentSnapshot !== lastServerSnapshot
      : Boolean(form.title.trim() || form.content.trim());

  const markServerClean = useCallback(() => {
    setLastServerSnapshot(currentSnapshot);
  }, [currentSnapshot]);

  const autosave = usePostAutosave({
    postId,
    serverUpdatedAt: serverPost?.updated_at ?? null,
    form,
  });

  const mutations = usePostMutations({
    mode,
    postId: mode === 'edit' ? postId : undefined,
    buildBasePayload: form.buildBasePayload,
    buildSchedulePayload: form.buildSchedulePayload,
    clearAutosave: autosave.clearSave,
    markServerClean,
  });

  const coverUpload = useCoverImageUpload({
    onSuccess: form.setCoverImageUrl,
  });

  const guard = useUnsavedChangesGuard(isServerDirty);

  return {
    form,
    taxonomy,
    autosave,
    mutations,
    coverUpload,
    guard,
    isServerDirty,
    markServerClean,
  };
}
