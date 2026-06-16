import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Articles',
  description: 'Search through all articles on Envoyou blog. Find topics about technology, AI, finance, and more.',
  robots: { index: false }, // Search pages shouldn't be indexed
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
