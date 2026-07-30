'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export type NavigationRequest = {
  /** The destination path requested by the user. */
  href: string;
  /** Call this to execute the navigation after the user confirms. */
  onConfirm: () => void;
};

// ──────────────────────────────────────────
// Hook
// ──────────────────────────────────────────

/**
 * Guards against accidental data loss when navigating away from the editor
 * while there are unsaved changes on the server.
 *
 * Two separate mechanisms are used because they cover fundamentally
 * different navigation paths:
 *
 * 1. **`beforeunload`** (native browser dialog) — covers tab close, browser
 *    refresh, and any navigation that causes the page to unload. A custom
 *    modal cannot intercept these events after the page begins unloading.
 *
 * 2. **`requestNavigation`** (custom modal) — covers internal Next.js
 *    router navigation triggered by sidebar links, command palette, and
 *    programmatic redirects within the editor. Callers must use
 *    `GuardedLink` or call `requestNavigation` directly.
 *
 * @param isServerDirty - True when the form has changes not yet persisted
 *   to the backend. Must be based on server-snapshot comparison, NOT on
 *   localStorage autosave status.
 */
export function useUnsavedChangesGuard(isServerDirty: boolean) {
  const router = useRouter();
  const [pendingNavigation, setPendingNavigation] = useState<NavigationRequest | null>(null);

  // ── 1. Native guard: tab close / browser refresh / external navigation ──
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isServerDirty) return;
      // Setting returnValue is the cross-browser way to trigger the dialog.
      // Custom messages are ignored by modern browsers for security reasons.
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isServerDirty]);

  // ── 2. Internal guard: Next.js in-app navigation ──

  /**
   * Call this before every programmatic in-app navigation from the editor.
   * If there are unsaved changes, it stores the request and surfaces a
   * confirmation modal (via `pendingNavigation`) instead of navigating
   * immediately.
   */
  const requestNavigation = useCallback(
    (href: string, navigate: () => void) => {
      if (!isServerDirty) {
        navigate();
        return;
      }
      setPendingNavigation({ href, onConfirm: navigate });
    },
    [isServerDirty],
  );

  /** User confirmed — execute the pending navigation and clear the request. */
  const confirmNavigation = useCallback(() => {
    pendingNavigation?.onConfirm();
    setPendingNavigation(null);
  }, [pendingNavigation]);

  /** User cancelled — dismiss the modal without navigating. */
  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  /**
   * Helper: navigate to `href` guarded by the unsaved-changes check.
   * Shorthand for the common case where `navigate = () => router.push(href)`.
   */
  const guardedPush = useCallback(
    (href: string) => {
      requestNavigation(href, () => router.push(href));
    },
    [requestNavigation, router],
  );

  return {
    pendingNavigation,
    requestNavigation,
    confirmNavigation,
    cancelNavigation,
    guardedPush,
  };
}
