import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js 16 Proxy - Minimal Implementation
 * 
 * Following Next.js 16 best practices:
 * - Proxy should be used minimally (last resort)
 * - Authentication is handled client-side in React components
 * - This proxy simply passes requests through
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export function proxy(request: NextRequest) {
  // Simply pass all requests through
  // Auth protection is handled by:
  // 1. Client-side React components (AuthContext + layout checks)
  // 2. API Route handlers validate tokens server-side
  return NextResponse.next();
}

/**
 * Minimal matcher - exclude static assets only
 * Following Next.js 16 recommendation to avoid overusing proxy
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
