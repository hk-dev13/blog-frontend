import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch, serverFetchPaginated } from '@/lib/serverApi';
import { Post, User } from '@/types';
import AuthorPageContent from './AuthorPageContent';
import { Locale } from '@/lib/i18n';

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateAuthorMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const authorName = decodeURIComponent(slug).replace(/-/g, ' ');

  try {
    const author = await serverFetch<User>(`/users/${slug}`, { revalidate: 300 });
    const name = author.name || authorName;
    const bio = author.short_bio || author.bio || `Articles by ${name} on Envoyou.`;

    return {
      title: name,
      description: bio,
      openGraph: {
        title: `${name} — Envoyou`,
        description: bio,
        type: 'profile',
        url: `https://blog.envoyou.com/${locale}/author/${slug}`,
      },
      alternates: {
        canonical: `https://blog.envoyou.com/${locale}/author/${slug}`,
        languages: {
          id: `https://blog.envoyou.com/id/author/${slug}`,
          en: `https://blog.envoyou.com/en/author/${slug}`,
        },
      },
    };
  } catch {
    return { title: authorName };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return generateAuthorMetadata(slug, 'id');
}

export async function AuthorPageView({ slug, locale = 'id' }: { slug: string; locale?: Locale }) {
  let author: User;
  let postsRes;
  try {
    [author, postsRes] = await Promise.all([
      serverFetch<User>(`/users/${slug}`, { revalidate: 300 }),
      serverFetchPaginated<Post>(`/posts?limit=9&author=${slug}&language=${locale}`, { revalidate: 300 }),
    ]);
  } catch {
    notFound();
  }

  return (
    <AuthorPageContent
      author={author}
      initialPosts={postsRes.data}
      initialMeta={postsRes.meta}
      slug={slug}
      locale={locale}
    />
  );
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  return <AuthorPageView slug={slug} locale="id" />;
}
