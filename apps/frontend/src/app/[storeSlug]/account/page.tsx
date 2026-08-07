"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Package, ReceiptText, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-store';

export default function AccountOverviewPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { user } = useAuth();
  const cards = [
    { href: `/${storeSlug}/account/orders`, title: 'Orders & tracking', text: 'See payment, fulfilment, delivery updates, and invoices.', icon: Package },
    { href: `/${storeSlug}/account/addresses`, title: 'Saved addresses', text: 'Keep delivery details ready for future checkouts.', icon: MapPin },
    { href: `/${storeSlug}/account/profile`, title: 'Personal details', text: 'Review your name and verified email address.', icon: UserRound },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">Welcome back, {user?.name || 'member'}</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Everything connected to your purchases lives here.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map(({ href, title, text, icon: Icon }) => (
          <Link key={href} href={href} className="border border-gray-200 p-6 transition hover:border-black dark:border-white/10 dark:hover:border-white">
            <Icon className="h-6 w-6" />
            <h3 className="mt-6 font-bold">{title}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{text}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3 border border-gray-200 p-5 text-sm dark:border-white/10">
        <ReceiptText className="h-5 w-5" /> Invoices are available from each paid order.
      </div>
    </div>
  );
}
