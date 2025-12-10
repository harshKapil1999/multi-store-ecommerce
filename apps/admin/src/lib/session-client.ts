'use client';

import { AuthUser } from '@/contexts/auth-context';

export async function getClientSession(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/session', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('[Session] Failed to fetch session:', error);
    return null;
  }
}
