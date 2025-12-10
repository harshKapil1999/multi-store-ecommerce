'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import { useCategory, useUpdateCategory } from '@/hooks/useCategories';
import { CategoryForm } from '../../category-form';
import { Card } from '@/components/index';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = use(params);
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const { data: categoryData, isLoading } = useCategory(selectedStoreId || '', categoryId);
  const updateMutation = useUpdateCategory(selectedStoreId || '', categoryId);

  const category = categoryData?.data;

  const handleSubmit = async (data: any) => {
    await updateMutation.mutateAsync(data);
    router.push('/dashboard/categories');
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

  if (!category) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Category not found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/categories">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
          <p className="text-muted-foreground">Update {category.name}</p>
        </div>
      </div>

      <CategoryForm
        storeId={selectedStoreId}
        category={category}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
