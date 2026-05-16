import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';

const PUBLIC_FILE = /\.(.*)$/;

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const [, maybeLocale, ...rest] = pathname.split('/');
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-envoyou-locale', isLocale(maybeLocale) ? maybeLocale : DEFAULT_LOCALE);

  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}${search}`, req.url));
  }

  if (!isLocale(maybeLocale)) {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/${[maybeLocale, ...rest].filter(Boolean).join('/')}${search}`, req.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.svg).*)'],
};
