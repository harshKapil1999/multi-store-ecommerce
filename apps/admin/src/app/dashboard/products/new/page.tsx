'use client';

import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import { useCreateProduct } from '@/hooks/useProducts';
import { ProductForm } from '../product-form';
import { Card } from '@/components/index';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const createMutation = useCreateProduct(selectedStoreId || '');

  const handleSubmit = async (data: any) => {
    await createMutation.mutateAsync(data);
    router.push('/dashboard/products');
  };

  if (!selectedStoreId) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Please select a store first</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
          <p className="text-muted-foreground">Add a new product to your store</p>
        </div>
      </div>

      <ProductForm
        storeId={selectedStoreId}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
