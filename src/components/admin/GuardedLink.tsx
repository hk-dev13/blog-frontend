'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';

// ──────────────────────────────────────────
// GuardedLink
// ──────────────────────────────────────────

type GuardedLinkProps = Omit<ComponentProps<typeof Link>, 'onClick'> & {
  /**
   * Guard function from `useUnsavedChangesGuard`.
   * Receives the href string and a `navigate` callback; it decides whether
   * to navigate immediately or surface a confirmation modal.
   */
  guardFn: (href: string, navigate: () => void) => void;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Drop-in replacement for `next/link` that routes all clicks through the
 * unsaved-changes guard.
 *
 * Use this for every navigable element inside the post editor (sidebar
 * links, breadcrumbs, logo, etc.) so that users with unsaved changes are
 * always prompted before leaving.
 *
 * @example
 * ```tsx
 * const { guardedPush } = useUnsavedChangesGuard(isServerDirty);
 *
 * <GuardedLink href="/admin/posts" guardFn={requestNavigation}>
 *   Back to Posts
 * </GuardedLink>
 * ```
 */
export function GuardedLink({
  href,
  guardFn,
  onClick,
  children,
  ...rest
}: GuardedLinkProps) {
  const router = useRouter();
  const destination = href.toString();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Allow modifier keys (Ctrl/Cmd + click opens in new tab) to pass through
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    onClick?.(e);
    guardFn(destination, () => router.push(destination));
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
