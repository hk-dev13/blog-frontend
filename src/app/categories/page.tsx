import type { Metadata } from 'next';
import { CategoriesPageView } from './CategoriesPageView';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Jelajahi semua kategori artikel di Envoyou — dari AI & Teknologi, Bisnis, Investasi, hingga Web3.',
  openGraph: {
    title: 'Categories | Envoyou',
    description: 'Jelajahi semua kategori artikel di Envoyou.',
    url: 'https://blog.envoyou.com/categories',
  },
};

export default async function CategoriesPage() {
  return <CategoriesPageView locale="id" />;
}
