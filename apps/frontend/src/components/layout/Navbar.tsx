"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store-context';
import Link from 'next/link';
import { NavDropdown } from './NavDropdown';
import { Search, ShoppingBag, Heart, Menu, X, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CategoryWithChildren } from '@repo/types';
import { useCart } from '@/lib/cart-store';
import { CartSidebar } from '../cart/CartSidebar';
import { MobileSidebar } from './MobileSidebar';
import { ThemeToggle } from './ThemeToggle';
import { useWishlist } from '@/lib/wishlist-store';
import { useAuth } from '@/lib/auth-store';
import { OtpModal } from '@/components/auth/OtpModal';

type SearchSuggestion = {
  _id: string;
  name: string;
  slug: string;
  featuredImage: string;
  sellingPrice: number;
};

export function Navbar() {
  const { store, isLoading } = useStore();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const router = useRouter();
  const { getItemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (store?._id) {
      api.get<CategoryWithChildren[]>(`/stores/${store._id}/categories/tree`)
        .then((data) => {
           if (Array.isArray(data)) setCategories(data);
        })
        .catch(err => console.error(err));
    }
  }, [store?._id]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!store?._id || query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsSearching(true);
      api.get<SearchSuggestion[]>(
        `/stores/${store._id}/products/search/suggestions?search=${encodeURIComponent(query)}&limit=6`
      )
        .then((data) => setSuggestions(Array.isArray(data) ? data : []))
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [searchQuery, store?._id]);

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

  const itemCount = getItemCount(store._id);
  const wishlistCount = wishlistItems.filter((item) => item.storeId === store._id).length;

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setIsSearchOpen(false);
      router.push(`/${store.slug}/search?q=${encodeURIComponent(query)}`);
    }
  };

  const searchSuggestions = (mobile = false) => {
    if (searchQuery.trim().length < 2) return null;

    return (
      <div className={mobile
        ? 'mt-4 overflow-hidden border-y border-gray-200 dark:border-white/10'
        : 'absolute right-0 top-12 w-96 overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-950'
      }>
        {isSearching ? (
          <p className="px-4 py-5 text-sm text-gray-500">Finding products...</p>
        ) : suggestions.length > 0 ? (
          <ul>
            {suggestions.map((product) => (
              <li key={product._id} className="border-b border-gray-100 last:border-0 dark:border-white/10">
                <Link
                  href={`/${store.slug}/product/${product.slug}`}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <img src={product.featuredImage} alt="" className="h-12 w-12 bg-gray-100 object-cover dark:bg-zinc-900" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{product.name}</span>
                    <span className="text-xs text-gray-500">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <button type="submit" className="w-full px-4 py-3 text-left text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5">
                View all results for “{searchQuery.trim()}”
              </button>
            </li>
          </ul>
        ) : (
          <p className="px-4 py-5 text-sm text-gray-500">No suggestions yet. Press Enter to search.</p>
        )}
      </div>
    );
  };

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
          <div className="flex items-center gap-1 md:gap-4 z-50">
            <form onSubmit={handleSearch} role="search" className="relative hidden md:block">
              <button
                type="submit"
                aria-label="Submit search"
                className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2 text-gray-500 hover:text-black dark:hover:text-white"
              >
                <Search className="w-4 h-4 text-gray-500" />
              </button>
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label={`Search ${store.name}`}
                className="bg-gray-100 dark:bg-white/10 border-none rounded-full py-2 pl-10 pr-4 text-sm w-40 focus:w-60 transition-all focus:ring-1 focus:ring-gray-300 dark:focus:ring-white/20"
              />
              {searchSuggestions()}
            </form>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors md:hidden"
              aria-label="Open product search"
            >
              <Search className="h-6 w-6" />
            </button>
            
            <ThemeToggle />

            {isAuthenticated ? (
              <Link href={`/${store.slug}/account`} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" aria-label="Your account">
                <UserRound className="h-6 w-6" />
              </Link>
            ) : (
              <button type="button" onClick={() => setIsLoginOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" aria-label="Sign in">
                <UserRound className="h-6 w-6" />
              </button>
            )}
            
            <Link
              href={`/${store.slug}/wishlist`}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Heart className="w-6 h-6" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs font-semibold text-white dark:bg-white dark:text-black">
                  {wishlistCount}
                </span>
              )}
            </Link>
            
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

      <OtpModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSuccess={() => setIsLoginOpen(false)} />

      {isSearchOpen && (
        <div className="fixed inset-0 z-[80] bg-white text-black dark:bg-black dark:text-white md:hidden">
          <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-white/10">
            <form onSubmit={handleSearch} role="search" className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`Search ${store.name}`}
                className="w-full rounded-full border-0 bg-gray-100 py-3 pl-12 pr-4 text-base outline-none ring-0 dark:bg-white/10"
              />
              {searchSuggestions(true)}
            </form>
            <button type="button" onClick={() => setIsSearchOpen(false)} className="p-2" aria-label="Close search">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
