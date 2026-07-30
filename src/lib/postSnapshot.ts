/**
 * postSnapshot.ts
 *
 * Pure helpers (no React) for building a canonical, order-stable
 * representation of a post's form data used to track server-dirty state.
 *
 * "Snapshot" is used instead of "fingerprint" because we compare the
 * serialized JSON directly — no hashing involved.
 */

import type { Post } from '@/types';

// ──────────────────────────────────────────
// Canonical payload shape
// ──────────────────────────────────────────

/**
 * A normalised, order-stable representation of the fields that can be
 * edited in the post editor. Used to determine whether the form has
 * unsaved changes relative to what was last persisted on the server.
 */
export interface ComparablePostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  coverImageUrl: string;
  coverImageAlt: string;
  isFeatured: boolean;
  selectedCategories: string[]; // sorted ascending
  selectedTags: string[];       // sorted ascending
}

/** Raw form state shape expected by `buildComparablePayload`. */
export interface PostFormSnapshot {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  coverImageUrl: string;
  coverImageAlt: string;
  isFeatured: boolean;
  selectedCategories: string[];
  selectedTags: string[];
}

// ──────────────────────────────────────────
// Builders
// ──────────────────────────────────────────

/**
 * Builds a canonical, order-stable `ComparablePostData` from a form
 * state object. All strings are trimmed; array fields are sorted so that
 * a different insertion order does not produce a false dirty signal.
 *
 * `content` is intentionally NOT trimmed — leading/trailing whitespace in
 * the editor body is meaningful.
 */
export function buildComparablePayload(form: PostFormSnapshot): ComparablePostData {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    excerpt: form.excerpt.trim(),
    content: form.content,
    metaTitle: form.metaTitle.trim(),
    metaDescription: form.metaDescription.trim(),
    canonicalUrl: form.canonicalUrl.trim(),
    coverImageUrl: form.coverImageUrl.trim(),
    coverImageAlt: form.coverImageAlt.trim(),
    isFeatured: form.isFeatured,
    selectedCategories: [...form.selectedCategories].sort(),
    selectedTags: [...form.selectedTags].sort(),
  };
}

/** Serialises a `ComparablePostData` to a stable JSON string. */
export function serializeSnapshot(data: ComparablePostData): string {
  return JSON.stringify(data);
}

/**
 * Converts a `Post` response from the server into the same serialised
 * format used by `serializeSnapshot`, so both can be compared directly.
 */
export function serializeServerPost(post: Post): string {
  return serializeSnapshot(
    buildComparablePayload({
      title: post.title ?? '',
      slug: post.slug ?? '',
      excerpt: post.excerpt ?? '',
      content: post.content ?? '',
      metaTitle: post.meta_title ?? '',
      metaDescription: post.meta_description ?? '',
      canonicalUrl: post.canonical_url ?? '',
      coverImageUrl: post.cover_image ?? '',
      coverImageAlt: post.cover_image_alt ?? '',
      isFeatured: post.is_featured ?? false,
      selectedCategories: (post.categories ?? []).map((c) => c.id),
      selectedTags: (post.tags ?? []).map((t) => t.id),
    }),
  );
}
