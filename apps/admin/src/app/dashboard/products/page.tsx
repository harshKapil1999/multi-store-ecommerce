'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import {
  useProducts,
  useDeleteProduct,
  useUpdateStock,
} from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import {
  DataTable,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Card,
  FormInput,
  FormSelect,
} from '@/components/index';
import type { ColumnDef } from '@tanstack/react-table';
import type { Product, ProductFilters } from '@repo/types';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

export function ProductsPage() {
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState('0');
  const [filters, setFilters] = useState<Partial<ProductFilters>>({
    limit: 20,
    page: 1,
  });

  const { data, isLoading } = useProducts(selectedStoreId || '', filters);
  const { data: categoriesData } = useCategories(selectedStoreId || '');
  const deleteMutation = useDeleteProduct(selectedStoreId || '', selectedProduct?._id || '');
  const updateStockMutation = useUpdateStock(selectedStoreId || '', selectedProduct?._id || '');

  const products = (data?.data || []) as Product[];
  const categoriesList = Array.isArray(categoriesData?.data?.data) 
    ? categoriesData.data.data 
    : Array.isArray(categoriesData?.data) 
    ? categoriesData.data 
    : [];
  const categories = categoriesList.map((cat: any) => ({
    value: cat._id,
    label: cat.name,
  }));

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.featuredImage && (
            <img
              src={row.original.featuredImage}
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
      accessorKey: 'sellingPrice',
      header: 'Price',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">₹{row.original.sellingPrice}</p>
          {row.original.mrp > row.original.sellingPrice && (
            <p className="text-xs text-muted-foreground line-through">
              ₹{row.original.mrp}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            row.original.stock > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.original.stock}
        </span>
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
              // Assuming storefront URL format - adjust as needed
              const productUrl = `${window.location.origin}/stores/${selectedStoreId}/products/${row.original.slug}`;
              window.open(productUrl, '_blank', 'noopener,noreferrer');
            }}
            title="View product"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProduct(row.original);
              setNewStock(String(row.original.stock));
              setIsStockOpen(true);
            }}
          >
            📦
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/products/${row.original._id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProduct(row.original);
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
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => router.push('/dashboard/products/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
          />
          <FormSelect
            placeholder="All Categories"
            options={categories}
            value={filters.category || ''}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                category: value || undefined,
                page: 1,
              })
            }
          />
        </div>
      </Card>

      <Card className="p-6">
        <DataTable<Product>
          columns={columns}
          data={products}
          isLoading={isLoading}
          pageIndex={(filters.page || 1) - 1}
          pageSize={filters.limit || 20}
          pageCount={data?.pagination?.pages || 1}
          onPaginationChange={(pagination) => {
            setFilters({
              ...filters,
              page: pagination.pageIndex + 1,
              limit: pagination.pageSize,
            });
          }}
        />
      </Card>

      {/* Update Stock Dialog */}
      {selectedProduct && (
        <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Stock: {selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Stock: {selectedProduct.stock}</p>
                <FormInput
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="New stock quantity"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsStockOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateStockMutation.mutate(
                      { stock: parseInt(newStock) },
                      {
                        onSuccess: () => setIsStockOpen(false),
                      }
                    );
                  }}
                  disabled={updateStockMutation.isPending}
                >
                  Update Stock
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ProductsPage;
