import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch, serverFetchPaginated } from '@/lib/serverApi';
import { SITE_URL } from '@/lib/env';
import { Post, Category } from '@/types';
import CategoryPageContent from './CategoryPageContent';

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

// Extended Category type with description
interface CategoryWithDesc extends Category {
  description?: string;
  meta_description?: string;
  post_count?: number;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const categories = await serverFetch<CategoryWithDesc[]>('/categories', { revalidate: 300 });
    const category = categories.find((c) => c.slug === slug);
    if (!category) return { title: 'Category Not Found' };

    const title = category.name;
    const description = category.meta_description || category.description || `New articles in ${category.name} on E-Blog.`;

    return {
      title,
      description,
      alternates: {
        canonical: `${SITE_URL}/categories/${slug}`,
      },
      openGraph: {
        title: `${title} | E-Blog`,
        description,
        type: 'website',
        url: `${SITE_URL}/categories/${slug}`,
      },
    };
  } catch {
    return { title: 'Category Not Found' };
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  // Parallel fetch
  const [categories, postsRes] = await Promise.all([
    serverFetch<CategoryWithDesc[]>('/categories', { revalidate: 300 }),
    serverFetchPaginated<Post>(`/posts?category=${slug}&limit=6`, { revalidate: 300 }),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const categoryUrl = `${SITE_URL}/categories/${slug}`;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
      { '@type': 'ListItem', position: 3, name: category.name, item: categoryUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <CategoryPageContent
        category={category}
        allCategories={categories}
        initialPosts={postsRes.data}
        initialMeta={postsRes.meta}
        slug={slug}
      />
    </>
  );
}
