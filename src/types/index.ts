export interface User {
  id: string;
  name: string;
  email?: string;
  role?: 'admin' | 'author' | string;
  slug: string;
  bio?: string | null;
  short_bio?: string | null;
  full_bio?: string | null;
  social_links?: Record<string, string>;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  meta_description?: string;
  post_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  cover_image_alt?: string;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  status: 'draft' | 'published' | 'scheduled';
  is_featured: boolean;
  reading_time?: number;
  views: number;
  source?: string | null;
  source_ref?: string | null;
  source_metadata?: Record<string, unknown> | null;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  categories?: Category[];
  tags?: Tag[];
  rank?: number; // From search
}

export interface InternalLinkSuggestion {
  id: string;
  title: string;
  slug: string;
  path: string;
  excerpt?: string | null;
  published_at?: string | null;
  views: number;
  score?: number;
  match_reason?: 'exact_title' | 'title_prefix' | 'slug_prefix' | 'full_text' | 'recommended_latest' | 'recommended_popular';
}

export interface InternalLinkSuggestionsResponse {
  recommended: InternalLinkSuggestion[];
  results: InternalLinkSuggestion[];
}

export interface Comment {
  id: string;
  post_id: string;
  name: string;
  email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface PostRevision {
  id: string;
  post_id: string;
  title: string;
  content: string;
  excerpt?: string | null;
  revision_number: number;
  created_by?: string | null;
  source?: string;
  source_ref?: string | null;
  created_at: string;
  editor?: { id?: string; name?: string } | null;
}
