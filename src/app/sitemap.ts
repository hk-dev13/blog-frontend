import { MetadataRoute } from 'next';

const BASE_URL = 'https://blog.envoyou.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.envoyou.com/api';

// ── Server-side fetch (no auth token needed for public endpoints) ──
async function serverFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    next: { revalidate: 3600 }, // sitemap revalidates every 1 hour
  });
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface Post {
  slug: string;
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
    const res = await serverFetch<PaginatedResponse<Post>>(
      `/posts?limit=${limit}&page=${page}&status=published`
    );
    // Backend wraps paginated: { data: [...], meta: {...} }
    const posts = Array.isArray(res) ? res : (res as any).data ?? [];
    const meta = (res as any).meta;
    all.push(...posts);

    if (!meta || all.length >= meta.total || posts.length < limit) break;
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
    const categories = await serverFetch<Category[]>('/categories');
    const list = Array.isArray(categories) ? categories : (categories as any).data ?? [];
    categoryRoutes = list.map((cat: Category) => ({
      url: `${BASE_URL}/categories/${cat.slug}`,
      lastModified: new Date(cat.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error('[sitemap] Categories fetch failed:', e);
  }

  // ── 4. Tag filter pages ───────────────────────────────────
  let tagRoutes: MetadataRoute.Sitemap = [];
  try {
    const tags = await serverFetch<Tag[]>('/tags');
    const list = Array.isArray(tags) ? tags : (tags as any).data ?? [];
    tagRoutes = list.map((tag: Tag) => ({
      url: `${BASE_URL}/?tag=${tag.slug}`,
      lastModified: new Date(tag.updated_at || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error('[sitemap] Tags fetch failed:', e);
  }
  // ── 5. Author pages (unique authors from posts) ────────────
  const authorIds = new Set<string>();
  let authorRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/posts?limit=100&status=published`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const postsWithAuthors = json.data || [];
    for (const p of postsWithAuthors) {
      if (p.author_id && !authorIds.has(p.author_id)) {
        authorIds.add(p.author_id);
        authorRoutes.push({
          url: `${BASE_URL}/author/${p.author_id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        });
      }
    }
  } catch (e) {
    console.error('[sitemap] Author pages fetch failed:', e);
  }

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes, ...authorRoutes];
}
