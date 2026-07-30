import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  generateSlug,
  getContentStats,
  getAutosaveKey,
  getRestoreState,
  type AutosaveEnvelope,
  type AutosaveData,
} from '../editorUtils';

describe('editorUtils', () => {
  it('generates clean slugs matching backend rules', () => {
    assert.strictEqual(generateSlug('Hello World! 123'), 'hello-world-123');
    assert.strictEqual(generateSlug('  ---  Multiple   Spaces --- '), 'multiple-spaces');
    assert.strictEqual(generateSlug('Cara Membuat Blog di 2026 🔥'), 'cara-membuat-blog-di-2026');
  });

  it('calculates word count and reading time correctly', () => {
    const text = 'Word '.repeat(400); // 400 words
    const stats = getContentStats(text);
    assert.strictEqual(stats.words, 400);
    assert.strictEqual(stats.readingTime, 2); // 400 / 200 = 2 min
  });

  it('builds post-isolated localStorage keys', () => {
    assert.strictEqual(getAutosaveKey('new'), 'admin-post-autosave:new');
    assert.strictEqual(getAutosaveKey('post-abc'), 'admin-post-autosave:post-abc');
  });

  describe('getRestoreState', () => {
    const validData: AutosaveData = {
      title: 'Draft Title',
      slug: 'draft-title',
      excerpt: 'Summary',
      content: 'Draft content body',
      metaTitle: '',
      metaDescription: '',
      canonicalUrl: '',
      coverImageUrl: '',
      coverImageAlt: '',
      isFeatured: false,
      selectedCategories: [],
      selectedTags: [],
      scheduleDate: '',
      focusKeyword: '',
    };

    it('returns "none" if schema version does not match', () => {
      const envelope: AutosaveEnvelope = {
        schemaVersion: 99 as any,
        postId: 'new',
        savedAt: Date.now(),
        basedOnServerUpdatedAt: null,
        payload: validData,
      };
      assert.strictEqual(getRestoreState(envelope, null), 'none');
    });

    it('returns "none" if payload is empty', () => {
      const envelope: AutosaveEnvelope = {
        schemaVersion: 1,
        postId: 'new',
        savedAt: Date.now(),
        basedOnServerUpdatedAt: null,
        payload: { ...validData, title: '', content: '', excerpt: '' },
      };
      assert.strictEqual(getRestoreState(envelope, null), 'none');
    });

    it('returns "safe" for fresh create-mode autosave', () => {
      const envelope: AutosaveEnvelope = {
        schemaVersion: 1,
        postId: 'new',
        savedAt: Date.now() - 1000 * 60 * 5, // 5 mins ago
        basedOnServerUpdatedAt: null,
        payload: validData,
      };
      assert.strictEqual(getRestoreState(envelope, null), 'safe');
    });

    it('returns "safe" in edit-mode when basedOnServerUpdatedAt matches server', () => {
      const envelope: AutosaveEnvelope = {
        schemaVersion: 1,
        postId: 'post-1',
        savedAt: Date.now() - 1000 * 60 * 5,
        basedOnServerUpdatedAt: '2026-07-30T10:00:00Z',
        payload: validData,
      };
      assert.strictEqual(getRestoreState(envelope, '2026-07-30T10:00:00Z'), 'safe');
    });

    it('returns "conflict" in edit-mode when server updated_at has changed', () => {
      const envelope: AutosaveEnvelope = {
        schemaVersion: 1,
        postId: 'post-1',
        savedAt: Date.now() - 1000 * 60 * 5,
        basedOnServerUpdatedAt: '2026-07-30T10:00:00Z',
        payload: validData,
      };
      // Server was updated at 11:00:00 by another device
      assert.strictEqual(getRestoreState(envelope, '2026-07-30T11:00:00Z'), 'conflict');
    });
  });
});
