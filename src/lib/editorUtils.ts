'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';

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

export type AutosaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function useAutosave(
  key: string,
  data: Omit<AutosaveData, 'savedAt'>,
  enabled: boolean,
  onRestore: (data: Omit<AutosaveData, 'savedAt'>) => void,
) {
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const initialRenderRef = useRef(true);
  const lastSavedSnapshotRef = useRef('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshot = useMemo(() => JSON.stringify(data), [data]);

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
        lastSavedSnapshotRef.current = JSON.stringify({
          title: saved.title,
          excerpt: saved.excerpt,
          content: saved.content,
          metaTitle: saved.metaTitle,
          metaDescription: saved.metaDescription,
          slug: saved.slug,
        });
        setLastSavedAt(saved.savedAt);
        setStatus('saved');
        const mins = Math.round(age / 60000);
        const label = mins < 1 ? 'just now' : mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
        if (confirm(`📝 Found an autosaved draft from ${label}. Restore it?`)) {
          const { savedAt: _, ...rest } = saved;
          onRestoreRef.current(rest);
        }
      }
    } catch {/* ignore */}
   
  }, [key, enabled]);

  // Autosave after changes settle
  useEffect(() => {
    if (!enabled) return;
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    if (!data.title && !data.content) {
      setStatus('idle');
      return;
    }
    if (snapshot === lastSavedSnapshotRef.current) {
      if (status === 'saving' || status === 'dirty') {
        setStatus('saved');
      }
      return;
    }

    setStatus('dirty');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        setStatus('saving');
        const savedAt = Date.now();
        localStorage.setItem(key, JSON.stringify({ ...data, savedAt }));
        lastSavedSnapshotRef.current = snapshot;
        setLastSavedAt(savedAt);
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [key, data, enabled, snapshot, status]);

  const clearSave = useCallback(() => {
    try { localStorage.removeItem(key); } catch {/* */}
    lastSavedSnapshotRef.current = '';
    setLastSavedAt(null);
    setStatus('idle');
  }, [key]);

  return { clearSave, status, lastSavedAt };
}

export function getLocalDateTimeMin(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
