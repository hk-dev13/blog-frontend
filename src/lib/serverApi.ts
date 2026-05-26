/**
 * Server-side API utilities.
 * Unlike `lib/api.ts` these do NOT depend on Zustand (client-only store)
 * and are safe to call from Server Components, Route Handlers, and
 * generateMetadata / generateStaticParams.
 */

import { API_URL } from '@/lib/env';

interface FetchOptions {
  revalidate?: number;  // ISR seconds, default 300
}

/**
 * Fetch a single resource. Backend wraps responses as `{ success, data }`.
 */
export async function serverFetch<T>(
  endpoint: string,
  opts: FetchOptions = {},
): Promise<T> {
  const { revalidate = 300 } = opts;

  const res = await fetch(`${API_URL}${endpoint}`, {
    cache: revalidate > 0 ? 'force-cache' : 'no-store',
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`[serverFetch] ${endpoint} → ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

/**
 * Fetch a paginated list. Backend wraps as `{ success, data, meta }`.
 */
export async function serverFetchPaginated<T>(
  endpoint: string,
  opts: FetchOptions = {},
): Promise<{ data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const { revalidate = 300 } = opts;

  const res = await fetch(`${API_URL}${endpoint}`, {
    cache: revalidate > 0 ? 'force-cache' : 'no-store',
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`[serverFetchPaginated] ${endpoint} → ${res.status}`);
  }

  const json = await res.json();
  return { data: json.data, meta: json.meta };
}
