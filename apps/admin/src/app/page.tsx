'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/index';
import { Loader2, ArrowRight, Store, Package, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-white">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Multi-Store <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">eCommerce</span> Admin
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Manage multiple stores, products, orders, and inventory from a single powerful dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href={isAuthenticated ? '/dashboard' : '/login'}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-lg border border-slate-600 text-white font-medium hover:bg-slate-800 transition"
            >
              View Docs
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-700">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Powerful Features</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/80 transition group">
            <Store className="h-12 w-12 text-blue-500 mb-4 group-hover:scale-110 transition" />
            <h3 className="text-xl font-semibold text-white mb-2">Multi-Store Management</h3>
            <p className="text-slate-400">
              Manage multiple stores, each with their own products, orders, and customization. Scale your business with ease.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/80 transition group">
            <Package className="h-12 w-12 text-cyan-500 mb-4 group-hover:scale-110 transition" />
            <h3 className="text-xl font-semibold text-white mb-2">Product Management</h3>
            <p className="text-slate-400">
              Create, edit, and manage products with rich media uploads, categorization, and inventory tracking.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-green-500/50 hover:bg-slate-800/80 transition group">
            <ShoppingCart className="h-12 w-12 text-green-500 mb-4 group-hover:scale-110 transition" />
            <h3 className="text-xl font-semibold text-white mb-2">Order Tracking</h3>
            <p className="text-slate-400">
              Track orders in real-time, manage fulfillment, and communicate with customers all from one place.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-slate-700 rounded-2xl p-12 text-center space-y-4">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            {isAuthenticated
              ? "You're all set! Head to your dashboard to start managing your stores and products."
              : 'Sign in with your admin account to access the full dashboard and manage your stores.'}
          </p>
          <div className="pt-4">
            <Link href={isAuthenticated ? '/dashboard' : '/login'}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Info */}
      {!isAuthenticated && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-700">
          <div className="max-w-2xl mx-auto p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Demo Credentials</h3>
            <div className="space-y-3 text-slate-300">
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <code className="text-blue-400 font-mono">admin@example.com</code>
              </div>
              <div>
                <p className="text-sm text-slate-400">Password</p>
                <code className="text-blue-400 font-mono">password</code>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2025 Multi-Store eCommerce Admin Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
