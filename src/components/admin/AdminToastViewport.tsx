'use client';

import { X } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

const styles = {
  base: 'pointer-events-auto w-full max-w-sm rounded-2xl border shadow-2xl backdrop-blur px-4 py-3',
  success: 'border-emerald-200/70 bg-white/90 text-slate-900 dark:border-emerald-900/40 dark:bg-slate-950/70 dark:text-white',
  error: 'border-red-200/70 bg-white/90 text-slate-900 dark:border-red-900/40 dark:bg-slate-950/70 dark:text-white',
  info: 'border-slate-200/70 bg-white/90 text-slate-900 dark:border-slate-800/70 dark:bg-slate-950/70 dark:text-white',
};

export default function AdminToastViewport() {
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[80] flex w-full max-w-sm flex-col gap-2 md:right-8 md:top-20">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            styles.base,
            t.variant === 'success' ? styles.success : t.variant === 'error' ? styles.error : styles.info,
          ].join(' ')}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{t.title}</div>
              {t.description && (
                <div className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                  {t.description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="grid h-8 w-8 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

