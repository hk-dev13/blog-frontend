import { useQuery } from '@tanstack/react-query';

import { fetchApi } from '@/lib/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { InternalLinkSuggestionsResponse } from '@/types';

interface UseInternalLinkSuggestionsOptions {
  query: string;
  excludePostId?: string;
  enabled?: boolean;
  limit?: number;
}

export function useInternalLinkSuggestions({
  query,
  excludePostId,
  enabled = true,
  limit = 5,
}: UseInternalLinkSuggestionsOptions) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: ['internal-link-suggestions', debouncedQuery, excludePostId, limit],
    enabled,
    staleTime: 60 * 1000,
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams();

      if (debouncedQuery.trim()) {
        searchParams.set('q', debouncedQuery.trim());
      }

      searchParams.set('limit', String(limit));

      if (excludePostId) {
        searchParams.set('excludePostId', excludePostId);
      }

      return fetchApi<InternalLinkSuggestionsResponse>(
        `/posts/internal-links/suggest?${searchParams.toString()}`,
        { signal }
      );
    },
  });
}
