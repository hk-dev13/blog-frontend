import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryPageView, generateCategoryMetadata } from '@/app/categories/[slug]/page';
import { isLocale, Locale } from '@/lib/i18n';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return { title: 'Category Not Found' };
  return generateCategoryMetadata(slug, locale);
}

export default async function LocalizedCategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  return <CategoryPageView slug={slug} locale={locale as Locale} />;
}
