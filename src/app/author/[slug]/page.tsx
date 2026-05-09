import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetchPaginated } from '@/lib/serverApi';
import { Post } from '@/types';
import AuthorPageContent from './AuthorPageContent';

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const authorName = decodeURIComponent(slug).replace(/-/g, ' ');

  try {
    const res = await serverFetchPaginated<Post>(`/posts?limit=1&author=${slug}`, { revalidate: 300 });
    const author = res.data[0]?.author;
    const name = author?.name || authorName;
    const bio = author?.bio || `Articles by ${name} on Envoyou.`;

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

  let postsRes;
  try {
    postsRes = await serverFetchPaginated<Post>(`/posts?limit=9&author=${slug}`, { revalidate: 300 });
  } catch {
    notFound();
  }

  // Extract author from first post
  const author = postsRes.data[0]?.author;
  if (!author) notFound();

  return (
    <AuthorPageContent
      author={author}
      initialPosts={postsRes.data}
      initialMeta={postsRes.meta}
      slug={slug}
    />
  );
}
