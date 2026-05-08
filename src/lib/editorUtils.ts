'use client';

import { useEffect, useRef, useCallback } from 'react';

// ──────────────────────────────────────────
// Slug generator (mirror backend logic)
// ──────────────────────────────────────────
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars
    .replace(/[\s_]+/g, '-')    // spaces → hyphens
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // trim leading/trailing hyphens
}

// ──────────────────────────────────────────
// Word count & reading time
// ──────────────────────────────────────────
export function getContentStats(content: string) {
  const stripped = content
    .replace(/```[\s\S]*?```/g, '')  // remove code blocks
    .replace(/`[^`]*`/g, '')         // remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[.*?\]\(.*?\)/g, '')  // remove links
    .replace(/[#*_~>|-]/g, '')       // remove markdown symbols
    .trim();

  const words = stripped ? stripped.split(/\s+/).filter(Boolean).length : 0;
  const chars = content.length;
  const readingTime = Math.max(1, Math.ceil(words / 200)); // 200 wpm average

  return { words, chars, readingTime };
}

// ──────────────────────────────────────────
// Autosave hook — localStorage with indicator
// ──────────────────────────────────────────
interface AutosaveData {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  savedAt: number;
}

export function useAutosave(
  key: string,
  data: Omit<AutosaveData, 'savedAt'>,
  enabled: boolean,
  onRestore: (data: Omit<AutosaveData, 'savedAt'>) => void,
) {
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // On mount: check for saved draft and prompt restore
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const saved: AutosaveData = JSON.parse(raw);
      // Only restore if saved within last 24 hours and has content
      const age = Date.now() - saved.savedAt;
      if (age < 86_400_000 && (saved.title || saved.content)) {
        const mins = Math.round(age / 60000);
        const label = mins < 1 ? 'just now' : mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
        if (confirm(`📝 Found an autosaved draft from ${label}. Restore it?`)) {
          const { savedAt: _, ...rest } = saved;
          onRestoreRef.current(rest);
        }
      }
    } catch {/* ignore */}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  // Autosave every 30 seconds
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      if (!data.title && !data.content) return; // don't save empty
      try {
        localStorage.setItem(key, JSON.stringify({ ...data, savedAt: Date.now() }));
      } catch {/* storage quota */}
    }, 30_000);
    return () => clearInterval(interval);
  }, [key, data, enabled]);

  const clearSave = useCallback(() => {
    try { localStorage.removeItem(key); } catch {/* */}
  }, [key]);

  return { clearSave };
}
