'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import { useBillboard, useUpdateBillboard } from '@/hooks/useBillboards';
import { BillboardForm } from '../../billboard-form';
import { Card } from '@/components/index';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditBillboardPage({ params }: { params: Promise<{ billboardId: string }> }) {
  const { billboardId } = use(params);
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const { data: billboardData, isLoading } = useBillboard(selectedStoreId || '', billboardId);
  const updateMutation = useUpdateBillboard(selectedStoreId || '', billboardId);

  const billboard = billboardData?.data;

  const handleSubmit = async (data: any) => {
    await updateMutation.mutateAsync(data);
    router.push('/dashboard/billboards');
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

  if (!billboard) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Billboard not found</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Billboard</h1>
          <p className="text-muted-foreground">Update {billboard.title}</p>
        </div>
      </div>

      <BillboardForm
        billboard={billboard}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
