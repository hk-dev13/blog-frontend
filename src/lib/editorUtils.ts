'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';

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
// Autosave — versioned envelope with conflict detection
// ──────────────────────────────────────────

const AUTOSAVE_SCHEMA_VERSION = 1 as const;

/** Maximum age of a restorable autosave (30 days). */
const AUTOSAVE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** All form fields persisted to localStorage on every autosave tick. */
export interface AutosaveData {
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
  scheduleDate: string;
  focusKeyword: string;
}

/**
 * Versioned wrapper stored in localStorage.
 * `basedOnServerUpdatedAt` records the server's `updated_at` at the moment
 * the autosave was written, enabling safe conflict detection without relying
 * on clock comparison between devices.
 */
export interface AutosaveEnvelope {
  schemaVersion: typeof AUTOSAVE_SCHEMA_VERSION;
  postId: string | 'new';
  savedAt: number;
  basedOnServerUpdatedAt: string | null;
  payload: AutosaveData;
}

/**
 * Three-state restore decision:
 * - `none`     → no valid autosave found (wrong schema, empty, too old)
 * - `safe`     → local draft is based on the same server version → safe to offer restore
 * - `conflict` → server has changed since the autosave was written → warn user
 */
export type RestoreState = 'none' | 'safe' | 'conflict';

/** Isolated localStorage key per post — prevents cross-post data leakage. */
export function getAutosaveKey(postId: string | 'new'): string {
  return `admin-post-autosave:${postId}`;
}



/**
 * Determines whether a recovered autosave envelope should be offered for
 * restoration, and in what state.
 *
 * Uses `basedOnServerUpdatedAt` (not local clock) to detect conflicts so
 * device clock skew cannot cause a stale draft to appear fresh.
 */
export function getRestoreState(
  envelope: AutosaveEnvelope,
  serverUpdatedAt: string | null,
): RestoreState {
  // Wrong schema version — data shape may have changed
  if (envelope.schemaVersion !== AUTOSAVE_SCHEMA_VERSION) return 'none';

  // Nothing meaningful to restore
  if (!hasMeaningfulContent(envelope.payload)) return 'none';

  // Create mode ('new') — no server version to compare against
  if (envelope.postId === 'new') {
    const isFresh = Date.now() - envelope.savedAt < AUTOSAVE_MAX_AGE_MS;
    return isFresh ? 'safe' : 'none';
  }

  // Edit mode — rely on basedOnServerUpdatedAt for conflict detection
  if (!serverUpdatedAt) return 'none';

  // Server version is unchanged since autosave was written → safe to restore
  if (envelope.basedOnServerUpdatedAt === serverUpdatedAt) return 'safe';

  // Server has changed since the autosave was created → conflict
  return 'conflict';
}

// ──────────────────────────────────────────
// Local autosave status (localStorage only)
// Deliberately separate from server-save status
// ──────────────────────────────────────────
export type LocalAutosaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

/**
 * @deprecated Use `LocalAutosaveStatus` — kept for backward compatibility
 * during the P2 refactor migration period.
 */
export type AutosaveStatus = LocalAutosaveStatus;

export interface AutosaveRestoreCandidate {
  state: RestoreState;
  envelope: AutosaveEnvelope;
  accept: (restoredData: AutosaveData) => void;
  discard: () => void;
}

export function hasMeaningfulContent(payload: AutosaveData): boolean {
  return Boolean(
    payload.title?.trim() ||
    payload.content?.trim() ||
    payload.excerpt?.trim() ||
    payload.metaTitle?.trim() ||
    payload.metaDescription?.trim() ||
    payload.canonicalUrl?.trim() ||
    payload.coverImageUrl?.trim() ||
    payload.coverImageAlt?.trim() ||
    payload.focusKeyword?.trim() ||
    payload.isFeatured ||
    payload.scheduleDate ||
    payload.selectedCategories?.length ||
    payload.selectedTags?.length
  );
}

