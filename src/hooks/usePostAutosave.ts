'use client';

import { useState, useCallback } from 'react';
import {
  useAutosave,
  type AutosaveData,
  type RestoreState,
  type AutosaveEnvelope,
  type AutosaveRestoreCandidate,
} from '@/lib/editorUtils';
import type { usePostEditorForm } from './usePostEditorForm';

interface UsePostAutosaveOptions {
  postId: string | 'new';
  serverUpdatedAt: string | null;
  form: ReturnType<typeof usePostEditorForm>;
  enabled?: boolean;
}

/**
 * Connects `usePostEditorForm` state to `useAutosave` localStorage persistence
 * and manages restore prompt state (`none` | `safe` | `conflict`).
 */
export function usePostAutosave({
  postId,
  serverUpdatedAt,
  form,
  enabled = true,
}: UsePostAutosaveOptions) {
  const [autosaveRestoreState, setAutosaveRestoreState] = useState<AutosaveRestoreCandidate | null>(null);

  const autosaveData: AutosaveData = {
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    content: form.content,
    metaTitle: form.metaTitle,
    metaDescription: form.metaDescription,
    canonicalUrl: form.canonicalUrl,
    coverImageUrl: form.coverImageUrl,
    coverImageAlt: form.coverImageAlt,
    isFeatured: form.isFeatured,
    selectedCategories: form.selectedCategories,
    selectedTags: form.selectedTags,
    scheduleDate: form.scheduleDate,
    focusKeyword: form.focusKeyword,
  };

  const handleRestoreAvailable = useCallback(
    (candidate: AutosaveRestoreCandidate) => {
      setAutosaveRestoreState(candidate);
    },
    [],
  );

  const { clearSave, status: localStatus, lastSavedAt } = useAutosave(
    postId,
    autosaveData,
    enabled,
    handleRestoreAvailable,
    serverUpdatedAt,
  );

  /** Restores recovered payload into form state. */
  const handleRestore = useCallback(() => {
    if (!autosaveRestoreState) return;
    const p = autosaveRestoreState.envelope.payload;
    form.setTitle(p.title);
    form.setExcerpt(p.excerpt);
    form.setContent(p.content);
    form.setMetaTitle(p.metaTitle);
    form.setMetaDescription(p.metaDescription);
    form.setCanonicalUrl(p.canonicalUrl);
    form.setCoverImageUrl(p.coverImageUrl);
    form.setCoverImageAlt(p.coverImageAlt);
    form.setIsFeatured(p.isFeatured);
    form.setSelectedCategories(p.selectedCategories);
    form.setSelectedTags(p.selectedTags);
    form.setScheduleDate(p.scheduleDate);
    form.setFocusKeyword(p.focusKeyword);
    if (p.slug) {
      form.setSlug(p.slug);
    }
    autosaveRestoreState.accept(p);
    setAutosaveRestoreState(null);
  }, [autosaveRestoreState, form]);

  const handleDiscard = useCallback(() => {
    if (autosaveRestoreState) {
      autosaveRestoreState.discard();
    }
    setAutosaveRestoreState(null);
  }, [autosaveRestoreState]);

  const autosaveLabel =
    localStatus === 'saving'
      ? 'Saving draft...'
      : localStatus === 'saved'
        ? `Autosaved${
            lastSavedAt
              ? ` at ${new Date(lastSavedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : ''
          }`
        : localStatus === 'dirty'
          ? 'Unsaved changes'
          : localStatus === 'error'
            ? 'Autosave failed'
            : '';

  return {
    localStatus,
    lastSavedAt,
    autosaveLabel,
    autosaveRestoreState,
    clearSave,
    handleRestore,
    handleDiscard,
  };
}
