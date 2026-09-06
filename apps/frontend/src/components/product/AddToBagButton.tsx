"use client";

import { toast } from 'sonner';
import { useState } from 'react';
import { Product, ProductVariant } from '@repo/types';
import { useCart } from '@/lib/cart-store';
import { Button } from '../ui/Button';
import { ShoppingBag } from 'lucide-react';

interface AddToBagButtonProps {
  product: Product;
  selectedVariant?: ProductVariant | null;
  disabled?: boolean;
  className?: string;
}

export function AddToBagButton({ 
  product, 
  selectedVariant, 
  disabled, 
  className 
}: AddToBagButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    // If product has variants but none selected, don't add
    if (product.hasVariants && !selectedVariant) {
      // This should be handled by the parent (showing an error)
      return;
    }

    const existing = useCart.getState().items.find(item => item.productId === product._id && item.variantId === selectedVariant?._id);
    if (existing && existing.quantity >= Math.min(20, selectedVariant?.stock ?? product.stock)) { toast.error('You have reached the available quantity.'); return; }
    addItem(product, selectedVariant || undefined);
    toast.success(`${product.name} added to your bag`);
  };

  const isOutOfStock = product.hasVariants 
    ? (selectedVariant ? selectedVariant.stock <= 0 : false)
    : product.stock <= 0;

  return (
    <Button
      onClick={handleAdd}
      disabled={disabled || isAdding || (product.hasVariants && !selectedVariant) || isOutOfStock}
      className={`w-full py-6 rounded-full font-bold flex items-center justify-center gap-2 ${className}`}
    >
      {isAdding ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Adding...
        </span>
      ) : isOutOfStock ? (
        "Out of Stock"
      ) : (
        <>
          Add to Bag
          <ShoppingBag size={20} />
        </>
      )}
    </Button>
  );
}
