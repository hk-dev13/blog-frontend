import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch, serverFetchPaginated } from '@/lib/serverApi';
import { Post, User } from '@/types';
import AuthorPageContent from './AuthorPageContent';

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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
        url: `https://blog.envoyou.com/author/${slug}`,
      },
    };
  } catch {
    return { title: authorName };
  }
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;

  let author: User;
  let postsRes;
  try {
    [author, postsRes] = await Promise.all([
      serverFetch<User>(`/users/${slug}`, { revalidate: 300 }),
      serverFetchPaginated<Post>(`/posts?limit=9&author=${slug}`, { revalidate: 300 }),
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
    />
  );
}
