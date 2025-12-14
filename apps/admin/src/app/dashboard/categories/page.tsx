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
import { Plus, Edit, Trash2, Star, ExternalLink, FolderTree } from 'lucide-react';
import { useStores } from '@/hooks/useStores';

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

export function CategoriesPage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { data, isLoading } = useCategories(selectedStoreId || '');
  const { data: storesData } = useStores();
  const deleteMutation = useDeleteCategory(selectedStoreId || '', selectedCategory?._id || '');

  const categories = (data?.data || []) as Category[];
  const stores = storesData?.data || [];
  const currentStore = stores.find((s: any) => s._id === selectedStoreId);

  // Create a map of category IDs to names for parent lookup
  const categoryMap = new Map(categories.map(c => [c._id, c.name]));

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
            <div className="flex items-center gap-2">
              {row.original.parentId && (
                <span className="text-muted-foreground">↳</span>
              )}
              <p className="font-medium">{row.original.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">/{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'parentId',
      header: 'Parent Category',
      cell: ({ row }) => (
        <div>
          {row.original.parentId ? (
            <span className="text-sm flex items-center gap-1">
              <FolderTree className="h-3 w-3" />
              {categoryMap.get(row.original.parentId) || 'Unknown'}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">— (Top Level)</span>
          )}
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
              if (currentStore?.slug) {
                const categoryUrl = `${FRONTEND_URL}/${currentStore.slug}/category/${row.original.slug}`;
                window.open(categoryUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            title="View on frontend"
            disabled={!currentStore?.slug}
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
          <p className="text-muted-foreground">
            Manage product categories. Use "Parent Category" to create subcategories.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/categories/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Info Card about Category Hierarchy */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Tip:</strong> Categories without a parent are "Top Level" categories shown in the main navigation.
          To create a subcategory, select its parent when creating/editing.
        </p>
      </Card>

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
