"use client";

import { Product, Category, ProductVariant } from '@repo/types';
import { useState } from 'react';
import { Heart, ChevronDown, ChevronUp, Truck, RotateCcw } from 'lucide-react';
import { VariantSelector } from './VariantSelector';
import { AddToBagButton } from './AddToBagButton';

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
  // const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null); // Lifted up
  const [openSections, setOpenSections] = useState({
    delivery: false,
    reviews: false,
    info: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
              MRP : ₹{(selectedVariant?.price || product.sellingPrice).toLocaleString()}
            </span>
            {product.sellingPrice < product.mrp && !selectedVariant && (
               <span className="text-gray-400 line-through text-sm">₹{product.mrp.toLocaleString()}</span>
            )}
            {product.sellingPrice < product.mrp && !selectedVariant && (
               <span className="text-green-600 dark:text-green-400 font-medium text-sm bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">
                  {Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}% off
               </span>
            )}
         </div>
         <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
      </div>

      {/* Variant Selector */}
      {product.hasVariants && (
        <VariantSelector 
          product={product} 
          variants={variants} 
          onVariantSelect={onVariantSelect} 
        />
      )}

      {/* Basic Attribute Selector (Legacy fallback if no dynamic variants) */}
      {!product.hasVariants && product.attributes?.some(a => a.name.toLowerCase() === 'size') && (
        <div>
           <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-900 dark:text-white">Select Size</span>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {product.attributes
                .filter(a => a.name.toLowerCase() === 'size')
                .map((attr, idx) => (
                 <button
                    key={idx}
                    className="py-3 px-4 rounded-md border border-black bg-black text-white dark:border-white dark:bg-white dark:text-black text-sm font-medium"
                 >
                    {attr.value}
                 </button>
              ))}
           </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
         <AddToBagButton 
            product={product} 
            selectedVariant={selectedVariant} 
         />
         <button className="w-full border border-gray-300 dark:border-zinc-700 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:border-black dark:hover:border-white transition-colors">
            Favourite <Heart size={18} />
         </button>
      </div>

      {/* Description */}
      <div className="pt-6 border-t border-gray-200 dark:border-white/10">
         <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
            {product.description}
         </p>
         <ul className="mt-4 space-y-1 text-sm text-gray-500">
            {selectedVariant?.sku && (
              <li>• Style: {selectedVariant.sku}</li>
            )}
            {!selectedVariant?.sku && (
              <li>• Style: {product.slug.toUpperCase().slice(0, 10)}</li>
            )}
         </ul>
      </div>

      {/* Collapsible Sections */}
      <div className="border-t border-gray-200 dark:border-white/10">
        {/* Delivery & Returns */}
        <button
          onClick={() => toggleSection('delivery')}
          className="w-full flex items-center justify-between py-4 text-left"
        >
          <span className="font-medium flex items-center gap-2">
            <Truck size={18} />
            Delivery & Returns
          </span>
          {openSections.delivery ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {openSections.delivery && (
          <div className="pb-4 text-sm text-gray-500 space-y-2">
            <p>Free standard delivery on orders above ₹2,500</p>
            <p className="flex items-center gap-2">
              <RotateCcw size={14} />
              Free returns within 30 days
            </p>
          </div>
        )}

        {/* Reviews */}
        <button
          onClick={() => toggleSection('reviews')}
          className="w-full flex items-center justify-between py-4 text-left border-t border-gray-100 dark:border-white/5"
        >
          <span className="font-medium">Reviews (0)</span>
          {openSections.reviews ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {openSections.reviews && (
          <div className="pb-4 text-sm text-gray-500">
            <p>No reviews yet. Be the first to review this product.</p>
          </div>
        )}

        {/* Product Information */}
        <button
          onClick={() => toggleSection('info')}
          className="w-full flex items-center justify-between py-4 text-left border-t border-gray-100 dark:border-white/5"
        >
          <span className="font-medium">Product Information</span>
          {openSections.info ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {openSections.info && (
          <div className="pb-4 text-sm text-gray-500 space-y-1">
            {product.attributes?.filter(a => a.name.toLowerCase() !== 'size').map((attr, idx) => (
              <p key={idx}>• {attr.name}: {attr.value}</p>
            ))}
            {(!product.attributes || product.attributes.length === 0) && (
              <p>No additional information available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
