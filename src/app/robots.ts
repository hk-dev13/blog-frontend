import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.envoyou.com';

  return {
    rules: [
      // ── Explicitly allowlist social & SEO crawlers ──────────
      // This prevents Cloudflare / CDN layers from misidentifying
      // them as malicious bots. Must come BEFORE the wildcard rule.
      {
        userAgent: [
          'facebookexternalhit',  // Facebook / Meta link preview
          'Twitterbot',           // Twitter / X card preview
          'LinkedInBot',          // LinkedIn link preview
          'WhatsApp',             // WhatsApp link preview
          'Discordbot',           // Discord link embed
          'Slackbot',             // Slack link unfurl
          'Applebot',             // Apple Search
          'Googlebot',            // Google Search
          'bingbot',              // Bing Search
          'Baiduspider',          // Baidu Search
          'DuckDuckBot',          // DuckDuckGo
          'Sogou',                // Sogou
        ],
        allow: '/',
      },
      // ── Default: allow all, protect backend & admin ─────────
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
