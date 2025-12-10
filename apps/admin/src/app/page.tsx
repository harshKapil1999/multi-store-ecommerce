'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/index';
import { Loader2, ArrowRight, Store, Package, ShoppingCart, TrendingUp, Users, ShieldCheck } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Admin Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-6">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-6">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-24 pb-16 relative overflow-hidden flex flex-col items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-black -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black to-transparent" />
        </div>

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 backdrop-blur-xl mb-8 animate-fade-in-up">
            <ShieldCheck className="h-4 w-4 mr-2 text-emerald-400" />
            Secure Enterprise Gateway
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50">
            Control Center for <br className="hidden md:block" />
            Modern Commerce
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Orchestrate your multi-store empire from a single, powerful interface. 
            Real-time analytics, inventory management, and global scale at your fingertips.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Link href={isAuthenticated ? '/dashboard' : '/login'}>
              <Button size="lg" className="h-14 px-8 text-base bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 border-0">
                {isAuthenticated ? 'Enter Dashboard' : 'Access Console'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 px-8 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              Documentation
            </a>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: Store,
                title: "Multi-Store Architecture",
                desc: "Manage infinite storefronts with isolated inventories and themes.",
                color: "text-blue-400"
              },
              {
                icon: TrendingUp,
                title: "Real-time Analytics",
                desc: "Live insights into production, sales, and customer engagement.",
                color: "text-emerald-400"
              },
              {
                icon: Users,
                title: "Team Collaboration",
                desc: "Granular roles and permissions for your entire organization.",
                color: "text-purple-400"
              }
            ].map((feature, i) => (
              <div key={i} className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} E-Commerce Platform. Admin Console.
        </div>
      </footer>
    </div>
  );
}
