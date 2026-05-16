import type { CSSProperties } from 'react';
import { Layers } from 'lucide-react';
import type { Category } from '@/types';

const CATEGORY_ICONS = {
  technologyAi: 'https://cdn.envoyou.com/category/teknologiAi.svg',
  dataInsight: 'https://cdn.envoyou.com/category/dataInsight.svg',
  financeInvestment: 'https://cdn.envoyou.com/category/keuanganInvestasi.svg',
  digitalCreator: 'https://cdn.envoyou.com/category/creatorDigital.svg',
} as const;

const CATEGORY_ICON_MATCHERS: Array<{
  iconUrl: string;
  keywords: string[];
}> = [
  {
    iconUrl: CATEGORY_ICONS.technologyAi,
    keywords: ['teknologi', 'technology', 'tech', 'ai', 'artificial-intelligence', 'kecerdasan-buatan'],
  },
  {
    iconUrl: CATEGORY_ICONS.dataInsight,
    keywords: ['data', 'insight', 'analytics', 'analitik', 'analysis', 'analisis'],
  },
  {
    iconUrl: CATEGORY_ICONS.financeInvestment,
    keywords: ['keuangan', 'finance', 'financial', 'investasi', 'investment', 'bisnis', 'business'],
  },
  {
    iconUrl: CATEGORY_ICONS.digitalCreator,
    keywords: ['creator', 'kreator', 'digital', 'content', 'konten', 'media', 'web3'],
  },
];

function normalizeCategoryText(category: Pick<Category, 'name' | 'slug'>) {
  return `${category.slug} ${category.name}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
}

export function getCategoryIconUrl(category: Pick<Category, 'name' | 'slug'>) {
  const text = normalizeCategoryText(category);
  return (
    CATEGORY_ICON_MATCHERS.find(({ keywords }) =>
      keywords.some((keyword) => text.includes(keyword)),
    )?.iconUrl ?? CATEGORY_ICONS.technologyAi
  );
}

interface CategoryIconProps {
  category: Pick<Category, 'name' | 'slug'>;
  className?: string;
}

export default function CategoryIcon({ category, className = 'h-5 w-5' }: CategoryIconProps) {
  const iconUrl = getCategoryIconUrl(category);
  const maskStyle: CSSProperties = {
    WebkitMaskImage: `url(${iconUrl})`,
    maskImage: `url(${iconUrl})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  };

  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={maskStyle}
    >
      <Layers className="h-full w-full opacity-0" />
    </span>
  );
}
