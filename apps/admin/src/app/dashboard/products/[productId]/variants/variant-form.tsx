'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormInput, Card, MediaUpload } from '@/components/index';
import { Product, ProductVariant } from '@repo/types';
import { apiClient as api } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

const variantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().positive('Price must be positive'),
  compareAtPrice: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().nonnegative('Stock must be non-negative'),
  attributes: z.record(z.string(), z.string().min(1, 'Attribute value is required')),
  images: z.array(z.string()).default([]),
  featuredImageIndex: z.number().nonnegative().default(0),
});

type VariantFormData = z.infer<typeof variantSchema>;

interface VariantFormProps {
  productId: string;
  storeId: string;
  product: Product;
  variant?: ProductVariant | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function VariantForm({
  productId,
  storeId,
  product,
  variant,
  onClose,
  onSuccess,
}: VariantFormProps) {
  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema) as any,
    defaultValues: variant ? {
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice || 0,
      stock: variant.stock,
      attributes: variant.attributes,
      images: variant.images || [],
      featuredImageIndex: variant.featuredImageIndex || 0,
    } : {
      name: '',
      sku: '',
      price: 0,
      compareAtPrice: 0,
      stock: 0,
      attributes: product.variantOptions?.reduce((acc, opt) => {
        acc[opt.name] = '';
        return acc;
      }, {} as Record<string, string>) || {},
      images: [],
      featuredImageIndex: 0,
    },
  });

  const images = watch('images') || [];
  const [isUploading, setIsUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: VariantFormData) => {
      // Clean up data
      const payload = {
        ...data,
        compareAtPrice: data.compareAtPrice || 0,
        images: data.images || [],
      };

      if (variant) {
        return api.put(`/variants/${variant._id}`, {
          ...payload,
          productId,
        });
      } else {
        return api.post(`/products/${productId}/variants`, {
          ...payload,
          productId,
        });
      }
    },
    onSuccess: () => {
      toast.success(variant ? 'Variant updated successfully' : 'Variant created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save variant');
    },
  });

  const onSubmit = (data: VariantFormData) => {
    createMutation.mutate(data);
  };

  const handleImageUpload = (url: string) => {
    setValue('images', [...images, url]);
  };

  const removeImage = (index: number) => {
    setValue('images', images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= images.length) return;

    const featuredUrl = images[watch('featuredImageIndex')];
    const reordered = [...images];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    setValue('images', reordered);
    setValue('featuredImageIndex', Math.max(0, reordered.indexOf(featuredUrl)));
  };

  return (
    <Card className="p-6 mb-6 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {variant ? 'Edit Variant' : 'Create New Variant'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Variant Name"
            placeholder="e.g., Red Size M"
            {...register('name')}
            error={errors.name?.message}
          />
          <FormInput
            label="SKU"
            placeholder="e.g., SKU-001"
            {...register('sku')}
            error={errors.sku?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Selling Price (₹)"
            type="number"
            placeholder="0.00"
            {...register('price')}
            error={errors.price?.message}
          />
          <FormInput
            label="MRP / Compare At (₹)"
            type="number"
            placeholder="0.00"
            {...register('compareAtPrice')}
            error={errors.compareAtPrice?.message}
            helperText="Leave 0 if no discount"
          />
          <FormInput
            label="Stock Quantity"
            type="number"
            placeholder="0"
            {...register('stock')}
            error={errors.stock?.message}
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
           <label className="text-sm font-medium">Variant Images</label>
           <p className="text-xs text-muted-foreground mb-2">
             Upload specific images for this variant (e.g., Red shoes). These will replace the main gallery when selected.
           </p>
           
           {/* Image List */}
           {images.length > 0 && (
             <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
                {images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`relative aspect-square group bg-white rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
                      watch('featuredImageIndex') === idx ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setValue('featuredImageIndex', idx)}
                  >
                    <img src={img} alt={`Variant ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                        if (watch('featuredImageIndex') >= idx && watch('featuredImageIndex') > 0) {
                          setValue('featuredImageIndex', watch('featuredImageIndex') - 1);
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {watch('featuredImageIndex') === idx ? (
                      <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                        <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                          Featured
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all">
                        <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-black text-[10px] px-2 py-0.5 rounded-full shadow-sm font-medium">
                          Set Featured
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 right-1 z-10 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); moveImage(idx, -1); }}
                        disabled={idx === 0}
                        className="rounded-full bg-black/75 p-1 text-white disabled:opacity-30"
                        aria-label={`Move variant image ${idx + 1} earlier`}
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); moveImage(idx, 1); }}
                        disabled={idx === images.length - 1}
                        className="rounded-full bg-black/75 p-1 text-white disabled:opacity-30"
                        aria-label={`Move variant image ${idx + 1} later`}
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
           )}

           {isUploading ? (
             <div className="border rounded-lg p-4 bg-muted/50">
                <MediaUpload 
                   onMediaUploaded={handleImageUpload}
                   accept="image/*"
                   maxSize={10}
                />
                <Button 
                   type="button" 
                   variant="ghost" 
                   size="sm" 
                   className="mt-2 w-full"
                   onClick={() => setIsUploading(false)}
                >
                  Done Uploading
                </Button>
             </div>
           ) : (
             <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={() => setIsUploading(true)}
               className="w-full border-dashed"
             >
               + Add Variant Images
             </Button>
           )}
        </div>

        {product.variantOptions && product.variantOptions.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Variant Attributes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.variantOptions.map((option) => (
                <div key={option.name}>
                  <label className="text-sm font-medium block mb-2">{option.name}</label>
                  <select
                    {...register(`attributes.${option.name}`)}
                    className="w-full p-2 border rounded-md dark:bg-black dark:border-gray-700"
                  >
                    <option value="">Select {option.name}</option>
                    {option.values.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  {errors.attributes && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.attributes[option.name]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Saving...' : variant ? 'Update Variant' : 'Create Variant'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
