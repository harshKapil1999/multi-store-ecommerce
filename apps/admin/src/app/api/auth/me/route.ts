import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * API Route: GET /api/auth/me
 * Proxies current user requests to the backend
 * Requires Authorization header with Bearer token
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    console.log('[API /auth/me] Request received');
    console.log('[API /auth/me] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('[API /auth/me] No auth header, returning 401');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API /auth/me] Forwarding to backend:', `${API_BASE_URL}/users/me`);
    
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await response.json();
    
    console.log('[API /auth/me] Backend response status:', response.status);
    console.log('[API /auth/me] Backend response data:', data);

    if (!response.ok) {
      console.log('[API /auth/me] Backend returned error, forwarding');
      return NextResponse.json(data, { status: response.status });
    }

    console.log('[API /auth/me] Success, returning user data');
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API /auth/me] Proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
