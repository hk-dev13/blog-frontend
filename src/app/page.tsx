'use client';

import PostCard from '@/components/shared/PostCard';
import CategoryPills from '@/components/shared/CategoryPills';
import { usePosts, useTags } from '@/hooks/usePosts';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function HomeContent() {
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag') || undefined;
  
  // Fetch latest posts
  const { data: latestPostsData, isLoading: isLatestLoading } = usePosts({ 
    limit: 6, 
    tag: activeTag 
  });
  
  // Fetch trending posts
  const { data: trendingPostsData, isLoading: isTrendingLoading } = usePosts({ 
    limit: 4, 
    sort: 'views', 
    order: 'desc' 
  });
  
  const { data: tagsData } = useTags();

  const latestPosts = latestPostsData?.data || [];
  const trendingPosts = trendingPostsData?.data || [];
  
  // Define featured post (first of latest if no tag selected)
  const featuredPost = !activeTag && latestPosts.length > 0 ? latestPosts[0] : null;
  const feedPosts = featuredPost ? latestPosts.slice(1) : latestPosts;

  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      
      {/* Featured Post Hero Section */}
      {!activeTag && isLatestLoading && (
        <div className="w-full h-96 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}
      
      {featuredPost && (
        <section>
          <h2 className="sr-only">Featured Article</h2>
          <PostCard post={featuredPost} featured={true} />
        </section>
      )}

      {/* Trending Section */}
      {!activeTag && trendingPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              Trending Now
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Feed & Categories */}
      <section>
        <div className="mb-8">
          <CategoryPills tags={tagsData || []} currentTagSlug={activeTag} />
        </div>
        
        <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mb-6">
          {activeTag ? `Latest in ${tagsData?.find(t => t.slug === activeTag)?.name || activeTag}` : 'Latest Feed'}
        </h2>
        
        {isLatestLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : feedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {feedPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No posts found.
          </div>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
