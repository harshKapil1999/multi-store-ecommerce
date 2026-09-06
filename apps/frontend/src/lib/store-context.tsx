"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Store, CategoryWithChildren } from '@repo/types';
import { api } from './api';

interface StoreContextType {
  store: Store | null;
  categories: CategoryWithChildren[];
  isLoading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  categories: [],
  isLoading: true,
  error: null,
});

export const useStore = () => useContext(StoreContext);

interface StoreProviderProps {
  children: React.ReactNode;
  slug: string;
  initialStore?: Store;
  initialCategories?: CategoryWithChildren[];
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children, slug, initialStore, initialCategories }) => {
  const [store, setStore] = useState<Store | null>(initialStore || null);
  const [categories, setCategories] = useState<CategoryWithChildren[]>(initialCategories || []);
  const [isLoading, setIsLoading] = useState(!initialStore);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStore?.slug === slug) { setStore(initialStore); setCategories(initialCategories || []); setError(null); setIsLoading(false); return; }
    let current = true;
    const fetchStoreData = async () => {
      try {
        setIsLoading(true);
        const storeData = await api.get<Store>(`/stores/slug/${slug}`);
        if (!current) return;
        setStore(storeData);

        if (storeData._id) {
           const categoryTree = await api.get<CategoryWithChildren[]>(`/stores/${storeData._id}/categories/tree`);
           setCategories(categoryTree);
        }

      } catch (err: any) {
        console.error("Failed to load store data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchStoreData();
    }
    return () => { current = false; };
  }, [slug, initialStore, initialCategories]);

  return (
    <StoreContext.Provider value={{ store, categories, isLoading, error }}>
      {children}
    </StoreContext.Provider>
  );
};
