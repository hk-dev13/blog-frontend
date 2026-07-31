'use client';

import type { AutosaveEnvelope, RestoreState } from '@/lib/editorUtils';

interface AutosaveRestorePromptProps {
  state: RestoreState;
  envelope: AutosaveEnvelope;
  onRestore: () => void;
  onDiscard: () => void;
}

/**
 * Banner prompt displayed when a valid local autosave is recovered on mount.
 * Handles both 'safe' and 'conflict' states (where server version has changed).
 */
export function AutosaveRestorePrompt({
  state,
  envelope,
  onRestore,
  onDiscard,
}: AutosaveRestorePromptProps) {
  if (state === 'none') return null;

  const minutesAgo = Math.max(1, Math.round((Date.now() - envelope.savedAt) / 60000));
  const isConflict = state === 'conflict';

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isConflict
        ? 'border-amber-300 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10'
        : 'border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/10'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${
            isConflict
              ? 'text-amber-800 dark:text-amber-300'
              : 'text-blue-800 dark:text-blue-300'
          }`}>
            {isConflict
              ? '⚠️ A local draft exists, but the server has a newer version.'
              : '📝 An autosaved draft was recovered.'}
          </p>

          <p className={`text-xs mt-0.5 ${
            isConflict
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-blue-700 dark:text-blue-400'
          }`}>
            Saved {minutesAgo === 1 ? '1 minute ago' : `${minutesAgo} minutes ago`}
            {envelope.payload.title && (
              <span className="font-medium"> — "{envelope.payload.title}"</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRestore}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors ${
              isConflict
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            Restore draft
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isConflict
                ? 'border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/20'
                : 'border-blue-200 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20'
            }`}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
