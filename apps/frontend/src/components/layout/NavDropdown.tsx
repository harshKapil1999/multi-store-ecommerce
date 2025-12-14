"use client";

import Link from 'next/link';
import { NavColumn } from '@repo/types';

interface NavDropdownProps {
  columns: NavColumn[];
}

export function NavDropdown({ columns }: NavDropdownProps) {
  return (
    <div className="absolute top-16 left-0 w-full bg-white dark:bg-black border-t border-gray-100 dark:border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top pt-8 pb-12 z-30">
      <div className="container mx-auto px-8">
        <div className="flex justify-center gap-x-12">
          {columns.map((col, idx) => (
            <div key={idx} className="w-48">
              <h3 className="font-bold text-sm mb-4 text-gray-900 dark:text-white">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link 
                      href={link.href} 
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors block py-0.5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
