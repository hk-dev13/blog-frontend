import { MetadataRoute } from 'next';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { Post, Category } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog-envoyou.vercel.app';

  // Static routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  try {
    // Fetch all published posts
    // For a very large blog, you'd use pagination here or multiple sitemaps
    const postsRes = await fetchPaginatedApi<Post>('/posts?limit=100');
    
    const postUrls = postsRes.data.map((post) => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...routes, ...postUrls];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return routes;
  }
}
