"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store-context';
import Link from 'next/link';
import { NavDropdown } from './NavDropdown';
import { Search, ShoppingBag, Heart, User, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { CategoryWithChildren } from '@repo/types';
import { useCart } from '@/lib/cart-store';
import { CartSidebar } from '../cart/CartSidebar';
import { MobileSidebar } from './MobileSidebar';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { store, isLoading } = useStore();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { getItemCount } = useCart();

  useEffect(() => {
    if (store?._id) {
      api.get<CategoryWithChildren[]>(`/stores/${store._id}/categories/tree`)
        .then((data) => {
           if (Array.isArray(data)) setCategories(data);
        })
        .catch(err => console.error(err));
    }
  }, [store?._id]);

  if (isLoading || !store) return null;

  // Filter only top-level categories (those without parentId)
  const topLevelCategories = categories.filter(cat => !cat.parentId);
  
  // Helper function to recursively build nested structure for dropdowns
  const buildDropdownColumns = (children: CategoryWithChildren[]): any[] => {
    return children.map(child => ({
      title: child.name,
      links: [
        { label: 'View All', href: `/${store.slug}/category/${child.slug}` },
        ...(child.children?.map(grand => ({
          label: grand.name,
          href: `/${store.slug}/category/${grand.slug}`
        })) || [])
      ]
    }));
  };
  
  // Use top-level categories for navigation with their children as dropdown items
  const navItems = topLevelCategories.map(cat => ({
    label: cat.name,
    href: `/${store.slug}/category/${cat.slug}`,
    columns: cat.children && cat.children.length > 0 
      ? buildDropdownColumns(cat.children)
      : []
  }));

  const itemCount = getItemCount();

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white dark:bg-black border-b border-gray-100 dark:border-white/10 transition-colors duration-300">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${store.slug}`} className="flex items-center gap-2 z-50">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="h-8 w-auto" />
            ) : (
              <span className="text-2xl font-black tracking-tighter uppercase italic transform -skew-x-12">
                {store.name}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center flex-1 absolute inset-x-0 h-16 z-40">
            <ul className="flex items-center gap-8 h-full">
              {navItems.map((item, index) => (
                <li key={index} className="h-full flex items-center group">
                  <Link 
                    href={item.href || '#'} 
                    className="font-medium text-sm text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-4 border-b-2 border-transparent hover:border-black dark:hover:border-white"
                  >
                    {item.label}
                  </Link>
                  {item.columns && item.columns.length > 0 && (
                    <NavDropdown columns={item.columns} />
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Icons / Utilities */}
          <div className="flex items-center gap-4 z-50">
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search" 
                className="bg-gray-100 dark:bg-white/10 border-none rounded-full py-2 pl-10 pr-4 text-sm w-40 focus:w-60 transition-all focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20"
              />
            </div>
            
            <ThemeToggle />
            
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
              <Heart className="w-6 h-6" />
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors relative"
            >
              <ShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black dark:bg-white text-white dark:text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {itemCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Mobile Menu */}
      <MobileSidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        categories={categories} 
      />
    </>
  );
}
