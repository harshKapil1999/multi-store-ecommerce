'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/index';
import {
  ArrowRight,
  BarChart3,
  Layers3,
  Loader2,
  Package,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-neutral-400">Loading admin console...</p>
        </div>
      </div>
    );
  }

  const dashboardHref = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-black">
              <Store className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-semibold">Commerce Admin</p>
              <p className="text-xs text-neutral-400">Multi-store operations</p>
            </div>
          </Link>
          <Link href={dashboardHref}>
            <Button className="rounded-full bg-white px-6 text-black hover:bg-neutral-200">
              {isAuthenticated ? 'Open Dashboard' : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[0.95fr_1.05fr] md:px-8 md:py-20">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-neutral-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Firebase-secured admin access
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-none md:text-7xl">
              Run every storefront from one clear command center.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              Manage stores, billboards, products, variants, orders, and transactions with a focused
              dashboard built for daily commerce operations.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={dashboardHref}>
                <Button size="lg" className="h-14 rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-neutral-200">
                  {isAuthenticated ? 'Enter Dashboard' : 'Access Console'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 px-8 text-base font-semibold text-white hover:bg-white/10"
              >
                Configure Firebase Login
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-neutral-950 p-4">
            <div className="rounded-md border border-white/10 bg-black p-6">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Today</p>
                  <h2 className="text-2xl font-semibold">Operations Snapshot</h2>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                  Live
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Store, label: 'Stores', value: 'Active catalog control' },
                  { icon: Package, label: 'Products', value: 'Variants and inventory' },
                  { icon: ShoppingCart, label: 'Orders', value: 'Status and fulfillment' },
                  { icon: BarChart3, label: 'Transactions', value: 'Razorpay reconciliation' },
                ].map((item) => (
                  <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.03] p-5">
                    <item.icon className="mb-5 h-6 w-6 text-white" />
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="mt-1 text-sm text-neutral-400">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-neutral-950">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-3 md:px-8">
            {[
              { icon: Layers3, title: 'Storefront publishing', copy: 'Toggle availability and keep each live store connected to its catalog.' },
              { icon: Users, title: 'Customer workflows', copy: 'OTP login, checkout, order emails, and tracking stay attached to every order.' },
              { icon: ShieldCheck, title: 'Payment safety', copy: 'Razorpay verification and webhook capture protect order creation and fulfillment.' },
            ].map((feature) => (
              <div key={feature.title} className="rounded-md border border-white/10 bg-black p-6">
                <feature.icon className="mb-5 h-6 w-6 text-neutral-200" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{feature.copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black py-8">
        <div className="mx-auto max-w-7xl px-5 text-sm text-neutral-500 md:px-8">
          © {new Date().getFullYear()} Commerce Admin. Built for multi-store retail teams.
        </div>
      </footer>
    </div>
  );
}
