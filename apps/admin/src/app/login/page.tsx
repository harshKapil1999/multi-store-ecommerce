'use client';

import { useState, useTransition } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loginAction } from '@/lib/actions/auth';
import { Button, Card, FormInput } from '@/components/index';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    startTransition(async () => {
      try {
        const result = await loginAction(email, password);
        if (result.success && result.user) {
          setUser(result.user);
          router.push('/dashboard');
        }
      } catch (err: any) {
        setError(err.message || 'Login failed. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Sign in to your admin account</p>
        </div>

        <Card className="p-8 bg-slate-800 border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                disabled={isPending}
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-300 text-center">
              Demo credentials:
              <br />
              <code className="text-blue-400">admin@example.com</code> / <code className="text-blue-400">password</code>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Need help?{' '}
              <Link href="/" className="text-blue-400 hover:text-blue-300">
                Back to home
              </Link>
            </p>
          </div>
        </Card>

        <div className="mt-8 p-4 bg-slate-700/30 rounded-lg border border-slate-700">
          <h3 className="text-white font-medium text-sm mb-2">ℹ️ About This Dashboard</h3>
          <p className="text-slate-400 text-sm">
            This is the admin panel for managing your multi-store ecommerce platform. You'll be able to manage stores,
            products, categories, billboards, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
