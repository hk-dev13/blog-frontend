import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  buildComparablePayload,
  serializeSnapshot,
  serializeServerPost,
  type PostFormSnapshot,
} from '../postSnapshot';
import type { Post } from '../../types';

describe('postSnapshot', () => {
  it('builds canonical payload with trimmed strings and sorted arrays', () => {
    const rawForm: PostFormSnapshot = {
      title: '  Test Title  ',
      slug: '  test-title  ',
      excerpt: '  Some summary  ',
      content: 'Un-trimmed body content\n',
      metaTitle: ' Meta  ',
      metaDescription: ' Desc ',
      canonicalUrl: ' https://example.com ',
      coverImageUrl: ' https://example.com/img.png ',
      coverImageAlt: ' Alt text ',
      isFeatured: true,
      selectedCategories: ['cat-2', 'cat-1', 'cat-3'],
      selectedTags: ['tag-b', 'tag-a'],
    };

    const canonical = buildComparablePayload(rawForm);

    assert.strictEqual(canonical.title, 'Test Title');
    assert.strictEqual(canonical.slug, 'test-title');
    assert.strictEqual(canonical.excerpt, 'Some summary');
    assert.strictEqual(canonical.content, 'Un-trimmed body content\n');
    assert.deepStrictEqual(canonical.selectedCategories, ['cat-1', 'cat-2', 'cat-3']);
    assert.deepStrictEqual(canonical.selectedTags, ['tag-a', 'tag-b']);
  });

  it('produces identical serialized snapshots regardless of category/tag selection order', () => {
    const formA: PostFormSnapshot = {
      title: 'Title',
      slug: 'slug',
      excerpt: '',
      content: 'Content',
      metaTitle: '',
      metaDescription: '',
      canonicalUrl: '',
      coverImageUrl: '',
      coverImageAlt: '',
      isFeatured: false,
      selectedCategories: ['cat-a', 'cat-b'],
      selectedTags: ['tag-2', 'tag-1'],
    };

    const formB: PostFormSnapshot = {
      ...formA,
      selectedCategories: ['cat-b', 'cat-a'],
      selectedTags: ['tag-1', 'tag-2'],
    };

    const snapA = serializeSnapshot(buildComparablePayload(formA));
    const snapB = serializeSnapshot(buildComparablePayload(formB));

    assert.strictEqual(snapA, snapB);
  });

  it('serializes server post into matching canonical format', () => {
    const mockPost: Post = {
      id: 'post-123',
      author_id: 'user-1',
      title: 'Title',
      slug: 'title',
      content: 'Content',
      excerpt: '',
      cover_image: 'https://example.com/img.jpg',
      cover_image_alt: 'Alt',
      meta_title: '',
      meta_description: '',
      canonical_url: '',
      status: 'draft',
      is_featured: false,
      views: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      categories: [{ id: 'c1', name: 'Cat 1', slug: 'cat-1', post_count: 1 }],
      tags: [{ id: 't1', name: 'Tag 1', slug: 'tag-1', post_count: 1 }],
    };

    const form: PostFormSnapshot = {
      title: 'Title',
      slug: 'title',
      excerpt: '',
      content: 'Content',
      metaTitle: '',
      metaDescription: '',
      canonicalUrl: '',
      coverImageUrl: 'https://example.com/img.jpg',
      coverImageAlt: 'Alt',
      isFeatured: false,
      selectedCategories: ['c1'],
      selectedTags: ['t1'],
    };

    const serverSnap = serializeServerPost(mockPost);
    const formSnap = serializeSnapshot(buildComparablePayload(form));

    assert.strictEqual(serverSnap, formSnap);
  });
});
