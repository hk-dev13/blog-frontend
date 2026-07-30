import assert from 'node:assert';
import { describe, it } from 'node:test';
import { extractYoutubeVideoId, isSafeUrl, sanitizeUrl } from '../../components/admin/RichTextEditor';

describe('RichText Roundtrip & Markdown Syntax Invariants', () => {

  describe('YouTube Markdown Syntax Parser & Serializer Rules', () => {
    it('parses valid @[youtube](videoId) syntax cleanly', () => {
      const markdownInput = 'Check out this video:\n\n@[youtube](dQw4w9WgXcQ)\n\nEnd of post.';
      const match = /@\[youtube\]\(([^)]+)\)/.exec(markdownInput);
      
      assert.ok(match !== null, 'Regex should match youtube syntax token');
      assert.strictEqual(match[1], 'dQw4w9WgXcQ');
      assert.strictEqual(extractYoutubeVideoId(match[1]), 'dQw4w9WgXcQ');
    });

    it('parses @[youtube](full_url) and normalizes to Video ID', () => {
      const rawInput = '@[youtube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)';
      const match = /@\[youtube\]\(([^)]+)\)/.exec(rawInput);
      
      assert.ok(match !== null);
      const extractedId = extractYoutubeVideoId(match[1]);
      assert.strictEqual(extractedId, 'dQw4w9WgXcQ');
      
      // Reserialization test
      const reserialized = `@[youtube](${extractedId})`;
      assert.strictEqual(reserialized, '@[youtube](dQw4w9WgXcQ)');
    });

    it('ignores invalid youtube syntax or malicious payload', () => {
      const maliciousInput = '@[youtube](javascript:alert(1))';
      const match = /@\[youtube\]\(([^)]+)\)/.exec(maliciousInput);
      assert.ok(match !== null);
      assert.strictEqual(extractYoutubeVideoId(match[1]), null);
    });
  });

  describe('Image Metadata Delimiter Safety Invariants', () => {
    it('escapes pipe characters in alt, width, and caption correctly', () => {
      const rawAlt = 'Front|End Developer';
      const rawWidth = '100%';
      const rawCaption = 'Figure 1: | Analysis';

      const safeAlt = rawAlt.replace(/\|/g, '\\|');
      const safeWidth = rawWidth.replace(/\|/g, '\\|');
      const safeCaption = rawCaption.replace(/\|/g, '\\|');

      const combinedAlt = `${safeAlt}|${safeWidth}|${safeCaption}`;
      assert.strictEqual(combinedAlt, 'Front\\|End Developer|100%|Figure 1: \\| Analysis');

      // Test splitting with escaped pipe awareness
      const parts = combinedAlt.split(/(?<!\\)\|/);
      assert.strictEqual(parts.length, 3);
      assert.strictEqual(parts[0].replace(/\\\|/g, '|'), 'Front|End Developer');
      assert.strictEqual(parts[1].replace(/\\\|/g, '|'), '100%');
      assert.strictEqual(parts[2].replace(/\\\|/g, '|'), 'Figure 1: | Analysis');
    });
  });

  describe('Link Protocol Allowlist Invariants', () => {
    it('ensures safe links remain intact while unsafe schemes are stripped', () => {
      const testLinks = [
        { input: 'https://example.com/page', expected: 'https://example.com/page' },
        { input: '/blog/posts/my-slug', expected: '/blog/posts/my-slug' },
        { input: 'mailto:info@example.com', expected: 'mailto:info@example.com' },
        { input: 'javascript:alert(document.cookie)', expected: '' },
        { input: 'data:text/html;base64,12345', expected: '' },
      ];

      for (const item of testLinks) {
        assert.strictEqual(sanitizeUrl(item.input), item.expected);
      }
    });
  });
});
