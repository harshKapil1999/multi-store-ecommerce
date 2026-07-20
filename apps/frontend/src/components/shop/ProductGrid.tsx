"use client";

import Link from 'next/link';
import { Product } from '@repo/types';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/lib/wishlist-store';

interface ProductGridProps {
  products: Product[];
  storeSlug: string;
}

export function ProductGrid({ products, storeSlug }: ProductGridProps) {
  const { hasItem, toggleItem } = useWishlist();
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-medium text-gray-900 dark:text-white">
          No products found.
        </h3>
        <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6">
      {products.map((product) => (
        <article key={product._id} className="group relative">
          <Link href={`/${storeSlug}/product/${product.slug}`} className="block">
          <div className="aspect-square bg-gray-100 dark:bg-zinc-900 mb-4 overflow-hidden rounded-md relative">
            <img 
              src={product.featuredImage} 
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          </Link>
          <button
            type="button"
            onClick={() => toggleItem(product)}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-sm transition hover:scale-105 dark:bg-black dark:text-white"
            aria-label={hasItem(product.storeId, product._id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <Heart className={`h-5 w-5 ${hasItem(product.storeId, product._id) ? 'fill-current' : ''}`} />
          </button>
          <Link href={`/${storeSlug}/product/${product.slug}`} className="block">
          <div className="space-y-1">
            <div className="flex justify-between items-start">
               <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors line-clamp-2">
                 {product.name}
               </h3>
               <p className="font-medium text-gray-900 dark:text-white whitespace-nowrap ml-4">
                 ₹{product.sellingPrice.toLocaleString()}
               </p>
            </div>
            {product.sellingPrice < product.mrp && (
               <p className="text-sm text-gray-400 line-through">
                  ₹{product.mrp.toLocaleString()}
               </p>
            )}
          </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
