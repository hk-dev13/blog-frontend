'use client';

import { useMemo } from 'react';
import { diffWords, type Change } from 'diff';
import { X, RotateCcw, FileText, Calendar, User } from 'lucide-react';
import type { PostRevision } from '@/types';

interface RevisionDiffPanelProps {
  revision: PostRevision | null;
  currentContent: string;
  currentTitle: string;
  onClose: () => void;
  onRestore: (revision: PostRevision) => void;
}

const revisionDateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

/**
 * Minimal, non-destructive Markdown normalization helper for diff calculation.
 * Preserves syntax, symbols, and formatting while standardizing line endings
 * and trailing whitespace to eliminate false whitespace diffs.
 */
export function normalizeMarkdownForDiff(markdown: string): string {
  return (markdown || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Slide-in drawer panel displaying word-level diff between a historical
 * revision and the current editor state.
 */
export function RevisionDiffPanel({
  revision,
  currentContent,
  currentTitle,
  onClose,
  onRestore,
}: RevisionDiffPanelProps) {
  const contentDiff = useMemo(() => {
    if (!revision) return [];
    const oldText = normalizeMarkdownForDiff(revision.content || '');
    const newText = normalizeMarkdownForDiff(currentContent || '');
    return diffWords(oldText, newText);
  }, [revision, currentContent]);

  if (!revision) return null;

  const titleChanged = (revision.title || '').trim() !== (currentTitle || '').trim();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 text-xs font-bold font-mono">
                v{revision.revision_number}
              </span>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Revision Comparison
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {revisionDateFormatter.format(new Date(revision.created_at))}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 uppercase font-mono text-[11px]">
                {revision.source || 'manual_edit'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close diff panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">Legend:</span>
            <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/50">
              <span className="line-through">Removed in current</span>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">
              Added in current
            </span>
          </div>

          {/* Title Diff */}
          {titleChanged && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Title Difference
              </h3>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-mono text-sm space-y-1">
                <div className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                  - {revision.title}
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                  + {currentTitle}
                </div>
              </div>
            </div>
          )}

          {/* Content Diff */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Body Word Diff
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
              {contentDiff.map((part: Change, index: number) => {
                if (part.added) {
                  return (
                    <mark
                      key={index}
                      className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 rounded px-0.5 font-semibold"
                    >
                      {part.value}
                    </mark>
                  );
                }
                if (part.removed) {
                  return (
                    <del
                      key={index}
                      className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300 rounded px-0.5 line-through opacity-80"
                    >
                      {part.value}
                    </del>
                  );
                }
                return <span key={index}>{part.value}</span>;
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onRestore(revision);
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Restore v{revision.revision_number}
          </button>
        </div>
      </div>
    </>
  );
}
