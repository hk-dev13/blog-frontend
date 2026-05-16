import Link from 'next/link';
import { Clock, Eye } from 'lucide-react';
import { Post, Category } from '@/types';
import { Locale } from '@/lib/i18n';

import Image from 'next/image';

const postDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

interface PostCardProps {
  post: Post;
  featured?: boolean;
  priority?: boolean;
  activeCategorySlug?: string;
  locale?: Locale;
}

export default function PostCard({ post, featured = false, priority = false, activeCategorySlug, locale = 'id' }: PostCardProps) {
  // Safe default values
  const imageUrl = post.cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80';
  const publishDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);
  const formattedDate = postDateFormatter.format(publishDate);
  const categories = post.categories ?? [];
  const primaryCategory = activeCategorySlug
    ? categories.find((category) => category.slug === activeCategorySlug) ?? categories[0]
    : categories[0];

  const badgeCategories: Category[] = [];
  if (primaryCategory) {
    badgeCategories.push(primaryCategory);
    const secondaryCategories = categories.filter((category) => category.slug !== primaryCategory.slug).slice(0, 1);
    badgeCategories.push(...secondaryCategories);
  }

  return (
    <article className={`group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1 ${featured ? 'md:flex-row' : ''}`}>
      <div className={`relative overflow-hidden ${featured ? 'md:w-1/2 min-h-[300px]' : 'w-full aspect-[16/9]'}`}>
        <Link href={`/${locale}/posts/${post.slug}`} className="absolute inset-0 z-0">
          <Image 
            src={imageUrl} 
            alt={post.cover_image_alt || post.title}
            fill
            sizes={featured ? "(max-width: 768px) 100vw, 80vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        {badgeCategories.length > 0 && (
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
            {badgeCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/${locale}/categories/${category.slug}`}
                className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary-500 text-white rounded-full shadow-sm hover:bg-primary-600 transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <div className={`flex flex-col flex-1 p-6 ${featured ? 'md:w-1/2 md:p-8 lg:p-12 justify-center' : ''}`}>
        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-3 gap-4 font-medium">
          <time dateTime={publishDate.toISOString()}>{formattedDate}</time>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{post.reading_time || 1} min read</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{post.views || 0}</span>
          </div>
        </div>
        
        <Link href={`/${locale}/posts/${post.slug}`} className="block group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          <h2 className={`font-serif font-bold text-slate-900 dark:text-white mb-3 leading-snug ${featured ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl'}`}>
            {post.title}
          </h2>
        </Link>
        
        {post.excerpt && (
          <p className={`text-slate-600 dark:text-slate-300 line-clamp-3 mb-6 ${featured ? 'text-lg' : ''}`}>
            {post.excerpt}
          </p>
        )}
        
        <div className="mt-auto flex items-center gap-3">
          {post.author?.avatar_url ? (
            <Image src={post.author.avatar_url} alt={post.author.name} width={32} height={32} className="w-[32px] h-[32px] rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">
              {post.author?.name?.charAt(0) || 'A'}
            </div>
          )}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {post.author?.name || 'Anonymous'}
          </span>
        </div>
      </div>
    </article>
  );
}
