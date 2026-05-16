import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch, serverFetchPaginated } from '@/lib/serverApi';
import { Post, Category } from '@/types';
import CategoryPageContent from './CategoryPageContent';
import { Locale } from '@/lib/i18n';

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

export async function generateCategoryMetadata(slug: string, locale: Locale): Promise<Metadata> {
  try {
    const categories = await serverFetch<CategoryWithDesc[]>(`/categories?language=${locale}`, { revalidate: 300 });
    const category = categories.find((c) => c.slug === slug);
    if (!category) return { title: 'Category Not Found' };

    const title = category.name;
    const description = category.meta_description || category.description || `Artikel terbaru dalam kategori ${category.name} di Envoyou.`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | Envoyou`,
        description,
        type: 'website',
        url: `https://blog.envoyou.com/${locale}/categories/${slug}`,
      },
      alternates: {
        canonical: `https://blog.envoyou.com/${locale}/categories/${slug}`,
      },
    };
  } catch {
    return { title: 'Category Not Found' };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return generateCategoryMetadata(slug, 'id');
}

export async function CategoryPageView({ slug, locale = 'id' }: { slug: string; locale?: Locale }) {
  // Parallel fetch
  const [categories, postsRes] = await Promise.all([
    serverFetch<CategoryWithDesc[]>(`/categories?language=${locale}`, { revalidate: 300 }),
    serverFetchPaginated<Post>(`/posts?category=${slug}&limit=6&language=${locale}`, { revalidate: 300 }),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <CategoryPageContent
      category={category}
      allCategories={categories}
      initialPosts={postsRes.data}
      initialMeta={postsRes.meta}
      slug={slug}
      locale={locale}
    />
  );
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  return <CategoryPageView slug={slug} locale="id" />;
}
