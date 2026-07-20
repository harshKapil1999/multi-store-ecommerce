"use client";

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product } from '@repo/types';

export type WishlistItem = {
  storeId: string;
  product: Product;
  addedAt: string;
};

type WishlistStore = {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (storeId: string, productId: string) => void;
  toggleItem: (product: Product) => void;
  hasItem: (storeId: string, productId: string) => boolean;
  getItems: (storeId: string) => WishlistItem[];
};

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => set((state) => {
        if (state.items.some((item) => item.storeId === product.storeId && item.product._id === product._id)) {
          return state;
        }

        return {
          items: [...state.items, { storeId: product.storeId, product, addedAt: new Date().toISOString() }],
        };
      }),
      removeItem: (storeId, productId) => set((state) => ({
        items: state.items.filter((item) => !(item.storeId === storeId && item.product._id === productId)),
      })),
      toggleItem: (product) => {
        if (get().hasItem(product.storeId, product._id)) {
          get().removeItem(product.storeId, product._id);
        } else {
          get().addItem(product);
        }
      },
      hasItem: (storeId, productId) => get().items.some(
        (item) => item.storeId === storeId && item.product._id === productId
      ),
      getItems: (storeId) => get().items.filter((item) => item.storeId === storeId),
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
