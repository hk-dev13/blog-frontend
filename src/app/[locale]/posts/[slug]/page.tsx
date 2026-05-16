import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generatePostMetadata, PostPageView } from '@/app/posts/[slug]/page';
import { isLocale, Locale } from '@/lib/i18n';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return { title: 'Post Not Found' };
  return generatePostMetadata(slug, locale);
}

export default async function LocalizedPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  return <PostPageView slug={slug} locale={locale as Locale} />;
}
