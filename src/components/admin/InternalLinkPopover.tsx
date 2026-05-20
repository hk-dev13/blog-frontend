'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Link2, Loader2, Search, Trash2 } from 'lucide-react';

import { useInternalLinkSuggestions } from '@/hooks/useInternalLinkSuggestions';
import { SITE_URL } from '@/lib/env';
import { InternalLinkSuggestion } from '@/types';

interface InternalLinkPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  excludePostId?: string;
  activeHref?: string | null;
  initialQuery?: string;
  onClose: () => void;
  onSelect: (href: string) => void;
  onRemove: () => void;
}

interface LinkOption {
  id: string;
  href: string;
  title: string;
  subtitle?: string | null;
  kind: 'manual' | 'internal';
  external?: boolean;
  group?: 'manual' | 'latest' | 'popular' | 'results';
}

function isUrl(text: string) {
  const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;
  return urlPattern.test(text.trim());
}

function normalizeUrl(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function toAbsoluteUrl(href: string) {
  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  return `${SITE_URL}${href.startsWith('/') ? href : `/${href}`}`;
}

function formatLinkMeta(item: InternalLinkSuggestion) {
  const parts = [item.slug];

  if (item.views > 0) {
    parts.push(`${item.views.toLocaleString()} views`);
  }

  if (item.published_at) {
    const publishedDate = new Date(item.published_at);
    if (!Number.isNaN(publishedDate.getTime())) {
      parts.push(publishedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }));
    }
  }

  return parts.join(' • ');
}

export default function InternalLinkPopover({
  open,
  anchorEl,
  excludePostId,
  activeHref,
  initialQuery = '',
  onClose,
  onSelect,
  onRemove,
}: InternalLinkPopoverProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 360 });

  const { data, isFetching } = useInternalLinkSuggestions({
    query,
    excludePostId,
    enabled: open,
    limit: 5,
  });

  const manualUrl = isUrl(query) ? normalizeUrl(query) : '';

  const options = useMemo<LinkOption[]>(() => {
    const nextOptions: LinkOption[] = [];

    if (manualUrl) {
      nextOptions.push({
        id: `manual:${manualUrl}`,
        href: manualUrl,
        title: manualUrl,
        subtitle: 'Use typed URL',
        kind: 'manual',
        external: true,
        group: 'manual',
      });
    }

    if (query.trim().length > 0) {
      (data?.results || []).forEach(item => {
        nextOptions.push({
          id: item.id,
          href: item.path,
          title: item.title,
          subtitle: formatLinkMeta(item),
          kind: 'internal',
          group: 'results',
        });
      });

      return nextOptions;
    }

    (data?.recommended || []).forEach(item => {
      nextOptions.push({
        id: item.id,
        href: item.path,
        title: item.title,
        subtitle: formatLinkMeta(item),
        kind: 'internal',
        group: item.match_reason === 'recommended_popular' ? 'popular' : 'latest',
      });
    });

    return nextOptions;
  }, [data?.recommended, data?.results, manualUrl, query]);

  const sections = useMemo(() => {
    if (query.trim().length > 0) {
      const nextSections: Array<{ title: string; items: LinkOption[] }> = [];

      const manualItems = options.filter(option => option.group === 'manual');
      const resultItems = options.filter(option => option.group === 'results');

      if (manualItems.length > 0) {
        nextSections.push({ title: 'Typed URL', items: manualItems });
      }

      if (resultItems.length > 0) {
        nextSections.push({ title: 'Internal Matches', items: resultItems });
      }

      return nextSections;
    }

    return [
      { title: 'Latest', items: options.filter(option => option.group === 'latest') },
      { title: 'Popular', items: options.filter(option => option.group === 'popular') },
    ].filter(section => section.items.length > 0);
  }, [options, query]);

  const activeOption = options[activeIndex];
  const activePreviewHref = activeOption ? toAbsoluteUrl(activeOption.href) : activeHref ? toAbsoluteUrl(activeHref) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
      return;
    }

    setQuery(initialQuery);
    window.setTimeout(() => {
      inputRef.current?.focus();
      const input = inputRef.current;
      if (!input) {
        return;
      }

      if (initialQuery) {
        input.setSelectionRange(initialQuery.length, initialQuery.length);
      } else {
        input.select();
      }
    }, 0);
  }, [initialQuery, open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, data?.recommended, data?.results]);

  useEffect(() => {
    if (!open || !anchorEl) {
      return;
    }

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const popoverWidth = 380;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const left = Math.min(
        Math.max(12, rect.left),
        Math.max(12, viewportWidth - popoverWidth - 12),
      );
      const estimatedHeight = 420;
      const shouldFlip = rect.bottom + estimatedHeight > viewportHeight - 12;
      const top = shouldFlip
        ? Math.max(12, rect.top - estimatedHeight - 8)
        : Math.min(viewportHeight - 12, rect.bottom + 8);

      setPosition({ top, left, width: popoverWidth });
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorEl, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (containerRef.current?.contains(target) || anchorEl?.contains(target)) {
        return;
      }

      onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [anchorEl, onClose, open]);

  if (!mounted || !open || !anchorEl) {
    return null;
  }

  const emptyState = query.trim().length === 0
    ? 'Latest and popular posts appear here.'
    : 'No matching articles found yet.';

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-[120] rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10"
      style={{ top: position.top, left: position.left, width: position.width, maxWidth: 'calc(100vw - 24px)' }}
      role="dialog"
      aria-label="Internal link suggestions"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (options.length > 0) {
            setActiveIndex(index => (index + 1) % options.length);
          }
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (options.length > 0) {
            setActiveIndex(index => (index - 1 + options.length) % options.length);
          }
          return;
        }

        if (event.key === 'Enter' && options[activeIndex]) {
          event.preventDefault();
          onSelect(options[activeIndex].href);
        }
      }}
    >
      <div className="border-b border-slate-200 p-3 dark:border-slate-700">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
            placeholder="Search your articles or paste a URL..."
          />
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto p-2">
        {options.length > 0 ? (
          <div className="space-y-3">
            {sections.map(section => (
              <div key={section.title}>
                <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map(option => {
                    const index = options.findIndex(item => item.id === option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onSelect(option.href)}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                          index === activeIndex
                            ? 'bg-primary-50 text-slate-900 dark:bg-primary-900/20 dark:text-white'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className={`mt-0.5 rounded-lg p-1.5 ${
                          option.external
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                        }`}>
                          {option.external ? <ExternalLink className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{option.title}</div>
                          {option.subtitle ? (
                            <div className="truncate text-xs text-slate-400 dark:text-slate-500">{option.subtitle}</div>
                          ) : null}
                          {!option.external ? (
                            <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                              {toAbsoluteUrl(option.href)}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {emptyState}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <div className="min-w-0">
          <div>Use arrows + Enter to pick a link</div>
          {activePreviewHref ? (
            <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">
              Preview: {activePreviewHref}
            </div>
          ) : null}
        </div>
        {activeHref ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove link
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
