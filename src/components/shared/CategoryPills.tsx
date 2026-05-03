import Link from 'next/link';
import { Tag } from '@/types';

export default function CategoryPills({ tags, currentTagSlug }: { tags: Tag[]; currentTagSlug?: string }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
      <div className="flex items-center gap-3 w-max">
        <Link
          href="/"
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            !currentTagSlug
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Topics
        </Link>
        
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/?tag=${tag.slug}`}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              currentTagSlug === tag.slug
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
