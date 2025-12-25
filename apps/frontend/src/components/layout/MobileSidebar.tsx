import { X, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store-context';
import { CategoryWithChildren } from '@repo/types';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryWithChildren[];
}

export function MobileSidebar({ isOpen, onClose, categories }: MobileSidebarProps) {
  const { store } = useStore();
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

        <div className="p-4 border-t border-gray-100 dark:border-white/10 space-y-4">
            <div className="flex flex-col gap-3">
                <Button variant="outline" className="w-full justify-start rounded-full">
                    Find a Store
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-full">
                    Help
                </Button>
                <Button className="w-full rounded-full">
                    Join Us / Sign In
                </Button>
            </div>
        </div>
      </div>
    </>
  );
}
