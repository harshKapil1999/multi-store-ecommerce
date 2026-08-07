import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BASE_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1'
).replace(/\/$/, '');

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function forward(request: NextRequest, context: RouteContext) {
  const session = await getSession();
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!session?.userId || !sessionToken || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const targetUrl = `${API_BASE_URL}/${path.map(encodeURIComponent).join('/')}${incomingUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');

  if (contentType) headers.set('content-type', contentType);
  if (accept) headers.set('accept', accept);
  headers.set('cookie', `${ADMIN_SESSION_COOKIE}=${sessionToken}`);

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  try {
    const backendResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers();

    for (const name of ['content-type', 'content-disposition', 'cache-control']) {
      const value = backendResponse.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    return new NextResponse(await backendResponse.arrayBuffer(), {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Admin API bridge] Backend request failed:', error);
    return NextResponse.json(
      { success: false, message: 'The commerce backend is temporarily unavailable.' },
      { status: 502 }
    );
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
