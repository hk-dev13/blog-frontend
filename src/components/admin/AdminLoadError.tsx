import { AlertTriangle } from 'lucide-react';

interface AdminLoadErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function AdminLoadError({
  title = "We couldn't load this data right now.",
  description = 'Please try again in a moment.',
  onRetry,
}: AdminLoadErrorProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-2">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm text-rose-800/90 dark:text-rose-200/90">
            {description}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
