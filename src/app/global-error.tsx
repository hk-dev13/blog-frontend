'use client';

import { Inter, Lora } from 'next/font/google';

const inter = Inter({ variable: '--font-sans', subsets: ['latin'] });
const lora = Lora({ variable: '--font-serif', subsets: ['latin'] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="antialiased min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-4xl">💥</span>
          </div>
          <h1 className="text-3xl font-bold font-serif mb-4">
            A Fatal Error Occurred
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8">
            We apologize for the inconvenience. A critical issue has occurred in our system.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
