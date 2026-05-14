export interface User {
  id: string;
  name: string;
  slug?: string;
  bio?: string;
  avatar_url?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  meta_description?: string;
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
  status: 'draft' | 'published' | 'scheduled';
  is_featured: boolean;
  reading_time?: number;
  views: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  categories?: Category[];
  tags?: Tag[];
  rank?: number; // From search
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
