"use client";

import { useRef } from 'react';
import Link from 'next/link';
import { Product } from '@repo/types';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useWishlist } from '@/lib/wishlist-store';

interface ProductSpotlightProps {
  title: string;
  subtitle?: string;
  products: Product[];
  storeSlug: string;
}

export function ProductSpotlight({ title, subtitle, products, storeSlug }: ProductSpotlightProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toggleItem, hasItem } = useWishlist();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -400 : 400;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 bg-white dark:bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <article
              key={product._id}
              className="min-w-[300px] md:min-w-[400px] snap-start group"
            >
              <div className="relative mb-4 aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-900">
                <Link href={`/${storeSlug}/product/${product.slug}`} aria-label={`View ${product.name}`}>
                  <img
                    src={product.featuredImage}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => toggleItem(product)}
                  aria-label={hasItem(product.storeId, product._id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                  className="absolute right-3 top-3 rounded-full bg-white p-3 text-black shadow-sm transition-transform hover:scale-105"
                >
                  <Heart size={19} fill={hasItem(product.storeId, product._id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/${storeSlug}/product/${product.slug}`}>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  {product.sellingPrice < product.mrp && (
                    <p className="text-sm text-red-500">Sale</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    ₹{product.sellingPrice.toLocaleString()}
                  </p>
                  {product.sellingPrice < product.mrp && (
                    <p className="text-sm text-gray-400 line-through">
                      ₹{product.mrp.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
