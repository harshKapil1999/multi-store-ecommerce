'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useStores,
  useDeleteStore,
  useToggleStore,
} from '@/hooks/useStores';
import {
  DataTable,
  Button,
  Card,
} from '@/components/index';
import type { ColumnDef } from '@tanstack/react-table';
import type { Store } from '@repo/types';
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

export default function Page() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const { data, isLoading } = useStores(page, 20, search);
  const deleteMutation = useDeleteStore(selectedStore?._id || '');
  const toggleMutation = useToggleStore(selectedStore?._id || '');

  const stores = (data?.data || []) as Store[];

  const columns: ColumnDef<Store>[] = [
    {
      accessorKey: 'name',
      header: 'Store Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.logo && (
            <img
              src={row.original.logo}
              alt={row.original.name}
              className="h-8 w-8 rounded object-cover"
            />
          )}
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">/{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'domain',
      header: 'Domain',
      cell: ({ row }) => <span>{row.original.domain || '—'}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              row.original.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
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
              const storeUrl = row.original.domain || `https://${row.original.slug}.mystore.com`;
              window.open(storeUrl, '_blank', 'noopener,noreferrer');
            }}
            title="View store"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedStore(row.original);
              toggleMutation.mutate(!row.original.isActive);
            }}
            disabled={toggleMutation.isPending}
          >
            {row.original.isActive ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/stores/${row.original._id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedStore(row.original);
              if (
                window.confirm(
                  `Are you sure you want to delete "${row.original.name}"? This cannot be undone.`
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground">Manage your stores and their settings</p>
        </div>
        <Button onClick={() => router.push('/dashboard/stores/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Store
        </Button>
      </div>

      <Card className="p-6">
        <DataTable<Store>
          columns={columns}
          data={stores}
          isLoading={isLoading}
          globalFilter={search}
          onGlobalFilterChange={setSearch}
          pageIndex={page - 1}
          pageSize={20}
          pageCount={data?.pagination?.pages || 1}
          onPaginationChange={(pagination) => {
            setPage(pagination.pageIndex + 1);
          }}
        />
      </Card>
    </div>
  );
}

export { Page as StoresPage };
