"use client";

import { storeHref } from '@repo/utils';
import { useStore } from '@/lib/store-context';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { store } = useStore();

  if (!store?.topBar?.isVisible) return null;

  const { logo, text, message, links, backgroundColor } = store.topBar;

  return (
    <div
      className="w-full h-9 flex items-center justify-between px-4 md:px-8 text-[11px] font-medium transition-colors"
      style={{
        backgroundColor: backgroundColor || '#F5F5F5',
        color: '#111'
      }}
    >
      {/* Left side: Logo or Text */}
      <div className="flex items-center gap-4">
        {logo ? (
          <img src={logo} alt="brand logo" className="h-4 w-auto grayscale opacity-80" />
        ) : text ? (
          <span className="uppercase tracking-tight opacity-70">{text}</span>
        ) : (
          <div className="w-4 h-4 rounded-full bg-gray-300" />
        )}
      </div>

      {/* Middle: Promotion Message */}
      <div className="absolute left-1/2 -translate-x-1/2 block max-w-[60%] truncate text-center">
        <p className="hover:opacity-70 cursor-pointer">{message}</p>
      </div>

      {/* Right side: Links */}
      <div className="flex items-center gap-4">
        {links?.map((link, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <Link
              href={storeHref(link.href, store.slug)}
              className="hover:underline opacity-80"
            >
              {link.label}
            </Link>
            {idx < links.length - 1 && (
              <span className="text-gray-300">|</span>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}
