'use client';

import { useStores } from '@/hooks/useStores';
import { useSelectedStore } from '@/contexts/store-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Store } from '@repo/types';

export function StoreSwitcher() {
  const { selectedStoreId, setSelectedStoreId } = useSelectedStore();
  const { data, isLoading, error } = useStores(1, 100);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading stores...</span>
      </div>
    );
  }

  if (error) {
    console.error('Error loading stores:', error);
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Error loading stores</span>
      </div>
    );
  }

  // Safely extract stores array - handle multiple response formats
  // The API returns: { success: true, data: { data: [...] } }
  const rawData = data?.data;
  const storesList = Array.isArray(rawData) ? rawData : [];

  return (
    <Select value={selectedStoreId || ''} onValueChange={setSelectedStoreId}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a store" />
      </SelectTrigger>
      <SelectContent>
        {storesList.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No stores available. Create one first.
          </div>
        ) : (
          storesList.map((store: any) => (
            <SelectItem key={store._id} value={store._id}>
              <div className="flex items-center gap-2">
                {store.logo && (
                  <img
                    src={store.logo}
                    alt={store.name}
                    className="h-4 w-4 rounded"
                  />
                )}
                {store.name}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
