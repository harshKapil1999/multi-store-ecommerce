"use client";

import { useState, useEffect } from 'react';
import { Product, ProductVariant, VariantOption } from '@repo/types';
import { cn } from '@/lib/utils';
import { Info, Check } from 'lucide-react';

interface VariantSelectorProps {
  product: Product;
  variants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant | null) => void;
}

export function VariantSelector({ product, variants, onVariantSelect }: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Initialize selected options
  useEffect(() => {
    if (variants.length > 0 && Object.keys(selectedOptions).length === 0) {
      // Find the first active variant and set its attributes as default
      const firstVariant = variants.find(v => v.isActive && v.stock > 0) || variants[0];
      if (firstVariant) {
        setSelectedOptions(firstVariant.attributes);
        setSelectedVariant(firstVariant);
        onVariantSelect(firstVariant);
      }
    }
  }, [variants, onVariantSelect]);

  const handleOptionSelect = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };

    // If selecting Color, we might want to reset Size if the current size is not available for new color
    // But keeping it simple for now, let's just update and see if we match a variant

    // Auto-select valid size if current selection becomes invalid?
    // Nike logic: Keep size if available, otherwise deselect size?
    // Let's stick to simple update for now.

    const matchingVariant = variants.find(variant => {
      return Object.entries(newOptions).every(([name, val]) => {
        return variant.attributes[name] === val;
      });
    });

    // If no exact match (e.g. Red + L not available), find first available variant for this option choice?
    // This is better UX. If I switch to Blue, and Blue L is OOS, maybe switch to Blue M?
    // Or just let it be null.
    // Ideally we want to prevent null state if possible.

    if (!matchingVariant) {
       // If no direct match, try to find a variant that matches just the changed option
       // and keep other options if possible, or pick first available.
       // For now, let's update options.
    }

    setSelectedOptions(newOptions);
    setSelectedVariant(matchingVariant || null);
    onVariantSelect(matchingVariant || null);
  };

  const isOptionAvailable = (optionName: string, optionValue: string): boolean => {
    // Check if there is ANY variant with this option value that is active
    // But usually we want to check combination with OTHER selected options.
    // For Color, we usually want to see if it exists at all (since we switch context).
    // For Size, we check against selected Color.

    // If checking Color: ignore other selections?
    const isColor = optionName.toLowerCase() === 'color' || optionName.toLowerCase() === 'colour';

    if (isColor) {
       return variants.some(v => v.attributes[optionName] === optionValue && v.stock > 0);
    }

    // For others (Size), check against currently selected other attributes (e.g. Color)
    const testOptions = { ...selectedOptions, [optionName]: optionValue };
    // We only care about matching the options that are NOT the one being tested.
    // Actually, simple logic: Does a variant exist with [Selected Color] AND [New Size]?

    return variants.some(variant => {
      // Check if variant has ALL testOptions
      // But filtering out the current option? No, testOptions includes the candidate value.
      // We must match ALL selected other options + candidate.
      return Object.entries(testOptions).every(([name, val]) => variant.attributes[name] === val) && variant.stock > 0;
    });
  };

  const getColorImage = (optionName: string, value: string) => {
    // Find a variant with this color
    const variant = variants.find(v => v.attributes[optionName] === value && v.images && v.images.length > 0);
    return variant?.images?.[0] || product.featuredImage; // Fallback to product image
  };

  if (!product.variantOptions || product.variantOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {product.variantOptions.map((option) => {
        const isColor = option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'colour';

        return (
          <div key={option.name}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  Select {option.name}
                </span>
                {selectedOptions[option.name] && (
                  <span className="ml-2 text-sm text-gray-500">
                    {selectedOptions[option.name]}
                  </span>
                )}
              </div>
              {!isColor && option.name.toLowerCase().includes('size') && (
                <button className="text-sm text-gray-500 underline flex items-center gap-1 hover:text-gray-700">
                  <Info size={14} />
                  Size Guide
                </button>
              )}
            </div>

            {isColor ? (
              // Color Selector - Image Thumbnails
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value;
                  const available = variants.some(v => v.attributes[option.name] === value && v.stock > 0); // Check general availability
                  const image = getColorImage(option.name, value);

                  return (
                    <button
                      key={value}
                      onClick={() => handleOptionSelect(option.name, value)}
                      className={cn(
                        "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                        isSelected
                          ? "border-black dark:border-white opacity-100 ring-1 ring-black dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-black"
                          : "border-transparent hover:border-gray-300 dark:hover:border-zinc-700 opacity-90 hover:opacity-100",
                        !available && "opacity-50 grayscale cursor-not-allowed"
                      )}
                      disabled={!available}
                      title={`${value}${!available ? ' (Out of stock)' : ''}`}
                    >
                      <img
                        src={image}
                        alt={value}
                        className="w-full h-full object-cover"
                      />
                      {/* Tooltip or Label on Hover? Keep it clean like Nike */}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Standard Selector (Size, Material, etc.)
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value;
                  const available = isOptionAvailable(option.name, value);

                  return (
                    <button
                      key={value}
                      onClick={() => available && handleOptionSelect(option.name, value)}
                      disabled={!available}
                      className={cn(
                        "py-3 px-4 rounded-md border text-sm font-medium transition-all relative",
                        isSelected
                          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                          : available
                          ? "border-gray-200 hover:border-black dark:border-zinc-700 dark:hover:border-white cursor-pointer"
                          : "border-gray-200 bg-gray-50 text-gray-400 dark:border-zinc-800 dark:bg-zinc-950 cursor-not-allowed decoration-slice"
                      )}
                      title={!available ? 'Out of stock' : ''}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Show selected variant details */}
      {selectedVariant && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Selected Variant</p>
              <p className="font-semibold text-gray-900 dark:text-white">{selectedVariant.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">SKU: {selectedVariant.sku}</p>
            </div>
            <div className="text-right">
              {/* Show Compare At Price if exists */}
              {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                 <p className="text-sm text-gray-500 line-through">₹{selectedVariant.compareAtPrice.toLocaleString()}</p>
              )}
              <p className="text-lg font-bold text-gray-900 dark:text-white">₹{selectedVariant.price.toLocaleString()}</p>
              <p className={cn(
                "text-sm font-medium mt-1",
                selectedVariant.stock > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {selectedVariant.stock > 0 ? `${selectedVariant.stock} in stock` : 'Out of stock'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
