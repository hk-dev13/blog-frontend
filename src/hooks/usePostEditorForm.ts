'use client';

import { useState, useCallback } from 'react';
import { generateSlug } from '@/lib/editorUtils';
import type { Post } from '@/types';

// ──────────────────────────────────────────
// Payload Types
// ──────────────────────────────────────────

export interface PostBasePayload {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  cover_image?: string;
  cover_image_alt?: string;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  is_featured: boolean;
  category_ids: string[];
  tag_ids: string[];
  focus_keyword?: string;
}

export interface PostSchedulePayload extends PostBasePayload {
  published_at: string | null;
}

export interface InitialPostFormData {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  isFeatured?: boolean;
  selectedCategories?: string[];
  selectedTags?: string[];
  scheduleDate?: string;
  focusKeyword?: string;
}

// ──────────────────────────────────────────
// Hook
// ──────────────────────────────────────────

/**
 * Manages all form field states, validation, and payload formatting for the
 * post editor.
 *
 * Exposes two distinct payload builders:
 * - `buildBasePayload()` — for draft save, update, and immediate publish
 * - `buildSchedulePayload(scheduleDate)` — for scheduled publication (koreksi #5)
 */
export function usePostEditorForm(initialData?: InitialPostFormData) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [slugLocked, setSlugLocked] = useState(Boolean(initialData?.slug));
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl ?? '');
  const [coverImageAlt, setCoverImageAlt] = useState(initialData?.coverImageAlt ?? '');
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? '');
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl ?? '');
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.selectedCategories ?? []);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.selectedTags ?? []);
  const [scheduleDate, setScheduleDate] = useState(initialData?.scheduleDate ?? '');
  const [focusKeyword, setFocusKeyword] = useState(initialData?.focusKeyword ?? ''); // koreksi #4
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');

  // Title change updates slug automatically unless locked
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (!slugLocked) {
        setSlug(generateSlug(newTitle));
      }
    },
    [slugLocked],
  );

  // Manual slug change locks the slug
  const handleSlugChange = useCallback((newSlug: string) => {
    setSlug(generateSlug(newSlug));
    setSlugLocked(true);
  }, []);

  // Lock toggle
  const toggleSlugLock = useCallback(() => {
    if (slugLocked) {
      setSlug(generateSlug(title));
      setSlugLocked(false);
    } else {
      setSlugLocked(true);
    }
  }, [slugLocked, title]);

  /** Hydrates the form state from a server `Post` object once data arrives. */
  const hydrateFromPost = useCallback((post: Post) => {
    setTitle(post.title || '');
    setSlug(post.slug || '');
    setSlugLocked(Boolean(post.slug));
    setExcerpt(post.excerpt || '');
    setContent(post.content || '');
    setCoverImageUrl(post.cover_image || '');
    setCoverImageAlt(post.cover_image_alt || '');
    setMetaTitle(post.meta_title || '');
    setMetaDescription(post.meta_description || '');
    setIsFeatured(post.is_featured || false);
    setCanonicalUrl((post as any).canonical_url || '');
    setFocusKeyword((post as any).focus_keyword || '');

    if (post.categories) {
      setSelectedCategories(post.categories.map((c) => c.id));
    }
    if (post.tags) {
      setSelectedTags(post.tags.map((t) => t.id));
    }

    if (post.status === 'scheduled' && post.published_at) {
      const d = new Date(post.published_at);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      setScheduleDate(localISOTime);
    }
  }, []);

  /** Base payload for standard draft save / update / publish now. */
  const buildBasePayload = useCallback((): PostBasePayload => {
    return {
      title,
      slug: slugLocked && slug ? slug : undefined,
      excerpt,
      content,
      cover_image: coverImageUrl || undefined,
      cover_image_alt: coverImageAlt || undefined,
      meta_title: metaTitle || undefined,
      meta_description: metaDescription || undefined,
      canonical_url: canonicalUrl || undefined,
      is_featured: isFeatured,
      category_ids: selectedCategories,
      tag_ids: selectedTags,
      focus_keyword: focusKeyword || undefined, // koreksi #4
    };
  }, [
    title,
    slugLocked,
    slug,
    excerpt,
    content,
    coverImageUrl,
    coverImageAlt,
    metaTitle,
    metaDescription,
    canonicalUrl,
    isFeatured,
    selectedCategories,
    selectedTags,
    focusKeyword,
  ]);

  /** Scheduled payload with ISO published_at string (koreksi #5). */
  const buildSchedulePayload = useCallback(
    (targetDate?: string): PostSchedulePayload => {
      const dateToUse = targetDate || scheduleDate;
      return {
        ...buildBasePayload(),
        published_at: dateToUse ? new Date(dateToUse).toISOString() : null,
      };
    },
    [buildBasePayload, scheduleDate],
  );

  /** Form state representation suitable for postSnapshot serialization. */
  const getFormSnapshot = useCallback(() => {
    return {
      title,
      slug,
      excerpt,
      content,
      metaTitle,
      metaDescription,
      canonicalUrl,
      coverImageUrl,
      coverImageAlt,
      isFeatured,
      selectedCategories,
      selectedTags,
    };
  }, [
    title,
    slug,
    excerpt,
    content,
    metaTitle,
    metaDescription,
    canonicalUrl,
    coverImageUrl,
    coverImageAlt,
    isFeatured,
    selectedCategories,
    selectedTags,
  ]);

  const isValid = useCallback(() => {
    return title.trim().length > 0 && content.trim().length > 0;
  }, [title, content]);

  return {
    // Field States
    title,
    slug,
    slugLocked,
    excerpt,
    content,
    coverImageUrl,
    coverImageAlt,
    metaTitle,
    metaDescription,
    canonicalUrl,
    isFeatured,
    selectedCategories,
    selectedTags,
    scheduleDate,
    focusKeyword,
    editorMode,

    // Field Setters
    setTitle: handleTitleChange,
    setSlug: handleSlugChange,
    toggleSlugLock,
    setExcerpt,
    setContent,
    setCoverImageUrl,
    setCoverImageAlt,
    setMetaTitle,
    setMetaDescription,
    setCanonicalUrl,
    setIsFeatured,
    setSelectedCategories,
    setSelectedTags,
    setScheduleDate,
    setFocusKeyword,
    setEditorMode,

    // Helpers & Builders
    hydrateFromPost,
    buildBasePayload,
    buildSchedulePayload,
    getFormSnapshot,
    isValid,
  };
}
