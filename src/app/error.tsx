'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <span className="text-3xl">⚠️</span>
      </div>

      <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white mb-3">
        Something went wrong
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md">
        An unexpected error occurred. Please try again.
      </p>

      <button
        onClick={reset}
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-full transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
