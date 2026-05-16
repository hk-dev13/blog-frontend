'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/usePosts';
import PostCard from '@/components/shared/PostCard';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { PostGridSkeleton } from '@/components/shared/Skeletons';
import { Post } from '@/types';
import { Locale } from '@/lib/i18n';

// Utility to highlight keyword in text
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  
  // Use regex to find case-insensitive matches
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-slate-900 dark:text-white font-medium px-1 rounded-sm">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

// Modified PostCard to support highlighting
const HighlightedPostCard = ({ post, query, locale }: { post: Post; query: string; locale: Locale }) => {
  return (
    <div className="relative group">
      <PostCard post={post} locale={locale} />
      {query && post.excerpt && (
        <div className="absolute inset-x-0 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-6 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 rounded-b-2xl border-t border-slate-100 dark:border-slate-800 pointer-events-none">
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
            <HighlightedText text={post.excerpt} highlight={query} />
          </p>
        </div>
      )}
    </div>
  );
};

export function SearchContent({ locale = 'id' }: { locale?: Locale }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce the input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
      
      // Update URL silently
      if (inputValue.trim()) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('q', inputValue);
        window.history.replaceState({}, '', newUrl);
      } else {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('q');
        window.history.replaceState({}, '', newUrl);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Fetch search results
  const { data, isLoading } = useSearch(debouncedQuery, locale);
  const results = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-5xl">
      {/* Giant Search Bar */}
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-center text-slate-900 dark:text-white mb-8">
          Explore Envoyou
        </h1>
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <SearchIcon className="h-8 w-8 text-primary-500" />
          </div>
          <input
            type="text"
            className="w-full pl-20 pr-8 py-6 text-xl md:text-2xl rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none shadow-lg dark:shadow-none transition-all"
            placeholder="What are you looking for?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-6 flex items-center">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Results Area */}
      <div className="min-h-[400px]">
        {!debouncedQuery || debouncedQuery.length <= 2 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-20">
            <p className="text-xl">Type at least 3 characters to search</p>
          </div>
        ) : isLoading ? (
          <div className="mt-8">
            <PostGridSkeleton count={4} />
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Found {data?.meta.total || results.length} results for <span className="text-slate-900 dark:text-white font-bold">"{debouncedQuery}"</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden pt-4 pb-12">
              {results.map((post) => (
                <HighlightedPostCard key={post.id} post={post} query={debouncedQuery} locale={locale} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center mt-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
              <SearchIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">No results found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              We couldn't find anything matching "{debouncedQuery}". Try different keywords.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage({ locale = 'id' }: { locale?: Locale }) {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    }>
      <SearchContent locale={locale} />
    </Suspense>
  );
}
