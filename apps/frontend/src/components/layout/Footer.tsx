"use client";

import Link from 'next/link';
import { useStore } from '@/lib/store-context';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CategoryWithChildren, Page } from '@repo/types';

export function Footer() {
  const { store } = useStore();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    if (store?._id) {
      Promise.all([
        api.get<CategoryWithChildren[]>(`/stores/${store._id}/categories/tree`),
        api.get<Page[]>(`/stores/${store._id}/pages?published=true`),
      ])
        .then(([categoryData, pageData]) => {
          if (Array.isArray(categoryData)) setCategories(categoryData);
          if (Array.isArray(pageData)) setPages(pageData.filter((page) => !page.isHomePage));
        })
        .catch(err => console.error(err));
    }
  }, [store?._id]);

  if (!store) return null;

  // Filter only top-level categories
  const topLevelCategories = categories.filter(cat => !cat.parentId);

  const configuredSections = store.footer?.sections?.filter((section) => section.links?.length) || [];
  const footerSections = configuredSections.length > 0 ? configuredSections : [
    {
      title: 'Shop',
      links: topLevelCategories.map(cat => ({
        label: cat.name,
        href: `/${store.slug}/category/${cat.slug}`
      }))
    },
    {
      title: 'Information',
      links: pages.map((page) => ({ label: page.title, href: `/${store.slug}/${page.slug}` })),
    }
  ].filter((section) => section.links.length > 0);

  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-white/10">
      <div className="container mx-auto px-4 md:px-8">
        {/* Top Sections */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-white">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link 
                      href={link.href}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
          <div className="mb-4 md:mb-0 text-xs text-gray-500">
             &copy; {new Date().getFullYear()} {store.name}. All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
