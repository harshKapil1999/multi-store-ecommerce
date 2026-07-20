"use client";

import Link from 'next/link';
import { CategoryWithChildren } from '@repo/types';

interface FeaturedCategoriesProps {
  categories: CategoryWithChildren[];
  storeSlug: string;
  title?: string;
  subtitle?: string;
}

export function FeaturedCategories({ categories, storeSlug, title = 'Featured', subtitle }: FeaturedCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-20 bg-white dark:bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">{title}</h2>
          {subtitle && <p className="mt-2 max-w-2xl text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => (
            <Link 
              key={category._id} 
              href={`/${storeSlug}/category/${category.slug}`}
              className="group relative h-[400px] lg:h-[500px] w-full overflow-hidden block"
            >
              {/* Image */}
              <div className="absolute inset-0">
                {category.imageUrl && (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </div>
              
              {/* Overlay Content - Bottom Left */}
              <div className="absolute bottom-0 left-0 p-8 z-10 w-full bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-white text-2xl font-bold mb-4 drop-shadow-md">
                  {category.name}
                </h3>
                <span className="inline-block bg-white text-black px-6 py-2 rounded-full font-medium text-sm transition-all transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 duration-300">
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
