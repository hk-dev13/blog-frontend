'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, fetchPaginatedApi } from '@/lib/api';
import type { Category, Tag } from '@/types';

/**
 * Handles taxonomy queries (categories & tags) and creation mutations.
 *
 * Selection state (`selectedCategories`, `selectedTags`) is deliberately NOT
 * stored here — it belongs to `usePostEditorForm` so there is only one source of
 * truth (koreksi #10).
 */
export function usePostTaxonomy() {
  const queryClient = useQueryClient();

  // Fetch categories
  const {
    data: categoriesData,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchPaginatedApi<Category>('/categories?limit=50'),
  });

  // Fetch tags
  const {
    data: tagsData,
    error: tagsError,
    refetch: refetchTags,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchPaginatedApi<Tag>('/tags?limit=50'),
  });

  // Create Category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) =>
      fetchApi<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // Create Tag mutation
  const createTagMutation = useMutation({
    mutationFn: (name: string) =>
      fetchApi<Tag>('/tags', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  return {
    categories: categoriesData?.data ?? [],
    tags: tagsData?.data ?? [],
    categoriesError,
    tagsError,
    refetchCategories,
    refetchTags,

    createCategory: createCategoryMutation.mutateAsync,
    createTag: createTagMutation.mutateAsync,
    isCreating:
      createCategoryMutation.isPending || createTagMutation.isPending,
  };
}
