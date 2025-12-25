"use client";

import { useState } from 'react';
import { Product, ProductVariant } from '@repo/types';
import { ImageGallery } from './ImageGallery';
import { ProductInfo } from './ProductInfo';

interface ProductViewProps {
  product: Product;
  variants: ProductVariant[];
  categoryName: string;
}

export function ProductView({ product, variants, categoryName }: ProductViewProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Determine active images: Variant images -> Product featured + gallery
  const activeFeaturedImage = (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0)
    ? selectedVariant.images[0]
    : product.featuredImage;

  const activeMediaGallery = (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0)
    ? selectedVariant.images.map(url => ({ url, type: 'image' })) as any
    : product.mediaGallery;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
      <ImageGallery 
        featuredImage={activeFeaturedImage} 
        mediaGallery={activeMediaGallery} 
      />
      <ProductInfo 
        product={product} 
        variants={variants} 
        categoryName={categoryName}
        selectedVariant={selectedVariant}
        onVariantSelect={setSelectedVariant}
      />
    </div>
  );
}
