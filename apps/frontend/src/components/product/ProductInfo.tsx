"use client";

import { Product, ProductVariant } from '@repo/types';
import { Heart } from 'lucide-react';
import { VariantSelector } from './VariantSelector';
import { AddToBagButton } from './AddToBagButton';
import { useWishlist } from '@/lib/wishlist-store';

interface ProductInfoProps {
  product: Product;
  variants?: ProductVariant[];
  categoryName?: string;
  selectedVariant: ProductVariant | null;
  onVariantSelect: (variant: ProductVariant | null) => void;
}

export function ProductInfo({
  product,
  variants = [],
  categoryName,
  selectedVariant,
  onVariantSelect
}: ProductInfoProps) {
  const { toggleItem, hasItem } = useWishlist();
  const isFavourite = hasItem(product.storeId, product._id);
  const displayPrice = selectedVariant?.price ?? product.sellingPrice;
  const originalPrice = selectedVariant ? (selectedVariant.compareAtPrice || 0) : product.mrp;
  const discountPercent = originalPrice > displayPrice ? Math.round((originalPrice - displayPrice) / originalPrice * 100) : 0;
  const productInformation = product.attributes?.filter((attribute) => attribute.name && attribute.value) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
         <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-900 dark:text-white">
           {product.name}
         </h1>
         {categoryName && (
           <p className="text-gray-500 text-sm mb-3">{categoryName}</p>
         )}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-semibold">
              ₹{(selectedVariant?.price ?? product.sellingPrice).toLocaleString()}
            </span>
            {/* If variant selected, show its compareAtPrice, otherwise show product mrp if it's a sale */}
            {selectedVariant ? (
               selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                 <span className="text-gray-400 line-through text-sm">₹{selectedVariant.compareAtPrice.toLocaleString()}</span>
               )
            ) : (
               product.sellingPrice < product.mrp && (
                 <span className="text-gray-400 line-through text-sm">₹{product.mrp.toLocaleString()}</span>
               )
            )}

            {discountPercent > 0 && <span className="text-green-600 dark:text-green-400 text-sm">{discountPercent}% off</span>}
          </div>
          {originalPrice > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              MRP: ₹{originalPrice.toLocaleString()} (inclusive of taxes)
            </p>
          )}
      </div>

      {/* Variant Selector */}
      {product.hasVariants && (
        <VariantSelector
          initialVariant={selectedVariant}
          product={product}
          variants={variants}
          onVariantSelect={onVariantSelect}
        />
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
         <AddToBagButton
            product={product}
            selectedVariant={selectedVariant}
         />
         <button
            type="button"
            onClick={() => toggleItem(product)}
            aria-pressed={isFavourite}
            className="w-full border border-gray-300 dark:border-zinc-700 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:border-black dark:hover:border-white transition-colors"
         >
            {isFavourite ? 'Saved to Wishlist' : 'Add to Wishlist'}
            <Heart size={18} fill={isFavourite ? 'currentColor' : 'none'} />
         </button>
      </div>

      {/* Description */}
      {(product.description || selectedVariant?.sku || product.sku) && (
      <div className="pt-6 border-t border-gray-200 dark:border-white/10">
         {product.description && (
         <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
            {product.description}
         </p>
         )}
         {(selectedVariant?.sku || product.sku) && (
         <ul className="mt-4 space-y-1 text-sm text-gray-500">
            {selectedVariant?.sku && (
              <li>SKU: {selectedVariant.sku}</li>
            )}
            {!selectedVariant?.sku && product.sku && (
              <li>SKU: {product.sku}</li>
            )}
         </ul>
         )}
      </div>
      )}

      {productInformation.length > 0 && (
        <div className="border-t border-gray-200 pt-5 text-sm dark:border-white/10">
          <h2 className="mb-3 font-semibold">Product Information</h2>
          <dl className="space-y-2 text-gray-500 dark:text-gray-400">
            {productInformation.map((attribute, index) => (
              <div key={`${attribute.name}-${index}`} className="flex justify-between gap-6">
                <dt>{attribute.name}</dt>
                <dd className="text-right text-gray-900 dark:text-white">{attribute.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
