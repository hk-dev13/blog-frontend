import { serverFetchPaginated } from '@/lib/serverApi';
import { SITE_URL } from '@/lib/env';
import { Post } from '@/types';

const FEED_URL = `${SITE_URL}/feed.xml`;

export async function GET() {
  // Fetch all published posts
  const allPosts: Post[] = [];
  try {
    let page = 1;
    const limit = 100;
    while (true) {
      const res = await serverFetchPaginated<Post>(
        `/posts?limit=${limit}&page=${page}&status=published`,
        { revalidate: 1800 },
      );
      allPosts.push(...res.data);
      if (allPosts.length >= res.meta.total || res.data.length < limit) break;
      page++;
    }
  } catch (err) {
    console.error('[RSS] Failed to fetch posts:', err);
  }

  const lastBuildDate = allPosts.length > 0
    ? new Date(allPosts[0].published_at || allPosts[0].created_at).toUTCString()
    : new Date().toUTCString();

  const items = allPosts.map((post) => {
    const pubDate = new Date(post.published_at || post.created_at).toUTCString();
    const postUrl = `${SITE_URL}/posts/${post.slug}`;
    const categories = post.categories?.map((c) => `<category>${escapeXml(c.name)}</category>`).join('\n        ') || '';
    const coverImage = post.cover_image
      ? `<enclosure url="${escapeXml(post.cover_image)}" type="image/jpeg" length="0" />`
      : '';

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(post.author?.name || 'Envoyou')}</dc:creator>
      <description><![CDATA[${post.excerpt || post.meta_description || ''}]]></description>
      ${categories}
      ${coverImage}
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <channel>
<title>Envoyou — Wawasan Teknologi, AI, dan Bisnis Modern</title>
    <link>${SITE_URL}</link>
    <description>Actionable insights and future perspectives. Eksplorasi mendalam seputar kecerdasan buatan, strategi sales, dan investasi digital oleh Envoyou.</description>
    <language>id</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/brand/logo-500.svg</url>
      <title>Envoyou</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
