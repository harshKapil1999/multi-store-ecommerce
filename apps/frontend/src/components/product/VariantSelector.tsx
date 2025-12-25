"use client";

import { useState, useEffect } from 'react';
import { Product, ProductVariant, VariantOption } from '@repo/types';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface VariantSelectorProps {
  product: Product;
  variants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant | null) => void;
}

export function VariantSelector({ product, variants, onVariantSelect }: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Initialize selected options if there's only one option per category or just to pick the first variant
  useEffect(() => {
    if (variants.length > 0 && Object.keys(selectedOptions).length === 0) {
      // Find the first active variant and set its attributes as default
      const firstVariant = variants.find(v => v.isActive && v.stock > 0) || variants[0];
      if (firstVariant) {
        setSelectedOptions(firstVariant.attributes);
        onVariantSelect(firstVariant);
      }
    }
  }, [variants]);

  const handleOptionSelect = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);

    // Find if a variant matches this combination
    const matchingVariant = variants.find(variant => {
      return Object.entries(newOptions).every(([name, val]) => {
        return variant.attributes[name] === val;
      });
    });

    onVariantSelect(matchingVariant || null);
  };

  if (!product.variantOptions || product.variantOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {product.variantOptions.map((option) => (
        <div key={option.name}>
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium text-gray-900 dark:text-white capitalize">
              Select {option.name}
            </span>
            {option.name.toLowerCase() === 'size' && (
              <button className="text-sm text-gray-500 underline flex items-center gap-1">
                <Info size={14} />
                Size Guide
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              
              // Check if this option is available in any variant given other selections
              // For simplicity, we just mark as available if it exists in any variant for now
              // More advanced: check if (selectedOptions - currentOption + thisValue) exists
              
              return (
                <button
                  key={value}
                  onClick={() => handleOptionSelect(option.name, value)}
                  className={cn(
                    "py-3 px-4 rounded-md border text-sm font-medium transition-all",
                    isSelected
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-gray-200 hover:border-black dark:border-zinc-700 dark:hover:border-white"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
