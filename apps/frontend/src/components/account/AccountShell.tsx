"use client";

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Package, UserRound, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { OtpModal } from '@/components/auth/OtpModal';
import { Button } from '@/components/ui/Button';

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl items-center px-4 py-20 text-center">
        <div className="w-full">
          <UserRound className="mx-auto h-12 w-12" />
          <h1 className="mt-6 text-4xl font-black tracking-tight">Your account</h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">Sign in with your verified email to see orders, invoices, delivery tracking, profile, and saved addresses.</p>
          <Button className="mt-8 rounded-full px-10" onClick={() => setShowLogin(true)}>Sign in with email</Button>
          <OtpModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
        </div>
      </main>
    );
  }

  const links = [
    { href: `/${storeSlug}/account`, label: 'Overview', icon: UserRound },
    { href: `/${storeSlug}/account/orders`, label: 'Orders & invoices', icon: Package },
    { href: `/${storeSlug}/account/addresses`, label: 'Addresses', icon: MapPin },
    { href: `/${storeSlug}/account/profile`, label: 'Profile', icon: UserRound },
  ];

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as {user.email}</p>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Your account</h1>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => { logout(); router.push(`/${storeSlug}`); }}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto border-b pb-4 lg:flex-col lg:border-b-0 lg:border-r lg:pr-6 dark:border-white/10">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href.endsWith('/orders') && pathname.startsWith(`${href}/`));
            return (
              <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold ${active ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
