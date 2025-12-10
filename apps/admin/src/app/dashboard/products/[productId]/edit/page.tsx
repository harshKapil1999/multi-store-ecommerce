'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import { useProduct, useUpdateProduct } from '@/hooks/useProducts';
import { ProductForm } from '../../product-form';
import { Card } from '@/components/index';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const { data: productData, isLoading } = useProduct(selectedStoreId || '', productId);
  const updateMutation = useUpdateProduct(selectedStoreId || '', productId);

  const product = productData?.data;

  const handleSubmit = async (data: any) => {
    await updateMutation.mutateAsync(data);
    router.push('/dashboard/products');
  };

  if (!selectedStoreId) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Please select a store first</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Product not found</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">Update {product.name}</p>
        </div>
      </div>

      <ProductForm
        storeId={selectedStoreId}
        product={product}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
