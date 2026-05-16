import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://blog.envoyou.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.envoyou.com/api';

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
  language?: 'id' | 'en';
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
    const { data: posts, meta } = await serverFetch<Post[]>(`/posts?limit=${limit}&page=${page}`);
    
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
    ...(['id', 'en'] as const).flatMap((locale) => [
      {
        url: `${BASE_URL}/${locale}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${BASE_URL}/${locale}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/${locale}/categories`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${BASE_URL}/${locale}/search`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      },
    ]),
  ];

  // ── 2. Published posts ────────────────────────────────────
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchAllPosts();
    postRoutes = posts.map((post) => ({
      url: `${BASE_URL}/${post.language || 'id'}/posts/${post.slug}`,
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
    const allCategories = await Promise.all((['id', 'en'] as const).map(async (locale) => {
      const { data: list } = await serverFetch<Category[]>(`/categories?language=${locale}`);
      return (Array.isArray(list) ? list : []).map((cat) => ({ ...cat, language: locale }));
    }));
    categoryRoutes = allCategories.flat().map((cat: Category & { language?: 'id' | 'en' }) => ({
      url: `${BASE_URL}/${cat.language || 'id'}/categories/${cat.slug}`,
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
    const { data: postsWithAuthors } = await serverFetch<any[]>('/posts?limit=100');
    const list = Array.isArray(postsWithAuthors) ? postsWithAuthors : [];
    const seenSlugs = new Set<string>();

    for (const p of list) {
      const authorSlug = p.author?.slug;
      const key = `${p.language || 'id'}:${authorSlug}`;
      if (authorSlug && !seenSlugs.has(key)) {
        seenSlugs.add(key);
        authorRoutes.push({
          url: `${BASE_URL}/${p.language || 'id'}/author/${authorSlug}`,
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
