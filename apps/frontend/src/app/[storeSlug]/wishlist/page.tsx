"use client";

import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store-context';
import { useWishlist } from '@/lib/wishlist-store';
import { useCart } from '@/lib/cart-store';

export default function WishlistPage() {
  const { store } = useStore();
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  if (!store) return null;

  const storeItems = items.filter((item) => item.storeId === store._id);

  return (
    <div className="min-h-screen bg-white pt-20 text-gray-950 dark:bg-black dark:text-white">
      <main className="container mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase text-gray-500">Saved for later</p>
            <h1 className="text-3xl font-semibold">Wishlist ({storeItems.length})</h1>
          </div>
          <Link href={`/${store.slug}`} className="text-sm font-semibold underline underline-offset-4">
            Continue shopping
          </Link>
        </div>

        {storeItems.length === 0 ? (
          <div className="border-y border-gray-200 py-20 text-center dark:border-white/10">
            <Heart className="mx-auto mb-5 h-12 w-12 text-gray-300" />
            <h2 className="text-xl font-semibold">Nothing saved yet</h2>
            <p className="mt-2 text-gray-500">Use the heart button on a product to keep it here.</p>
            <Link href={`/${store.slug}`}>
              <Button className="mt-7 rounded-full px-7">Explore products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {storeItems.map(({ product }) => (
              <article key={product._id}>
                <Link href={`/${store.slug}/product/${product.slug}`} className="block aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-900">
                  <img src={product.featuredImage} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                </Link>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/${store.slug}/product/${product.slug}`} className="font-semibold hover:underline">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">₹{product.sellingPrice.toLocaleString('en-IN')}</p>
                  </div>
                  <button
                    onClick={() => removeItem(store._id, product._id)}
                    className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/10"
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                {!product.hasVariants && (
                  <Button
                    onClick={() => addItem(product)}
                    disabled={product.stock <= 0}
                    variant="outline"
                    className="mt-4 w-full rounded-full"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {product.stock > 0 ? 'Add to bag' : 'Out of stock'}
                  </Button>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
