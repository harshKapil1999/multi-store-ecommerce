import { X, ChevronRight, ChevronDown, Heart, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store-context';
import { CategoryWithChildren } from '@repo/types';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/lib/auth-store';
import { useWishlist } from '@/lib/wishlist-store';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryWithChildren[];
  onSignIn: () => void;
}

export function MobileSidebar({ isOpen, onClose, categories, onSignIn }: MobileSidebarProps) {
  const { store } = useStore();
  const { isAuthenticated } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!store) return null;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const topLevelCategories = categories.filter(cat => !cat.parentId);
  const wishlistCount = wishlistItems.filter((item) => item.storeId === store._id).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 backdrop-blur-sm lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 w-full sm:w-[350px] bg-white dark:bg-black z-[70] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
          <span className="font-bold text-lg">Menu</span>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-4 space-y-2">
            {/* Top Level Links */}
            <Link 
                href={`/${store.slug}`}
                onClick={onClose}
                className="block py-3 px-4 text-lg font-medium hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg"
            >
                Home
            </Link>

            {topLevelCategories.map((category) => (
              <div key={category._id} className="space-y-1">
                <div className="flex items-center justify-between group">
                  <Link 
                    href={`/${store.slug}/category/${category.slug}`}
                    onClick={onClose}
                    className="flex-1 py-3 px-4 text-lg font-medium hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg"
                  >
                    {category.name}
                  </Link>
                  {category.children && category.children.length > 0 && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleCategory(category._id);
                      }}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                      aria-label={`${expandedCategories.includes(category._id) ? 'Collapse' : 'Expand'} ${category.name}`}
                    >
                      {expandedCategories.includes(category._id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Nested Categories (Accordion) */}
                <div 
                  className={cn(
                    "pl-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                    expandedCategories.includes(category._id) 
                      ? "max-h-[500px] opacity-100" 
                      : "max-h-0 opacity-0"
                  )}
                >
                  {category.children?.map((child) => (
                    <Link
                      key={child._id}
                      href={`/${store.slug}/category/${child.slug}`}
                      onClick={onClose}
                      className="block py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-lg"
                    >
                      {child.name}
                    </Link>
                  ))}
                  <Link
                    href={`/${store.slug}/category/${category.slug}`}
                    onClick={onClose}
                    className="block py-2 px-4 font-medium underline underline-offset-4"
                  >
                    Shop All {category.name}
                  </Link>
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="space-y-3 border-t border-gray-100 p-4 dark:border-white/10">
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-2 dark:border-white/10">
            <span className="text-sm font-semibold">Appearance</span>
            <ThemeToggle />
          </div>
          <Link href={`/${store.slug}/wishlist`} onClick={onClose} className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 text-sm font-semibold dark:border-white/10">
            <span className="flex items-center gap-3"><Heart className="h-5 w-5" /> Wishlist</span>
            {wishlistCount > 0 && <span>{wishlistCount}</span>}
          </Link>
          {isAuthenticated ? (
            <Link href={`/${store.slug}/account`} onClick={onClose} className="flex items-center gap-3 rounded-md bg-black px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black">
              <UserRound className="h-5 w-5" /> Your account
            </Link>
          ) : (
            <Button className="w-full justify-start rounded-md" onClick={onSignIn}>
              <UserRound className="mr-3 h-5 w-5" /> Sign in
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
