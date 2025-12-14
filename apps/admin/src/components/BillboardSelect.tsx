'use client';

import { useBillboards } from '@/hooks/useBillboards';
import { Billboard } from '@repo/types';
import { Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { Skeleton } from '@/components/ui/skeleton';

interface BillboardSelectProps {
  storeId: string;
  value?: string[]; // Array of Billboard IDs
  onChange: (value: string[]) => void;
  label?: string;
}

export function BillboardSelect({
  storeId,
  value = [],
  onChange,
  label = "Select Billboards"
}: BillboardSelectProps) {
  const { data: billboards, isLoading } = useBillboards(storeId);
  
  // The API returns a pagination wrapper { data: Billboard[], total, ... }
  // Extract the actual array from the wrapper
  const billboardList = Array.isArray(billboards?.data) ? billboards.data : Array.isArray(billboards) ? billboards : [];

  const toggleBillboard = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (billboardList.length === 0) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
          No billboards found. Create some in the Billboards section first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground">{value.length} selected</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {billboardList.map((billboard: Billboard) => {
          const isSelected = value.includes(billboard._id);
          return (
            <div
              key={billboard._id}
              onClick={() => toggleBillboard(billboard._id)}
              className={cn(
                "group relative aspect-video rounded-lg border-2 cursor-pointer overflow-hidden transition-all hover:opacity-90",
                isSelected 
                  ? "border-blue-500 ring-2 ring-blue-500/20" 
                  : "border-transparent ring-1 ring-border"
              )}
            >
              <img
                src={billboard.imageUrl}
                alt={billboard.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex flex-col justify-end">
                <p className="text-white text-xs font-medium truncate">{billboard.title}</p>
              </div>
              
              {isSelected && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
