export const LOCALES = ['id', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'id';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'id' || value === 'en';
}

export function getOppositeLocale(locale: Locale): Locale {
  return locale === 'id' ? 'en' : 'id';
}

export function withLocale(path: string, locale: Locale) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalizedPath === '/' ? '' : normalizedPath}`;
}

export function stripLocale(pathname: string) {
  const [, maybeLocale, ...rest] = pathname.split('/');
  if (isLocale(maybeLocale)) {
    return `/${rest.join('/')}`;
  }
  return pathname;
}
