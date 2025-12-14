"use client";

import { Product } from '@repo/types';
import { ProductSpotlight } from '@/components/home/ProductSpotlight';

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
     <div className="border-t border-gray-100 dark:border-white/10 pt-12 mt-12">
        <ProductSpotlight title="You Might Also Like" products={products} />
     </div>
  );
}
