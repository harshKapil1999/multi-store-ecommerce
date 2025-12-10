'use client';

import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import { useCreateBillboard } from '@/hooks/useBillboards';
import { BillboardForm } from '../billboard-form';
import { Card } from '@/components/index';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewBillboardPage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const createMutation = useCreateBillboard(selectedStoreId || '');

  const handleSubmit = async (data: any) => {
    await createMutation.mutateAsync(data);
    router.push('/dashboard/billboards');
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
        <Link href="/dashboard/billboards">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Billboard</h1>
          <p className="text-muted-foreground">Add a new billboard to your store</p>
        </div>
      </div>

      <BillboardForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
