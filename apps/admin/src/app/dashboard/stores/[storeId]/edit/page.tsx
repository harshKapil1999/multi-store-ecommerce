'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useUpdateStore } from '@/hooks/useStores';
import { StoreForm } from '../../store-form';
import { BillboardManager } from '@/components/BillboardManager';
import { Card, Button } from '@/components/index';
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

export default function EditStorePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const router = useRouter();
  const { data: storeData, isLoading } = useStore(storeId);
  const updateMutation = useUpdateStore(storeId);

  const store = storeData?.data;

  const handleSubmit = async (data: any) => {
    await updateMutation.mutateAsync(data);
    router.push('/dashboard/stores');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!store) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Store not found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stores">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Store</h1>
            <p className="text-muted-foreground">Update {store.name}</p>
          </div>
        </div>
        
        <a
          href={`${FRONTEND_URL}/${store.slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Store
          </Button>
        </a>
      </div>

      <StoreForm
        store={store}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />

      {/* Billboard / Carousel Manager */}
      <BillboardManager storeId={storeId} />
    </div>
  );
}
