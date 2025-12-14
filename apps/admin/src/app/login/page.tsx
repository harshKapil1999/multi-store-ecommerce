'use client';

import { useState, useTransition } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loginAction } from '@/lib/actions/auth';
import { Button, Card, FormInput } from '@/components/index';
import { AlertCircle, Loader2, Sparkles, LayoutDashboard } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Decorative Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />

      <div className="w-full max-w-md relative z-10 px-4">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 mb-4 shadow-xl">
             <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
            Welcome Back
          </h1>
          <p className="text-neutral-400 text-sm">Sign in to your dashboard to manage your stores.</p>
        </div>

        <Card className="p-8 bg-neutral-900/50 border-neutral-800 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-200 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300 ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-950/50 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all duration-200 text-sm"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300 ml-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-950/50 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all duration-200 text-sm"
                  disabled={isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-white hover:bg-neutral-200 text-black font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-white/5 active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-800">
             <div className="flex justify-between items-center text-xs text-neutral-500">
                <span>Demo Access:</span>
                <span className="font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">admin@example.com / password</span>
             </div>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-xs text-neutral-500 hover:text-white transition-colors gap-1"
          >
            ← Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
