'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import {
  useCategories,
  useDeleteCategory,
} from '@/hooks/useCategories';
import {
  DataTable,
  Button,
  Card,
} from '@/components/index';
import type { ColumnDef } from '@tanstack/react-table';
import type { Category } from '@repo/types';
import { Plus, Edit, Trash2, Star, ExternalLink } from 'lucide-react';

export function CategoriesPage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { data, isLoading } = useCategories(selectedStoreId || '');
  const deleteMutation = useDeleteCategory(selectedStoreId || '', selectedCategory?._id || '');

  const categories = (data?.data || []) as Category[];

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.imageUrl && (
            <img
              src={row.original.imageUrl}
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
      accessorKey: 'isFeatured',
      header: 'Featured',
      cell: ({ row }) => (
        <div>
          {row.original.isFeatured && (
            <div className="flex items-center gap-1 text-yellow-600">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm">Featured</span>
            </div>
          )}
        </div>
      ),
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
              const categoryUrl = `${window.location.origin}/stores/${selectedStoreId}/categories/${row.original.slug}`;
              window.open(categoryUrl, '_blank', 'noopener,noreferrer');
            }}
            title="View category"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/categories/${row.original._id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategory(row.original);
              if (
                window.confirm(
                  `Are you sure you want to delete "${row.original.name}"?`
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
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        <Button onClick={() => router.push('/dashboard/categories/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      <Card className="p-6">
        <DataTable<Category>
          columns={columns}
          data={categories}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}

export default CategoriesPage;
