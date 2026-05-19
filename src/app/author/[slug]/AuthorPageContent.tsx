'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import PostCard from '@/components/shared/PostCard';
import { Post, User } from '@/types';
import { Loader2, BookOpen, Eye } from 'lucide-react';

import { API_URL } from '@/lib/env';
const numberFormatter = new Intl.NumberFormat('en-US');

const socialFields = [
  {
    key: 'website',
    label: 'Website',
    iconUrl: 'https://cdn.envoyou.com/iconSosmed/web.svg',
    iconClassName: 'text-primary-600 dark:text-primary-400',
  },
  {
    key: 'github',
    label: 'GitHub',
    iconUrl: 'https://cdn.envoyou.com/iconSosmed/github.svg',
    iconClassName: 'text-slate-800 dark:text-white',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    iconUrl: 'https://cdn.envoyou.com/iconSosmed/linkedin.svg',
    iconClassName: 'text-[#0A66C2] dark:text-[#7AB8FF]',
  },
  {
    key: 'x',
    label: 'X',
    iconUrl: 'https://cdn.envoyou.com/iconSosmed/x-twitter.svg',
    iconClassName: 'text-slate-950 dark:text-white',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    iconUrl: 'https://cdn.envoyou.com/iconSosmed/instagram.svg',
    iconClassName: 'text-[#E4405F] dark:text-[#FF8AB3]',
  },
] as const;

function SocialIcon({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      title={label}
      className={`inline-block shrink-0 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain] ${className || ''}`}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
      }}
    />
  );
}

interface Props {
  author: User;
  initialPosts: Post[];
  initialMeta: { page: number; limit: number; total: number; totalPages: number };
  slug: string;
}

export default function AuthorPageContent({ author, initialPosts, initialMeta, slug }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = meta.page < meta.totalPages;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = meta.page + 1;
      const res = await fetch(
        `${API_URL}/posts?author=${slug}&limit=${meta.limit}&page=${nextPage}`,
      );
      const json = await res.json();
      if (json.success) {
        setPosts((prev) => [...prev, ...json.data]);
        setMeta(json.meta);
      }
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, meta, slug]);

  // Calculate total views
  const totalViews = posts.reduce((acc, post) => acc + (post.views || 0), 0);
  const shortBio = author.short_bio || author.bio;
  const longBio = author.full_bio;
  const socialLinks = author.social_links || {};
  const visibleSocialLinks = socialFields.filter(field => socialLinks[field.key]);

  return (
    <div className="container mx-auto px-4 py-10 md:py-16 max-w-5xl">
      {/* Author Header */}
      <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-12 text-center shadow-2xl shadow-slate-950/10 md:px-10 md:py-16 mb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(13,135,207,0.28),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
        {/* Avatar */}
        <div className="mb-6 flex justify-center">
          {author.avatar_url ? (
            <Image
              src={author.avatar_url}
              alt={author.name}
              width={120}
              height={120}
              className="w-[120px] h-[120px] rounded-full object-cover ring-4 ring-white/15 shadow-2xl"
            />
          ) : (
            <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-4 ring-white/15">
              {author.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Name */}
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4">
          {author.name}
        </h1>

        {/* Short Bio */}
        {shortBio && (
          <p className="text-base md:text-lg text-slate-100 max-w-2xl mx-auto leading-8">
            {shortBio}
          </p>
        )}

        {/* Long Bio */}
        {longBio && (
          <p className="mt-3 text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-7">
            {longBio}
          </p>
        )}

        {/* Social Links */}
        {visibleSocialLinks.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {visibleSocialLinks.map((field) => (
              <a
                key={field.key}
                href={socialLinks[field.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-slate-200 hover:border-primary-400 hover:bg-primary-500/10 hover:text-white transition-colors"
              >
                <SocialIcon
                  src={field.iconUrl}
                  label={field.label}
                  className="h-4 w-4 text-white"
                />
                {field.label}
              </a>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300">
          <div className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-2">
            <BookOpen className="w-4 h-4" />
            <span>{meta.total} {meta.total === 1 ? 'article' : 'articles'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-2">
            <Eye className="w-4 h-4" />
            <span>{numberFormatter.format(totalViews)} total views</span>
          </div>
        </div>
        </div>
      </header>

      {/* Articles */}
      <section>
        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-8">
          Articles by {author.name}
        </h2>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <p className="text-xl">No articles yet.</p>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-12">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="group px-8 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full font-medium text-slate-700 dark:text-slate-200 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More Articles
                  <span className="text-slate-400 dark:text-slate-500 text-sm">
                    ({meta.total - posts.length} remaining)
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
