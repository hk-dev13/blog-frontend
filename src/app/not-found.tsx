import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="relative mb-8">
        <span className="text-[150px] md:text-[200px] font-bold font-serif text-slate-100 dark:text-slate-800 leading-none select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <span className="text-4xl">🔍</span>
          </div>
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">
        Page Not Found
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-full transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Search Articles
        </Link>
      </div>
    </div>
  );
}
