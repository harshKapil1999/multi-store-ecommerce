"use client";

import Link from 'next/link';
import { useStore } from '@/lib/store-context';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CategoryWithChildren } from '@repo/types';
import { Twitter, Instagram, Facebook, Youtube } from 'lucide-react';

export function Footer() {
  const { store } = useStore();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);

  useEffect(() => {
    if (store?._id) {
      api.get<CategoryWithChildren[]>(`/stores/${store._id}/categories/tree`)
        .then((data) => {
          if (Array.isArray(data)) setCategories(data);
        })
        .catch(err => console.error(err));
    }
  }, [store?._id]);

  if (!store) return null;

  // Filter only top-level categories
  const topLevelCategories = categories.filter(cat => !cat.parentId);

  const footerSections = [
    {
      title: 'Shop',
      links: topLevelCategories.map(cat => ({
        label: cat.name,
        href: `/${store.slug}/category/${cat.slug}`
      }))
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: `/${store.slug}/about` },
        { label: 'Contact Us', href: `/${store.slug}/contact` },
        { label: 'Blog', href: `/${store.slug}/blog` }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQs', href: `/${store.slug}/faq` },
        { label: 'Shipping Info', href: `/${store.slug}/shipping` },
        { label: 'Returns', href: `/${store.slug}/returns` }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: `/${store.slug}/privacy` },
        { label: 'Terms & Conditions', href: `/${store.slug}/terms` },
        { label: 'Cookies Policy', href: `/${store.slug}/cookies` }
      ]
    }
  ];

  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-white/10">
      <div className="container mx-auto px-4 md:px-8">
        {/* Top Sections */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
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
          
          {/* Social Icons */}
          <div className="flex items-start">
             <div className="flex gap-4">
                <Link href="#" className="p-2 bg-gray-800 rounded-full hover:bg-white hover:text-black transition-all">
                  <Twitter className="w-4 h-4" />
                </Link>
                <Link href="#" className="p-2 bg-gray-800 rounded-full hover:bg-white hover:text-black transition-all">
                  <Instagram className="w-4 h-4" />
                </Link>
                <Link href="#" className="p-2 bg-gray-800 rounded-full hover:bg-white hover:text-black transition-all">
                  <Facebook className="w-4 h-4" />
                </Link>
                <Link href="#" className="p-2 bg-gray-800 rounded-full hover:bg-white hover:text-black transition-all">
                  <Youtube className="w-4 h-4" />
                </Link>
             </div>
          </div>
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
