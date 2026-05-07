import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { Post } from '@/types';
import { format } from 'date-fns';
import { Clock, Eye, RefreshCw } from 'lucide-react';
import CategoryPills from '@/components/shared/CategoryPills';
import PostCard from '@/components/shared/PostCard';
import ShareButtons from '@/components/shared/ShareButtons';
import CommentSection from './CommentSection';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Dynamic params
type Props = {
  params: Promise<{ slug: string }>;
};

// Generate SEO Metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const SITE_URL = 'https://blog.envoyou.com';
  try {
    const resolvedParams = await params;
    const post = await fetchApi<Post>(`/posts/${resolvedParams.slug}`);
    
    // URL served by opengraph-image.tsx (Next.js edge function)
    const ogImageUrl = `${SITE_URL}/posts/${resolvedParams.slug}/opengraph-image`;
    const title       = post.meta_title || post.title;
    const description = post.meta_description || post.excerpt || '';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        url: `${SITE_URL}/posts/${resolvedParams.slug}`,
        publishedTime: post.published_at,
        modifiedTime: post.updated_at,
        authors: post.author?.name ? [post.author.name] : [],
        tags: post.tags?.map(t => t.name),
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    return { title: 'Post Not Found' };
  }
}

export default async function PostPage({ params }: Props) {
  const resolvedParams = await params;
  let post: Post;
  let relatedPosts: Post[] = [];

  try {
    // Note: This API call should ideally increment view count on the backend.
    post = await fetchApi<Post>(`/posts/${resolvedParams.slug}`);
    
    // Fetch related posts based on the first tag
    if (post.tags && post.tags.length > 0) {
      const relatedRes = await fetchPaginatedApi<Post>(`/posts?tag=${post.tags[0].slug}&limit=3`);
      relatedPosts = relatedRes.data.filter(p => p.id !== post.id).slice(0, 2);
    }
  } catch (error) {
    notFound();
  }

  const publishDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);
  const imageUrl = post.cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';

  const SITE_URL = 'https://blog.envoyou.com';
  const postUrl = `${SITE_URL}/posts/${post.slug}`;

  // ── JSON-LD: Article Schema ──────────────────────────────
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.meta_description || '',
    image: imageUrl,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    url: postUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Husni Kusuma',
      url: SITE_URL,
      image: post.author?.avatar_url || 'https://cdn.envoyou.com/admin/avatarHusniKusuma.jpeg',
      description: 'Self-taught Fullstack Developer & Data Analyst enthusiast. Founder of Envoyou.',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Blog.Envoyou',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` },
    },
    keywords: post.tags?.map(t => t.name).join(', ') || '',
    articleSection: post.categories?.[0]?.name || '',
  };

  // ── JSON-LD: BreadcrumbList Schema ──────────────────────
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      ...(post.categories?.[0] ? [{
        '@type': 'ListItem',
        position: 2,
        name: post.categories[0].name,
        item: `${SITE_URL}/categories/${post.categories[0].slug}`,
      }] : []),
      { '@type': 'ListItem', position: post.categories?.[0] ? 3 : 2, name: post.title, item: postUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <main className="pb-16">
      <article>
        {/* Header Section */}
        <header className="container mx-auto px-4 py-12 md:py-20 max-w-4xl text-center">
          {post.categories && post.categories.length > 0 && (
            <span className="inline-block px-3 py-1 mb-6 text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-full">
              {post.categories[0].name}
            </span>
          )}
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 dark:text-white leading-tight mb-8">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              {post.author?.avatar_url ? (
                <Image src={post.author.avatar_url} alt={post.author.name} width={32} height={32} className="rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                  {post.author?.name?.charAt(0) || 'A'}
                </div>
              )}
              <span className="font-medium text-slate-700 dark:text-slate-300">{post.author?.name || 'Anonymous'}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <time dateTime={publishDate.toISOString()}>
                <span className="sr-only">Published: </span>
                📅 {format(publishDate, 'MMMM d, yyyy')}
              </time>
              
              {post.updated_at && new Date(post.updated_at).getTime() - publishDate.getTime() > 24 * 60 * 60 * 1000 && (
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium" title="Terakhir diperbarui">
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  <span className="sr-only">Last updated: </span>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <time dateTime={new Date(post.updated_at).toISOString()}>
                    {format(new Date(post.updated_at), 'MMM d, yyyy')}
                  </time>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{post.reading_time || 1} min read</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.views || 0} views</span>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="relative w-full max-w-6xl mx-auto px-4 mb-12 md:mb-20 aspect-[21/9]">
          <Image 
            src={imageUrl} 
            alt={post.cover_image_alt || post.title} 
            fill
            sizes="100vw"
            priority
            className="object-cover rounded-2xl shadow-xl"
          />
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Prose Wrapper for Typography */}
          <div className="prose prose-lg dark:prose-invert prose-slate prose-headings:font-serif prose-a:text-primary-600 hover:prose-a:text-primary-500 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag.id} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-sm">
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share Buttons */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <ShareButtons url={postUrl} title={post.title} />
          </div>

          {/* Comment Section */}
          <CommentSection postId={post.id} />
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-slate-50 dark:bg-slate-900/50 py-16 mt-16 border-t border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-8 text-center">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
    </>
  );
}
