'use client';

import { useRouter } from 'next/navigation';
import { useCreateStore } from '@/hooks/useStores';
import { StoreForm } from '../store-form';
import { Card } from '@/components/index';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewStorePage() {
  const router = useRouter();
  const createMutation = useCreateStore();

  const handleSubmit = async (data: any) => {
    await createMutation.mutateAsync(data);
    router.push('/dashboard/stores');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stores">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Store</h1>
          <p className="text-muted-foreground">Add a new store to your dashboard</p>
        </div>
      </div>

      <StoreForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
  );
}
