'use client';

import { notFound, useParams } from 'next/navigation';
import SearchPage from '@/app/search/page';
import { isLocale, Locale } from '@/lib/i18n';

export default function LocalizedSearchPage() {
  const params = useParams<{ locale: string }>();
  if (!isLocale(params.locale)) notFound();
  return <SearchPage locale={params.locale as Locale} />;
}
