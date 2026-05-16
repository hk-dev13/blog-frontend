import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuthorPageView, generateAuthorMetadata } from '@/app/author/[slug]/page';
import { isLocale, Locale } from '@/lib/i18n';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return { title: 'Author Not Found' };
  return generateAuthorMetadata(slug, locale);
}

export default async function LocalizedAuthorPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  return <AuthorPageView slug={slug} locale={locale as Locale} />;
}
