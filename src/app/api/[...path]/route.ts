import { NextRequest, NextResponse } from 'next/server';

const TARGET_API = 'https://staging-api-eete.onrender.com/api';

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathString = path.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const url = `${TARGET_API}/${pathString}${searchParams ? `?${searchParams}` : ''}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'content-length', 'origin', 'referer'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });

    const resHeaders = new Headers(response.headers);
    resHeaders.delete('content-encoding');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Proxy error' }, { status: 500 });
  }
}

export { handleProxy as GET, handleProxy as POST, handleProxy as PUT, handleProxy as PATCH, handleProxy as DELETE };
