"use client";

import type { Store, CategoryWithChildren } from '@repo/types';
import React from 'react';
import { StoreProvider } from '@/lib/store-context';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { TopBar } from './TopBar';

interface StoreLayoutProps {
  children: React.ReactNode;
  storeSlug: string;
  initialStore?: Store;
  initialCategories?: CategoryWithChildren[];
}

export function StoreLayout({ children, storeSlug, initialStore, initialCategories }: StoreLayoutProps) {
  return (
    <StoreProvider slug={storeSlug} initialStore={initialStore} initialCategories={initialCategories}>
      <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white font-sans antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </StoreProvider>
  );
}
