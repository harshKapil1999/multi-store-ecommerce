import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import { verifyFirebaseIdToken } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAllowedAdminEmails() {
  return (process.env.FIREBASE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ message: 'Firebase ID token is required' }, { status: 400 });
    }

    const decodedToken = await verifyFirebaseIdToken(idToken);
    const email = decodedToken.email?.toLowerCase();

    if (!email) {
      return NextResponse.json({ message: 'Firebase user email is required' }, { status: 400 });
    }

    if (!decodedToken.email_verified) {
      return NextResponse.json({ message: 'Verify your email before accessing admin' }, { status: 403 });
    }

    const allowedAdminEmails = getAllowedAdminEmails();
    if (allowedAdminEmails.length === 0) {
      return NextResponse.json({ message: 'FIREBASE_ADMIN_EMAILS is not configured' }, { status: 500 });
    }

    if (!allowedAdminEmails.includes(email)) {
      return NextResponse.json({ message: 'This Firebase user is not allowed to access admin' }, { status: 403 });
    }

    const role = 'admin';
    await createSession(decodedToken.uid, email, role);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: decodedToken.uid,
          email,
          name: decodedToken.name || email.split('@')[0],
          role,
        },
      },
    });
  } catch (error: any) {
    console.error('[Firebase Auth] Session exchange failed:', error);
    const isConfigurationError = /project ID is not configured|session signing is not configured/i.test(error?.message || '');
    return NextResponse.json(
      {
        message: isConfigurationError
          ? 'Admin authentication is temporarily unavailable. Please contact support.'
          : error?.message || 'Firebase authentication failed',
      },
      { status: isConfigurationError ? 500 : 401 }
    );
  }
}
