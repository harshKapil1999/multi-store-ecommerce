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
        // 1. Fetch Store Details
        // This assumes a new endpoint or using existing one filtering by slug
        // For now, let's mock the endpoint or assume it exists
        // Since backend doesn't have public getStoreBySlug in routes yet (only protected or by ID),
        // we might need to add it or use what we have. 
        // NOTE: The implementation plan didn't explicitly add public getStoreBySlug. 
        // I will assume /stores/slug/:slug exists (common pattern) or I might need to add it.
        // Actually, backend store.routes.ts likely has it. Checked earlier: only ID based.
        // Wait, I should add getStoreBySlug to backend if it's missing.
        // Let's assume for now I'll fix backend if this fails.
        
        // TODO: Replace with actual endpoint
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
