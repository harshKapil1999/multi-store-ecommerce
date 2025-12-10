'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import {
  useBillboards,
  useDeleteBillboard,
  useReorderBillboards,
} from '@/hooks/useBillboards';
import {
  DataTable,
  Button,
  Card,
} from '@/components/index';
import type { ColumnDef } from '@tanstack/react-table';
import type { Billboard } from '@repo/types';
import { Plus, Edit, Trash2, GripVertical, ExternalLink } from 'lucide-react';

export function BillboardsPage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null);

  const { data, isLoading } = useBillboards(selectedStoreId || '');
  const deleteMutation = useDeleteBillboard(selectedStoreId || '', selectedBillboard?._id || '');

  const billboards = (data?.data || []) as Billboard[];

  const columns: ColumnDef<Billboard>[] = [
    {
      id: 'dragHandle',
      header: '',
      size: 40,
      cell: ({ row }) => <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.subtitle && (
            <p className="text-sm text-muted-foreground">{row.original.subtitle}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'imageUrl',
      header: 'Image',
      cell: ({ row }) => (
        <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
          {row.original.imageUrl && (
            <img
              src={row.original.imageUrl}
              alt={row.original.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'order',
      header: 'Order',
      cell: ({ row }) => <span>{row.original.order}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            row.original.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Open the store homepage where billboards are displayed
              const storeUrl = `${window.location.origin}/stores/${selectedStoreId}`;
              window.open(storeUrl, '_blank', 'noopener,noreferrer');
            }}
            title="View on storefront"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedBillboard(row.original);
              router.push(`/dashboard/billboards/${row.original._id}/edit`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedBillboard(row.original);
              if (
                window.confirm(
                  `Are you sure you want to delete "${row.original.title}"?`
                )
              ) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!selectedStoreId) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Please select a store first</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billboards</h1>
          <p className="text-muted-foreground">Manage promotional banners</p>
        </div>
        <Button onClick={() => router.push('/dashboard/billboards/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Billboard
        </Button>
      </div>

      <Card className="p-6">
        <DataTable<Billboard>
          columns={columns}
          data={billboards}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}

export default BillboardsPage;
