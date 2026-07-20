'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedStore } from '@/contexts/store-context';
import { useProduct } from '@/hooks/useProducts';
import { Card, Button, FormInput } from '@/components/index';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { VariantForm } from './variant-form';
import { BulkVariantCreator } from './bulk-variant-creator';
import { apiClient as api } from '@/lib/api-client';
import { ProductVariant } from '@repo/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ProductVariantsPage({ 
  params 
}: { 
  params: Promise<{ productId: string }> 
}) {
  const { productId } = use(params);
  const router = useRouter();
  const { selectedStoreId } = useSelectedStore();
  const queryClient = useQueryClient();
  const { data: productData, isLoading: productLoading } = useProduct(selectedStoreId || '', productId);
  const  [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [isBulkCreatorOpen, setIsBulkCreatorOpen] = useState(false);

  const product = productData?.data;

  // Fetch variants
  const { data: variantsData, isLoading: variantsLoading } = useQuery({
    queryKey: ['variants', productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}/variants`);
      // axios wraps response in .data, backend wraps in { success, data }
      const result = response.data?.data || response.data || [];
      return Array.isArray(result) ? result : [];
    },
    enabled: !!productId,
  });

  const variants = variantsData || [];

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      await api.delete(`/variants/${variantId}`);
    },
    onSuccess: () => {
      toast.success('Variant deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['variants', productId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete variant');
    },
  });

  if (!selectedStoreId) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Please select a store first</p>
      </Card>
    );
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Product not found</p>
      </Card>
    );
  }

  if (!product.hasVariants) {
    return (
      <div className="space-y-6">
        <Link href={`/dashboard/products/${productId}/edit`}>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Product</span>
          </button>
        </Link>
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Variants Not Enabled</h2>
          <p className="text-muted-foreground mb-6">This product doesn't have variants enabled.</p>
          <Link href={`/dashboard/products/${productId}/edit`}>
            <Button>Enable Variants</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/products/${productId}/edit`}>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-muted-foreground">Manage variants for this product</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Product Variants</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsBulkCreatorOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Bulk Create
            </Button>
            <Button onClick={() => {
              setEditingVariant(null);
              setIsFormOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
          </div>
        </div>

        {isBulkCreatorOpen && (
          <BulkVariantCreator
            product={product}
            onClose={() => setIsBulkCreatorOpen(false)}
            onSuccess={() => {
              setIsBulkCreatorOpen(false);
              queryClient.invalidateQueries({ queryKey: ['variants', productId] });
            }}
          />
        )}

        {isFormOpen && (
          <VariantForm 
            productId={productId} 
            storeId={selectedStoreId}
            product={product}
            variant={editingVariant}
            onClose={() => {
              setIsFormOpen(false);
              setEditingVariant(null);
            }}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingVariant(null);
              queryClient.invalidateQueries({ queryKey: ['variants', productId] });
            }}
          />
        )}

        {variantsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : variants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No variants yet. Create your first variant!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Image</th>
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">SKU</th>
                  <th className="text-left py-3 px-4 font-medium">Price</th>
                  <th className="text-left py-3 px-4 font-medium">Compare At</th>
                  <th className="text-left py-3 px-4 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 font-medium">Attributes</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant: ProductVariant) => (
                  <tr key={variant._id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      {variant.images && variant.images.length > 0 ? (
                        <div className="w-10 h-10 rounded border overflow-hidden">
                          <img src={variant.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded border bg-gray-50 flex items-center justify-center text-[10px] text-gray-400">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">{variant.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{variant.sku}</td>
                    <td className="py-3 px-4 font-bold">₹{variant.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {variant.compareAtPrice ? `₹${variant.compareAtPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={variant.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {variant.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {Object.entries(variant.attributes).map(([key, value]) => (
                        <div key={key} className="text-gray-600">
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingVariant(variant);
                          setIsFormOpen(true);
                        }}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this variant?')) {
                            deleteVariantMutation.mutate(variant._id);
                          }
                        }}
                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
