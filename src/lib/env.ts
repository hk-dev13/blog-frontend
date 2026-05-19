const DEFAULT_API_URL = 'https://api.envoyou.com/api';
const DEFAULT_SITE_URL = 'https://blog.envoyou.com';

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export const API_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL);
export const SITE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
