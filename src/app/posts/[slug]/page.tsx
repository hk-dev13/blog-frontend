import { Metadata } from 'next';
import { generatePostMetadata, PostPageView } from '@/app/posts/PostPageView';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  return generatePostMetadata(resolvedParams.slug, 'id');
}

export default async function PostPage({ params }: Props) {
  const resolvedParams = await params;
  return <PostPageView slug={resolvedParams.slug} locale="id" />;
}
