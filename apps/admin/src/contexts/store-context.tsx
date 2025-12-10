'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface StoreContextType {
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string | null) => void;
  clearSelectedStore: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORE_STORAGE_KEY = 'selected_store_id';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [selectedStoreId, setSelectedStoreIdState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedStoreId = localStorage.getItem(STORE_STORAGE_KEY);
    if (savedStoreId) {
      setSelectedStoreIdState(savedStoreId);
    }
    setIsHydrated(true);
  }, []);

  // Update both state and localStorage
  const setSelectedStoreId = useCallback((storeId: string | null) => {
    setSelectedStoreIdState(storeId);
    if (storeId) {
      localStorage.setItem(STORE_STORAGE_KEY, storeId);
    } else {
      localStorage.removeItem(STORE_STORAGE_KEY);
    }
  }, []);

  const clearSelectedStore = useCallback(() => {
    setSelectedStoreId(null);
  }, [setSelectedStoreId]);

  // Don't render until hydrated to avoid hydration mismatches
  if (!isHydrated) {
    return <>{children}</>;
  }

  return (
    <StoreContext.Provider
      value={{
        selectedStoreId,
        setSelectedStoreId,
        clearSelectedStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useSelectedStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useSelectedStore must be used within a StoreProvider');
  }
  return context;
}