export function useAutosave(
  postId: string | 'new',
  data: AutosaveData,
  enabled: boolean,
  /**
   * Called once on mount when a valid autosave envelope is found.
   * The caller is responsible for rendering the restore UI
   * (e.g. `AutosaveRestorePrompt`). No browser dialog is used here.
   */
  onRestoreAvailable: (candidate: AutosaveRestoreCandidate) => void,
  /**
   * ISO string of the server post's `updated_at` field, used for conflict
   * detection in edit mode. Pass `null` for create mode.
   */
  serverUpdatedAt: string | null,
) {
  const key = getAutosaveKey(postId);
  const onRestoreAvailableRef = useRef(onRestoreAvailable);
  onRestoreAvailableRef.current = onRestoreAvailable;

  const [status, setStatus] = useState<LocalAutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const initialRenderRef = useRef(true);
  const lastSavedSnapshotRef = useRef('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshot = useMemo(() => JSON.stringify(data), [data]);
  
  // State refs to manage race-conditions
  const restorePendingRef = useRef(false);
  const restoredSnapshotRef = useRef<string | null>(null);
  const clearedSnapshotRef = useRef<string | null>(null);
  const restoreCheckedKeyRef = useRef<string | null>(null);

  // Track latest data for sync ops
  const latestDataRef = useRef(data);
  const latestServerUpdatedRef = useRef(serverUpdatedAt);
  
  useEffect(() => {
    latestDataRef.current = data;
    latestServerUpdatedRef.current = serverUpdatedAt;
  }, [data, serverUpdatedAt]);

  const acceptRestore = useCallback((restoredData: AutosaveData) => {
    const restoredSnapshot = JSON.stringify(restoredData);
    lastSavedSnapshotRef.current = restoredSnapshot;
    latestDataRef.current = restoredData;
    restorePendingRef.current = false;
    restoredSnapshotRef.current = restoredSnapshot;
    setLastSavedAt(Date.now());
    setStatus('saved');
  }, []);

  const discardRestore = useCallback(() => {
    const currentSnapshot = JSON.stringify(latestDataRef.current);
    try { localStorage.removeItem(key); } catch {}
    restorePendingRef.current = false;
    lastSavedSnapshotRef.current = currentSnapshot; // Set baseline
    setLastSavedAt(null);
    setStatus('idle');
  }, [key]);

  // On mount or when serverUpdatedAt becomes available: check for saved autosave
  useEffect(() => {
    if (!enabled) return;
    if (postId !== 'new' && !serverUpdatedAt) return;
    
    const identity = postId === 'new' ? `${key}:new` : `${key}:${serverUpdatedAt}`;
    if (restoreCheckedKeyRef.current === identity) return;
    restoreCheckedKeyRef.current = identity;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const envelope: AutosaveEnvelope = JSON.parse(raw);
      const restoreState = getRestoreState(envelope, serverUpdatedAt);
      if (restoreState !== 'none') {
        restorePendingRef.current = true;
        // Delegate UI to caller — no browser confirm() dialog
        onRestoreAvailableRef.current({
          state: restoreState,
          envelope,
          accept: acceptRestore,
          discard: discardRestore,
        });
      }
    } catch {/* malformed localStorage entry — silently ignore */}
  }, [key, postId, enabled, serverUpdatedAt, acceptRestore, discardRestore]);

  // Autosave after changes settle (1.2 s debounce)
  useEffect(() => {
    if (!enabled || restorePendingRef.current) return;
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    // Unblock hook after accepted restore applies to the form
    if (restoredSnapshotRef.current && snapshot === restoredSnapshotRef.current) {
      lastSavedSnapshotRef.current = snapshot;
      restoredSnapshotRef.current = null;
      setStatus('saved');
      return;
    }
    if (restoredSnapshotRef.current) return;

    // Reset suppression if the user makes a new edit
    if (clearedSnapshotRef.current && snapshot !== clearedSnapshotRef.current) {
      clearedSnapshotRef.current = null;
    }

    if (!hasMeaningfulContent(latestDataRef.current)) {
      setStatus('idle');
      return;
    }

    if (snapshot === lastSavedSnapshotRef.current) {
      setStatus(current => (current === 'saving' || current === 'dirty' ? 'saved' : current));
      return;
    }

    setStatus('dirty');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      try {
        setStatus('saving');
        const envelope: AutosaveEnvelope = {
          schemaVersion: AUTOSAVE_SCHEMA_VERSION,
          postId,
          savedAt: Date.now(),
          basedOnServerUpdatedAt: latestServerUpdatedRef.current,
          payload: latestDataRef.current,
        };
        localStorage.setItem(key, JSON.stringify(envelope));
        lastSavedSnapshotRef.current = snapshot;
        setLastSavedAt(envelope.savedAt);
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [key, postId, enabled, snapshot, serverUpdatedAt]);

  // Synchronous save on unmount or tab close if there are pending changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!enabled) return;
      const currentData = latestDataRef.current;
      const currentSnapshot = JSON.stringify(currentData);
      
      // Skip if suppressed (just cleared) or no meaningful changes
      if (currentSnapshot === clearedSnapshotRef.current) return;
      if (currentSnapshot === lastSavedSnapshotRef.current) return;
      if (!hasMeaningfulContent(currentData)) return;

      try {
        const envelope: AutosaveEnvelope = {
          schemaVersion: AUTOSAVE_SCHEMA_VERSION,
          postId,
          savedAt: Date.now(),
          basedOnServerUpdatedAt: latestServerUpdatedRef.current,
          payload: currentData,
        };
        localStorage.setItem(key, JSON.stringify(envelope));
        lastSavedSnapshotRef.current = currentSnapshot;
      } catch {}
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // run on component unmount
    };
  }, [key, postId, enabled]);

  const clearSave = useCallback(() => {
    const currentSnapshot = JSON.stringify(latestDataRef.current);
    clearedSnapshotRef.current = currentSnapshot;
    lastSavedSnapshotRef.current = currentSnapshot;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    try { localStorage.removeItem(key); } catch {/* storage unavailable */}
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

// ──────────────────────────────────────────
// Safe Date Formatting (RangeError-proof)
// ──────────────────────────────────────────

/**
 * Formats a date string/number/Date using `date-fns/format` without throwing
 * `RangeError: Invalid time value` if the date is null, undefined, or invalid.
 */
export function safeFormatDate(
  dateValue: string | number | Date | null | undefined,
  formatStr: string = 'MMM d, yyyy',
  fallback: string = '—',
): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return fallback;
    return format(d, formatStr);
  } catch {
    return fallback;
  }
}

/**
 * Formats a date using `Intl.DateTimeFormat` safely without throwing
 * `RangeError: Invalid time value` if the date is null, undefined, or invalid.
 */
export function safeFormatIntl(
  dateValue: string | number | Date | null | undefined,
  formatter: Intl.DateTimeFormat,
  fallback: string = '—',
): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return fallback;
    return formatter.format(d);
  } catch {
    return fallback;
  }
}

