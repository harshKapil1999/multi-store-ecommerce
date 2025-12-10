'use client';

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormInput, FormTextarea, FormCheckbox, FormSelect, MediaUpload, Card } from '@/components/index';
import type { Product, CreateProductInput, UpdateProductInput } from '@repo/types';
import { useCategories } from '@/hooks/useCategories';
import { X, Plus } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().default(''),
  categoryId: z.string().min(1, 'Category is required'),
  featuredImage: z.string().min(1, 'Featured image is required'),
  mrp: z.coerce.number().positive('MRP must be positive'),
  sellingPrice: z.coerce.number().positive('Selling price must be positive'),
  stock: z.coerce.number().nonnegative('Stock must be non-negative'),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

interface ProductFormProps {
  storeId: string;
  product?: Product;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({
  storeId,
  product,
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const { data: categoriesData } = useCategories(storeId);
  const categoriesList = Array.isArray(categoriesData?.data?.data) 
    ? categoriesData.data.data 
    : Array.isArray(categoriesData?.data) 
    ? categoriesData.data 
    : [];
  
  const categories = categoriesList.map((cat: any) => ({
    value: cat._id,
    label: cat.name,
  }));

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setValue,
  } = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          featuredImage: product.featuredImage,
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
          stock: product.stock,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
        }
      : {
          isFeatured: false,
          isActive: true,
          mrp: 0,
          sellingPrice: 0,
          stock: 0,
        },
  });

  const featuredImage = watch('featuredImage');
  const nameValue = watch('name');

  const handleFormSubmit = async (data: any) => {
    // Remove empty optional fields
    const cleanedData = {
      ...data,
      description: data.description || undefined,
    };
    await onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <FormInput
              label="Product Name"
              placeholder="Nike Air Max"
              required
              error={errors.name?.message as string | undefined}
              {...register('name')}
            />

            <FormInput
              label="Slug"
              placeholder="nike-air-max"
              helperText="URL-friendly identifier"
              required
              error={errors.slug?.message as string | undefined}
              {...register('slug')}
            />

            <FormTextarea
              label="Description (Optional)"
              placeholder="Describe this product..."
              error={errors.description?.message as string | undefined}
              {...register('description')}
            />

            <FormSelect
              label="Category"
              required
              options={categories}
              value={watch('categoryId')}
              onValueChange={(value) => setValue('categoryId', value)}
              error={errors.categoryId?.message as string | undefined}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing & Stock</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="MRP"
              type="number"
              placeholder="5999"
              required
              step="0.01"
              error={errors.mrp?.message as string | undefined}
              {...register('mrp')}
            />
            <FormInput
              label="Selling Price"
              type="number"
              placeholder="4999"
              required
              step="0.01"
              error={errors.sellingPrice?.message as string | undefined}
              {...register('sellingPrice')}
            />
          </div>

          <FormInput
            label="Stock"
            type="number"
            placeholder="100"
            required
            error={errors.stock?.message as string | undefined}
            {...register('stock')}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Product Image</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Featured Image <span className="text-red-500">*</span></label>
            <MediaUpload
              onMediaUploaded={(url) => setValue('featuredImage', url)}
              accept="image/*"
              maxSize={50}
            />
            {featuredImage && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview</p>
                <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={featuredImage}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            {errors.featuredImage && (
              <p className="text-sm text-red-500">
                {typeof errors.featuredImage?.message === 'string'
                  ? errors.featuredImage.message
                  : 'Featured image is required'}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        <div className="space-y-3">
          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <FormCheckbox
                label="Feature this product"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormCheckbox
                label="Active"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </Card>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <span className="animate-spin mr-2">⏳</span>}
          {product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
