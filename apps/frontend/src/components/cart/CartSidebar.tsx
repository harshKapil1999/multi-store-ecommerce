"use client";

import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import Link from 'next/link';
import { useStore } from '@/lib/store-context';
import { Button } from '../ui/Button';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { store } = useStore();
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount } = useCart();

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const shipping = subtotal > 0 ? 1250 : 0; // ₹1,250 flat shipping
  const total = subtotal + shipping;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-black z-50 shadow-2xl transform transition-transform flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6" />
            <h2 className="text-xl font-semibold">
              Bag ({getItemCount()})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-gray-500 dark:text-gray-400">Your bag is empty</p>
              <Button onClick={onClose} className="mt-4">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => {
                const price = item.variant?.price || item.product?.sellingPrice || 0;
                const name = item.product?.name || '';
                const image = item.product?.featuredImage || '';

                return (
                  <div
                    key={`${item.productId}-${item.variantId || 'no-variant'}`}
                    className="flex gap-4"
                  >
                    <img
                      src={image}
                      alt={name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{name}</h3>
                      {item.selectedAttributes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {Object.entries(item.selectedAttributes).map(([key, value]) => (
                            <span key={key} className="capitalize">
                              {key}: {value}{' '}
                            </span>
                          ))}
                        </p>
                      )}
                      <p className="text-sm mt-1">₹ {price.toLocaleString('en-IN')}</p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center border border-gray-200 dark:border-white/20 rounded">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity - 1,
                                item.variantId
                              )
                            }
                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-white/10"
                          >
                            -
                          </button>
                          <span className="px-3 py-1">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity + 1,
                                item.variantId
                              )
                            }
                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-white/10"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 dark:border-white/10 p-6 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>₹ {subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Estimated Delivery & Handling
                </span>
                <span>₹ {shipping.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="flex justify-between text-lg font-semibold pt-4 border-t border-gray-200 dark:border-white/20">
              <span>Total</span>
              <span>₹ {total.toLocaleString('en-IN')}</span>
            </div>

            <div className="space-y-2">
              <Link href={`/${store?.slug}/bag`} onClick={onClose}>
                <Button variant="outline" className="w-full">
                  View Bag
                </Button>
              </Link>
              <Link href={`/${store?.slug}/checkout`} onClick={onClose}>
                <Button className="w-full">
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
