"use client";

import React from 'react';
import { StoreProvider } from '@/lib/store-context';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface StoreLayoutProps {
  children: React.ReactNode;
  storeSlug: string;
}

export function StoreLayout({ children, storeSlug }: StoreLayoutProps) {
  return (
    <StoreProvider slug={storeSlug}>
      <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white font-sans antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <Navbar />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </div>
    </StoreProvider>
  );
}
