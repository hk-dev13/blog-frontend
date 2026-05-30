import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.has('tag')) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
    response.headers.set('Link', '<https://blog.envoyou.com/>; rel="canonical"');
  }

  return response;
}

export const config = {
  matcher: '/',
};
