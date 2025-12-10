'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/index';

export function AuthDebug() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="p-4 bg-slate-900 text-white font-mono text-xs">
      <h3 className="font-bold text-sm mb-2 text-yellow-400">🔍 Auth Debug Info</h3>
      <div className="space-y-1">
        <p><span className="text-slate-400">isLoading:</span> {String(isLoading)}</p>
        <p><span className="text-slate-400">isAuthenticated:</span> {String(isAuthenticated)}</p>
        <p><span className="text-slate-400">user:</span> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
        <p className="text-green-400 text-[10px]">✅ Using httpOnly session cookies (secure)</p>
      </div>
      <p className="mt-2 text-yellow-300 text-[10px]">
        Check browser DevTools &gt; Application &gt; Cookies for session cookie
      </p>
    </Card>
  );
}
