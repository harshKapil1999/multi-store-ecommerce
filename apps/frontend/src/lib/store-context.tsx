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
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children, slug }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setIsLoading(true);
        const storeData = await api.get<Store>(`/stores/slug/${slug}`);
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
  }, [slug]);

  return (
    <StoreContext.Provider value={{ store, categories, isLoading, error }}>
      {children}
    </StoreContext.Provider>
  );
};
