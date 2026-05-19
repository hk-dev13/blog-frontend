import { MetadataRoute } from 'next';
import { API_URL, SITE_URL } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = SITE_URL;

// ── Server-side fetch (no auth token needed for public endpoints) ──
async function serverFetch<T>(endpoint: string): Promise<{ data: T; meta?: any }> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    next: { revalidate: 3600 }, // sitemap revalidates every 1 hour
  });
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
  const json = await res.json();
  // Return both data and meta (if exists)
  return { data: json.data as T, meta: json.meta };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface Post {
  slug: string;
  author_id?: string;
  author?: { id: string; slug?: string };
  updated_at?: string;
  published_at?: string;
}

interface Category {
  slug: string;
  updated_at?: string;
}

interface Tag {
  slug: string;
  updated_at?: string;
}

// ── Fetch ALL posts across pages ──────────────────────────────
async function fetchAllPosts(): Promise<Post[]> {
  const all: Post[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const { data: posts, meta } = await serverFetch<Post[]>(
      `/posts?limit=${limit}&page=${page}&status=published`
    );
    
    if (Array.isArray(posts)) {
      all.push(...posts);
    }

    // Break if no more pages
    if (!meta || all.length >= meta.total || (Array.isArray(posts) && posts.length < limit)) break;
    page++;
  }

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── 1. Static routes ──────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // ── 2. Published posts ────────────────────────────────────
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchAllPosts();
    postRoutes = posts.map((post) => ({
      url: `${BASE_URL}/posts/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (e) {
    console.error('[sitemap] Posts fetch failed:', e);
  }

  // ── 3. Category filter pages ──────────────────────────────
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: list } = await serverFetch<Category[]>('/categories');
    const categories = Array.isArray(list) ? list : [];
    categoryRoutes = categories.map((cat: Category) => ({
      url: `${BASE_URL}/categories/${cat.slug}`,
      lastModified: new Date(cat.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error('[sitemap] Categories fetch failed:', e);
  }

  // ── 4. Tag pages intentionally excluded from sitemap ─────────
  // /?tag=* URLs are parameterized views of the homepage.
  // They are disallowed in robots.txt and set to noindex via metadata.
  // Submitting them here would signal importance to Google — counterproductive.
  // ── 5. Author pages (unique authors from posts) ────────────
  const authorRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: postsWithAuthors } = await serverFetch<any[]>('/posts?limit=100&status=published');
    const list = Array.isArray(postsWithAuthors) ? postsWithAuthors : [];
    const seenSlugs = new Set<string>();

    for (const p of list) {
      const authorSlug = p.author?.slug;
      if (authorSlug && !seenSlugs.has(authorSlug)) {
        seenSlugs.add(authorSlug);
        authorRoutes.push({
          url: `${BASE_URL}/author/${authorSlug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        });
      }
    }
  } catch (e) {
    console.error('[sitemap] Author pages fetch failed:', e);
  }

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...authorRoutes];
}
