"use client";

import { useCart } from '@/lib/cart-store';
import { useStore } from '@/lib/store-context';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Trash2, Heart, Info } from 'lucide-react';
import Link from 'next/link';
import { useWishlist } from '@/lib/wishlist-store';

export default function BagPage() {
  const { store } = useStore();
  const { items, removeItem, updateQuantity, getSubtotal } = useCart();
  const { addItem: addWishlistItem } = useWishlist();

  const storeItems = store ? items.filter((item) => item.storeId === store._id) : [];
  const subtotal = store ? getSubtotal(store._id) : 0;
  const delivery = subtotal === 0 || subtotal > 2500 ? 0 : 750;
  const total = subtotal + delivery;

  if (!store) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-20">
      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left Column: Bag Items */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Bag</h1>
              <p className="text-gray-500 text-sm">
                {storeItems.length === 0 ? "There are no items in your bag." : `${storeItems.length} items in your bag`}
              </p>
            </div>

            {storeItems.length === 0 ? (
              <div className="py-20 text-center border-t border-gray-100 dark:border-white/10">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <Link href={`/${store.slug}`}>
                  <Button size="lg">Explore Products</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {storeItems.map((item) => {
                  const price = item.variant?.price || item.product?.sellingPrice || 0;

                  return (
                    <div
                      key={`${item.productId}-${item.variantId || 'no-variant'}`}
                      className="flex gap-6 py-8 border-t border-gray-100 dark:border-white/10 first:border-t-0"
                    >
                      <div className="w-40 h-40 bg-gray-50 dark:bg-zinc-900 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={item.variant?.images?.[item.variant?.featuredImageIndex || 0] || item.product?.featuredImage}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-lg">{item.product?.name}</h3>
                            <span className="font-semibold">MRP : ₹{price.toLocaleString('en-IN')}</span>
                          </div>
                          {item.selectedAttributes && (
                            <p className="text-gray-500 text-sm mt-1">
                              {Object.entries(item.selectedAttributes).map(([key, value]) => (
                                <span key={key} className="capitalize mr-4">
                                  {key}: {value}
                                </span>
                              ))}
                            </p>
                          )}

                          <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Quantity</span>
                              <select
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.storeId, item.productId, parseInt(e.target.value), item.variantId)}
                                className="bg-transparent border-none p-0 pr-6 text-sm font-medium focus:ring-0 cursor-pointer"
                              >
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                          <button
                            onClick={() => {
                              if (item.product) addWishlistItem(item.product);
                              removeItem(item.storeId, item.productId, item.variantId);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            aria-label={`Move ${item.product?.name || 'item'} to wishlist`}
                          >
                            <Heart className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => removeItem(item.storeId, item.productId, item.variantId)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            aria-label={`Remove ${item.product?.name || 'item'} from bag`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Summary */}
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Summary</h2>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1 group relative">
                  <span>Subtotal</span>
                  <Info size={14} className="text-gray-400" />
                </div>
                <span>₹ {subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span>Estimated Delivery & Handling</span>
                <span>{delivery === 0 ? "Free" : `₹ ${delivery.toLocaleString('en-IN')}`}</span>
              </div>

              <div className="border-y border-gray-100 dark:border-white/10 py-6 my-6 flex justify-between items-center font-semibold text-lg">
                <span>Total</span>
                <span>₹ {total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
              {delivery === 0
                ? (storeItems.length > 0 ? 'You unlocked free delivery.' : 'Your bag is ready for products.')
                : `Add ₹${Math.max(0, 2501 - subtotal).toLocaleString('en-IN')} more for free delivery.`}
            </div>

            <div className="space-y-3">
              {storeItems.length > 0 ? (
                <Link href={`/${store.slug}/checkout`}>
                  <Button className="w-full py-6 rounded-full text-base font-bold bg-black text-white hover:opacity-80 transition-opacity">
                    Member Checkout
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full py-6 rounded-full text-base font-bold bg-black text-white transition-opacity">
                  Member Checkout
                </Button>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
