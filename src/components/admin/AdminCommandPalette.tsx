'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  FileText,
  History,
  LayoutDashboard,
  MessageSquare,
  Search,
  Tag,
  UserRound,
  X,
} from 'lucide-react';
import { fetchPaginatedApi } from '@/lib/api';
import type { Post } from '@/types';

type PaletteItem =
  | {
      kind: 'nav';
      id: string;
      title: string;
      description?: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      keywords?: string[];
      adminOnly?: boolean;
    }
  | {
      kind: 'post';
      id: string;
      title: string;
      description?: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      status?: string;
    };

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

export default function AdminCommandPalette({
  userRole,
}: {
  userRole?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const filteredItemsRef = useRef<PaletteItem[]>([]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [postSearchError, setPostSearchError] = useState<string>('');

  const navItems: PaletteItem[] = useMemo(
    () => [
      {
        kind: 'nav',
        id: 'nav-dashboard',
        title: 'Dashboard',
        description: 'Overview and analytics',
        href: '/admin',
        icon: LayoutDashboard,
        keywords: ['home', 'overview', 'analytics'],
      },
      {
        kind: 'nav',
        id: 'nav-analytics',
        title: 'Analytics',
        description: 'Views trends and top posts',
        href: '/admin/analytics',
        icon: BarChart3,
        keywords: ['views', 'top posts', 'report'],
      },
      {
        kind: 'nav',
        id: 'nav-posts',
        title: 'Posts',
        description: 'Manage drafts, scheduled, and published posts',
        href: '/admin/posts',
        icon: FileText,
        keywords: ['articles', 'content'],
      },
      {
        kind: 'nav',
        id: 'nav-create',
        title: 'Create Post',
        description: 'Start writing a new post',
        href: '/admin/posts/create',
        icon: ArrowRight,
        keywords: ['new', 'write', 'draft'],
      },
      {
        kind: 'nav',
        id: 'nav-author',
        title: 'Author Profile',
        description: 'Update your public author page',
        href: '/admin/author',
        icon: UserRound,
        keywords: ['profile', 'bio', 'social'],
      },
      {
        kind: 'nav',
        id: 'nav-comments',
        title: 'Comments',
        description: 'Moderate pending discussions',
        href: '/admin/comments',
        icon: MessageSquare,
        keywords: ['moderation', 'feedback'],
      },
      {
        kind: 'nav',
        id: 'nav-activity',
        title: 'Activity',
        description: 'Audit log of recent admin actions',
        href: '/admin/activity',
        icon: History,
        keywords: ['audit', 'log', 'history'],
      },
      {
        kind: 'nav',
        id: 'nav-tags',
        title: 'Tags',
        description: 'Manage and merge tags',
        href: '/admin/tags',
        icon: Tag,
        keywords: ['taxonomy', 'keywords'],
        adminOnly: true,
      },
    ],
    [],
  );

  const availableNavItems = useMemo(() => {
    return navItems.filter(item => item.kind !== 'nav' || !item.adminOnly || userRole === 'admin');
  }, [navItems, userRole]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isK = key === 'k';
      const isShortcut = isK && (e.metaKey || e.ctrlKey);
      if (!isShortcut) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const items = filteredItemsRef.current;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, Math.max(0, items.length - 1)));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[activeIndex];
        if (item) {
          setOpen(false);
          router.push(item.href);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, activeIndex, router]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open, debouncedQuery]);

  useEffect(() => {
    if (!open) return;
    setPostSearchError('');
    setPostResults([]);
    if (!debouncedQuery || debouncedQuery.length < 2) return;

    let cancelled = false;
    setIsSearching(true);

    const params = new URLSearchParams();
    params.set('limit', '10');
    params.set('page', '1');
    params.set('search', debouncedQuery);

    fetchPaginatedApi<Post>(`/posts/admin/list?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setPostResults(res.data || []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPostSearchError(err instanceof Error ? err.message : 'Failed to search posts');
      })
      .finally(() => {
        if (cancelled) return;
        setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const postItems: PaletteItem[] = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    return postResults.map((p) => ({
      kind: 'post',
      id: `post-${p.id}`,
      title: p.title,
      description: `/${p.slug}`,
      href: `/admin/posts/${p.id}/edit`,
      icon: FileText,
      status: p.status,
    }));
  }, [debouncedQuery, postResults]);

  const filteredItems = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    const nav = availableNavItems.filter((item) => {
      if (item.kind !== 'nav') return false;
      if (!q) return true;
      const hay = [item.title, item.description, ...(item.keywords || [])].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
    return [...nav, ...postItems];
  }, [availableNavItems, debouncedQuery, postItems]);

  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('admin:command-palette', handler as EventListener);
    return () => window.removeEventListener('admin:command-palette', handler as EventListener);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-label="Close"
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
        <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-slate-800/70">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200/70 bg-white/70 text-slate-600 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-300">
            <Search className="h-4 w-4" />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and posts…"
            className="h-10 w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none dark:text-white"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-auto p-2">
          {postSearchError && (
            <div className="px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {postSearchError}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">No results</p>
              <p className="mt-1 text-xs text-slate-500">Try a different keyword.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = idx === activeIndex;
                const subtitle = item.description;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-idx={idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl border transition-colors ${
                        isActive
                          ? 'border-white/15 bg-white/10 dark:border-slate-200 dark:bg-slate-100'
                          : 'border-slate-200/70 bg-white/70 dark:border-slate-800/70 dark:bg-slate-900/40'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isActive
                            ? 'text-white dark:text-slate-900'
                            : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                        }`}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-semibold ${isActive ? '' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </span>
                      {subtitle && (
                        <span className={`block truncate text-xs ${isActive ? 'text-white/80 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>
                          {subtitle}
                        </span>
                      )}
                    </span>
                    <span className={`text-[11px] font-semibold ${isActive ? 'text-white/70 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}>
                      ↵
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200/70 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800/70 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-slate-200/70 bg-white/60 px-2 py-1 font-semibold dark:border-slate-800/70 dark:bg-slate-900/40">
              {navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl K'}
            </span>
            <span>to open</span>
            {isSearching && <span className="ml-2 text-slate-400">Searching…</span>}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="rounded-md border border-slate-200/70 bg-white/60 px-2 py-1 font-semibold dark:border-slate-800/70 dark:bg-slate-900/40">↑↓</span>
            <span>navigate</span>
            <span className="rounded-md border border-slate-200/70 bg-white/60 px-2 py-1 font-semibold dark:border-slate-800/70 dark:bg-slate-900/40">Esc</span>
            <span>close</span>
          </div>
        </div>

      </div>
    </div>
  );
}
