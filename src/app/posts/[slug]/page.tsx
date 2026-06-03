import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { SITE_URL } from '@/lib/env';
import { Post } from '@/types';
import ReadingProgress from '@/components/shared/ReadingProgress';
import ArticleRenderer from '@/components/shared/ArticleRenderer';

// Dynamic params
type Props = {
  params: Promise<{ slug: string }>;
};

// Generate SEO Metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const post = await fetchApi<Post>(`/posts/${resolvedParams.slug}`);

    // URL served by opengraph-image.tsx
    const ogImageUrl = `${SITE_URL}/posts/${resolvedParams.slug}/opengraph-image`;
    const title = post.meta_title || post.title;
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
  } catch {
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

    // Use backend's dedicated related endpoint (single optimized query)
    try {
      const related = await fetchApi<Post[]>(`/posts/${resolvedParams.slug}/related`);
      relatedPosts = (related || []).slice(0, 2);
    } catch {
      // Silently ignore — related is non-critical
    }
  } catch {
    notFound();
  }

  const imageUrl = post.cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';

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
      image: post.author?.avatar_url || 'https://cdn.envoyou.com/admin/husniKusumaEnvoyou.webp',
      description: 'Self-taught Fullstack Developer & AI enthusiast. Founder of Envoyou.',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Envoyou',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/LogoBaru.svg` },
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
      <ReadingProgress />
      <ArticleRenderer post={post} postUrl={postUrl} relatedPosts={relatedPosts} />
    </>
  );
}
