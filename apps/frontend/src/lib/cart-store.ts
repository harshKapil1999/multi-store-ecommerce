"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, ProductVariant, CartItem } from '@repo/types';

interface CartStore {
    items: CartItem[];

    // Actions
    addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
    removeItem: (storeId: string, productId: string, variantId?: string) => void;
    updateQuantity: (storeId: string, productId: string, quantity: number, variantId?: string) => void;
    clearCart: (storeId: string) => void;

    // Computed
    getItems: (storeId: string) => CartItem[];
    getItemCount: (storeId: string) => number;
    getSubtotal: (storeId: string) => number;
    getTotal: (storeId: string) => number;
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product, variant, quantity = 1) => {
                set((state) => {
                    const existingItemIndex = state.items.findIndex(
                        (item) =>
                            item.storeId === product.storeId &&
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
                                    storeId: product.storeId,
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

            removeItem: (storeId, productId, variantId) => {
                set((state) => ({
                    items: state.items.filter(
                        (item) =>
                            !(item.storeId === storeId && item.productId === productId && item.variantId === variantId)
                    ),
                }));
            },

            updateQuantity: (storeId, productId, quantity, variantId) => {
                if (quantity <= 0) {
                    get().removeItem(storeId, productId, variantId);
                    return;
                }

                set((state) => ({
                    items: state.items.map((item) =>
                        item.storeId === storeId && item.productId === productId && item.variantId === variantId
                            ? { ...item, quantity }
                            : item
                    ),
                }));
            },

            clearCart: (storeId) => {
                set((state) => ({ items: state.items.filter((item) => item.storeId !== storeId) }));
            },

            getItems: (storeId) => get().items.filter((item) => item.storeId === storeId),

            getItemCount: (storeId) => {
                return get().getItems(storeId).reduce((count, item) => count + item.quantity, 0);
            },

            getSubtotal: (storeId) => {
                return get().getItems(storeId).reduce((total, item) => {
                    const price = item.variant?.price || item.product?.sellingPrice || 0;
                    return total + price * item.quantity;
                }, 0);
            },

            getTotal: (storeId) => {
                const subtotal = get().getSubtotal(storeId);
                const delivery = subtotal > 0 && subtotal <= 2500 ? 750 : 0;
                return subtotal + delivery;
            },
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
            version: 2,
            migrate: (persisted: any) => ({
                ...persisted,
                items: Array.isArray(persisted?.items)
                    ? persisted.items
                        .map((item: CartItem & { storeId?: string }) => ({
                            ...item,
                            storeId: item.storeId || item.product?.storeId,
                        }))
                        .filter((item: CartItem) => Boolean(item.storeId))
                    : [],
            }),
        }
    )
);
