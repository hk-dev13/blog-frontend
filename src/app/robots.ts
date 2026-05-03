import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Determine the base URL for the sitemap
  // In production, this would be your actual domain
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog-envoyou.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
