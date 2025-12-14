"use client";

import Link from 'next/link';
import { CategoryWithChildren } from '@repo/types';

interface FeaturedCategoriesProps {
  categories: CategoryWithChildren[];
  storeSlug: string;
}

export function FeaturedCategories({ categories, storeSlug }: FeaturedCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  // Recursively collect all featured categories from the tree
  const getAllFeatured = (cats: CategoryWithChildren[]): CategoryWithChildren[] => {
    let result: CategoryWithChildren[] = [];
    cats.forEach(cat => {
      if (cat.isFeatured) {
        result.push(cat);
      }
      if (cat.children && cat.children.length > 0) {
        result = result.concat(getAllFeatured(cat.children));
      }
    });
    return result;
  };
  
  const toShow = getAllFeatured(categories);

  return (
    <section className="py-20 bg-white dark:bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="text-3xl font-bold mb-10 text-gray-900 dark:text-white font-sans tracking-tight">
          Featured
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {toShow.map((category) => (
            <Link 
              key={category._id} 
              href={`/${storeSlug}/category/${category.slug}`}
              className="group relative h-[400px] lg:h-[500px] w-full overflow-hidden block"
            >
              {/* Image */}
              <div className="absolute inset-0">
                <img 
                  src={category.imageUrl || '/placeholder-category.jpg'} 
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
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
