"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, ProductVariant, CartItem } from '@repo/types';

interface CartStore {
    items: CartItem[];

    // Actions
    addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
    removeItem: (productId: string, variantId?: string) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
    clearCart: () => void;

    // Computed
    getItemCount: () => number;
    getSubtotal: () => number;
    getTotal: () => number;
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product, variant, quantity = 1) => {
                set((state) => {
                    const existingItemIndex = state.items.findIndex(
                        (item) =>
                            item.productId === product._id &&
                            item.variantId === variant?._id
                    );

                    if (existingItemIndex > -1) {
                        // Update quantity of existing item
                        const newItems = [...state.items];
                        newItems[existingItemIndex].quantity += quantity;
                        return { items: newItems };
                    } else {
                        // Add new item
                        const attributes = variant?.attributes
                            ? Object.fromEntries(
                                Object.entries(variant.attributes).map(([key, value]) => [
                                    key,
                                    String(value),
                                ])
                            )
                            : undefined;

                        return {
                            items: [
                                ...state.items,
                                {
                                    productId: product._id,
                                    variantId: variant?._id,
                                    quantity,
                                    product,
                                    variant,
                                    selectedAttributes: attributes,
                                },
                            ],
                        };
                    }
                });
            },

            removeItem: (productId, variantId) => {
                set((state) => ({
                    items: state.items.filter(
                        (item) =>
                            !(item.productId === productId && item.variantId === variantId)
                    ),
                }));
            },

            updateQuantity: (productId, quantity, variantId) => {
                if (quantity <= 0) {
                    get().removeItem(productId, variantId);
                    return;
                }

                set((state) => ({
                    items: state.items.map((item) =>
                        item.productId === productId && item.variantId === variantId
                            ? { ...item, quantity }
                            : item
                    ),
                }));
            },

            clearCart: () => {
                set({ items: [] });
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            },

            getSubtotal: () => {
                return get().items.reduce((total, item) => {
                    const price = item.variant?.price || item.product?.sellingPrice || 0;
                    return total + price * item.quantity;
                }, 0);
            },

            getTotal: () => {
                // For now, total is same as subtotal
                // Later we can add shipping, tax, etc.
                return get().getSubtotal();
            },
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
