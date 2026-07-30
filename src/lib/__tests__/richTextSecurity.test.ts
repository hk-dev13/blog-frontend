import assert from 'node:assert';
import { describe, it } from 'node:test';
import { extractYoutubeVideoId, isSafeUrl, sanitizeUrl } from '../../components/admin/RichTextEditor';

describe('RichTextEditor Security & Sanitization', () => {
  describe('extractYoutubeVideoId', () => {
    it('extracts valid 11-char Video ID directly', () => {
      assert.strictEqual(extractYoutubeVideoId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    });

    it('extracts Video ID from standard youtube.com watch URLs', () => {
      assert.strictEqual(
        extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        'dQw4w9WgXcQ'
      );
      assert.strictEqual(
        extractYoutubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=shared'),
        'dQw4w9WgXcQ'
      );
    });

    it('extracts Video ID from short youtu.be URLs', () => {
      assert.strictEqual(
        extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ'),
        'dQw4w9WgXcQ'
      );
    });

    it('extracts Video ID from embed and nocookie URLs', () => {
      assert.strictEqual(
        extractYoutubeVideoId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),
        'dQw4w9WgXcQ'
      );
      assert.strictEqual(
        extractYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
        'dQw4w9WgXcQ'
      );
    });

    it('rejects untrusted domains and spoofed phishing URLs', () => {
      assert.strictEqual(
        extractYoutubeVideoId('https://youtube.com.evil-phishing.com/watch?v=dQw4w9WgXcQ'),
        null
      );
      assert.strictEqual(
        extractYoutubeVideoId('https://evil-site.com/watch?v=dQw4w9WgXcQ'),
        null
      );
      assert.strictEqual(
        extractYoutubeVideoId('javascript:alert(1)'),
        null
      );
    });
  });

  describe('URL Sanitization (isSafeUrl & sanitizeUrl)', () => {
    it('allows safe http, https, mailto, and relative URLs', () => {
      assert.strictEqual(isSafeUrl('https://example.com/blog/article'), true);
      assert.strictEqual(isSafeUrl('http://example.com'), true);
      assert.strictEqual(isSafeUrl('mailto:author@example.com'), true);
      assert.strictEqual(isSafeUrl('/admin/posts/123'), true);
      assert.strictEqual(isSafeUrl('#section-1'), true);
    });

    it('rejects executable or unsafe protocols (javascript:, data:)', () => {
      assert.strictEqual(isSafeUrl('javascript:alert("xss")'), false);
      assert.strictEqual(isSafeUrl('vbscript:msgbox(1)'), false);
      assert.strictEqual(isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), false);
    });

    it('sanitizes unsafe URLs to empty string', () => {
      assert.strictEqual(sanitizeUrl('https://valid.com'), 'https://valid.com');
      assert.strictEqual(sanitizeUrl('javascript:alert(1)'), '');
    });
  });
});
