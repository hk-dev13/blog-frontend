export function PostCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-pulse ${
        featured ? 'md:flex-row' : ''
      }`}
    >
      {/* Image skeleton */}
      <div
        className={`bg-slate-200 dark:bg-slate-800 ${
          featured ? 'md:w-1/2 min-h-[300px]' : 'w-full aspect-[16/9]'
        }`}
      />

      {/* Content skeleton */}
      <div className={`flex flex-col flex-1 p-6 ${featured ? 'md:w-1/2 md:p-8 lg:p-12 justify-center' : ''}`}>
        {/* Meta */}
        <div className="flex items-center gap-4 mb-3">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        {/* Title */}
        <div className="space-y-2 mb-4">
          <div className={`h-5 bg-slate-200 dark:bg-slate-800 rounded w-full ${featured ? 'h-7' : ''}`} />
          <div className={`h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 ${featured ? 'h-7' : ''}`} />
        </div>

        {/* Excerpt */}
        <div className="space-y-2 mb-6">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-4/6" />
        </div>

        {/* Author */}
        <div className="mt-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    </div>
  );
}

export function PostGridSkeleton({ count = 4, featured = false }: { count?: number; featured?: boolean }) {
  return (
    <>
      {featured && <PostCardSkeleton featured />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: count }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

export function CategoryPillsSkeleton() {
  return (
    <div className="flex items-center gap-3 overflow-hidden pb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"
          style={{ width: `${60 + Math.random() * 40}px` }}
        />
      ))}
    </div>
  );
}
