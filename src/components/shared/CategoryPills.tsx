import Link from 'next/link';
import { Tag } from '@/types';
import { Locale } from '@/lib/i18n';

export default function CategoryPills({ tags, currentTagSlug, locale = 'id' }: { tags: Tag[]; currentTagSlug?: string; locale?: Locale }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
      <div className="flex items-center gap-3 w-max">
        <Link
          href={`/${locale}`}
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
            href={`/${locale}?tag=${tag.slug}`}
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
