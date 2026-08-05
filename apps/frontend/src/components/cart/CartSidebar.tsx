"use client";

import { ArrowRight, Heart, ShieldCheck, Truck, X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import Link from 'next/link';
import { useStore } from '@/lib/store-context';
import { Button } from '../ui/Button';
import { useWishlist } from '@/lib/wishlist-store';
import { toast } from 'sonner';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { store } = useStore();
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount } = useCart();
  const { addItem: addWishlistItem } = useWishlist();

  if (!isOpen) return null;

  const storeItems = store ? items.filter((item) => item.storeId === store._id) : [];
  const subtotal = store ? getSubtotal(store._id) : 0;
  const shipping = subtotal > 2500 ? 0 : 750;
  const total = subtotal + shipping;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg transform flex-col bg-white shadow-2xl transition-transform dark:bg-neutral-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6" />
            <h2 className="text-xl font-semibold">
              Bag ({store ? getItemCount(store._id) : 0})
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
          {storeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-gray-500 dark:text-gray-400">Your bag is empty</p>
              <Button onClick={onClose} className="mt-4">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-7">
              <div className="rounded-2xl bg-gray-50 p-4 text-sm dark:bg-white/5">
                <div className="flex items-center gap-2 font-semibold">
                  <Truck className="h-4 w-4" />
                  Free delivery on orders over ₹2,500
                </div>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  Review your items, then continue to secure checkout.
                </p>
              </div>
              {storeItems.map((item) => {
                const price = item.variant?.price || item.product?.sellingPrice || 0;
                const name = item.product?.name || '';
                const image = item.variant?.images?.[item.variant?.featuredImageIndex || 0] || item.product?.featuredImage || '';

                return (
                  <div
                    key={`${item.productId}-${item.variantId || 'no-variant'}`}
                    className="flex gap-4 border-b border-gray-100 pb-7 last:border-b-0 dark:border-white/10"
                  >
                    <img
                      src={image}
                      alt={name}
                      className="h-28 w-28 rounded-md bg-gray-100 object-cover dark:bg-white/10"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium leading-snug">{name}</h3>
                        <p className="whitespace-nowrap text-sm font-semibold">₹ {price.toLocaleString('en-IN')}</p>
                      </div>
                      {item.selectedAttributes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {Object.entries(item.selectedAttributes).map(([key, value]) => (
                            <span key={key} className="capitalize">
                              {key}: {value}{' '}
                            </span>
                          ))}
                        </p>
                      )}
                      
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center border border-gray-200 dark:border-white/20 rounded">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.storeId,
                                item.productId,
                                item.quantity - 1,
                                item.variantId
                              )
                            }
                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-white/10"
                            aria-label={`Decrease quantity for ${name}`}
                          >
                            -
                          </button>
                          <span className="px-3 py-1">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.storeId,
                                item.productId,
                                item.quantity + 1,
                                item.variantId
                              )
                            }
                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-white/10"
                            aria-label={`Increase quantity for ${name}`}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            if (item.product) addWishlistItem(item.product);
                            removeItem(item.storeId, item.productId, item.variantId);
                            toast.success(`${name} moved to your wishlist`);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
                          aria-label={`Move ${name} to favourites`}
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.storeId, item.productId, item.variantId)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
                          aria-label={`Remove ${name} from bag`}
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
        {storeItems.length > 0 && (
          <div className="space-y-5 border-t border-gray-100 p-6 dark:border-white/10">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>₹ {subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Estimated Delivery & Handling
                </span>
                <span>{shipping === 0 ? 'Free' : `₹ ${shipping.toLocaleString('en-IN')}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between text-lg font-semibold pt-4 border-t border-gray-200 dark:border-white/20">
              <span>Total</span>
              <span>₹ {total.toLocaleString('en-IN')}</span>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <ShieldCheck className="h-4 w-4" />
                Secure checkout
              </div>
              <p className="mt-1">Payment, address, and invoice details stay connected to this order.</p>
            </div>

            <div className="space-y-4">
              <Link href={`/${store?.slug}/bag`} onClick={onClose}>
                <Button variant="outline" className="w-full rounded-full py-6 font-bold">
                  View Bag
                </Button>
              </Link>
              <Link href={`/${store?.slug}/checkout`} onClick={onClose}>
                <Button className="w-full rounded-full py-6 font-bold">
                  Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
