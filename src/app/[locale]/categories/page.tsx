import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoriesPageView } from '@/app/categories/page';
import { isLocale, Locale } from '@/lib/i18n';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title: 'Categories',
    description: locale === 'en'
      ? 'Explore Envoyou articles by topic.'
      : 'Jelajahi semua kategori artikel di Envoyou.',
    alternates: {
      canonical: `https://blog.envoyou.com/${locale}/categories`,
      languages: {
        id: 'https://blog.envoyou.com/id/categories',
        en: 'https://blog.envoyou.com/en/categories',
      },
    },
  };
}

export default async function LocalizedCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CategoriesPageView locale={locale as Locale} />;
}
