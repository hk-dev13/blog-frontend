import { useQuery } from '@tanstack/react-query';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import { Post, Tag, Category } from '@/types';

export function usePosts(params?: Record<string, string | number | boolean>) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, String(value));
        });
      }
      const qs = searchParams.toString();
      return fetchPaginatedApi<Post>(`/posts${qs ? `?${qs}` : ''}`);
    },
  });
}

export function usePost(slug: string, language = 'id') {
  return useQuery({
    queryKey: ['post', slug, language],
    queryFn: () => fetchApi<Post>(`/posts/${slug}?language=${language}`),
    enabled: !!slug,
  });
}

export function useSearch(query: string, language = 'id') {
  return useQuery({
    queryKey: ['search', query, language],
    queryFn: () => fetchPaginatedApi<Post>(`/search?q=${encodeURIComponent(query)}&language=${language}`),
    enabled: !!query && query.length > 2,
    staleTime: 5 * 60 * 1000, // Cache searches for 5 mins
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchApi<Tag[]>('/tags'),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCategories(language = 'id') {
  return useQuery({
    queryKey: ['categories', language],
    queryFn: () => fetchApi<Category[]>(`/categories?language=${language}`),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
