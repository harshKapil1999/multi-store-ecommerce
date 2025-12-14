'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, FormInput, FormTextarea, FormCheckbox, FormSelect, MediaUpload, BillboardSelect } from '@/components/index';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@repo/types';
import { useCategories } from '@/hooks/useCategories';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
  parentId: z.string().optional(),
  billboards: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

interface CategoryFormProps {
  storeId: string;
  category?: Category;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  isLoading?: boolean;
}

export function CategoryForm({ storeId, category, onSubmit, isLoading = false }: CategoryFormProps) {
  const { data: categoriesData } = useCategories(storeId);
  
  // Get parent categories (only root categories, or all except current one if editing)
  const allCategories = Array.isArray(categoriesData?.data?.data) 
    ? categoriesData.data.data 
    : Array.isArray(categoriesData?.data) 
    ? categoriesData.data 
    : [];
  
  // Filter out current category (can't be parent of itself) and show only root categories
  const parentOptions = allCategories
    .filter((cat: Category) => category ? cat._id !== category._id : true)
    .map((cat: Category) => ({
      value: cat._id,
      label: cat.parentId ? `↳ ${cat.name}` : cat.name,
    }));

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setValue,
  } = useForm<any>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          parentId: category.parentId || '',
          billboards: category.billboards?.map((b: any) => typeof b === 'string' ? b : b._id) || [],
          isFeatured: category.isFeatured,
          isActive: category.isActive,
        }
      : {
          isFeatured: false,
          isActive: true,
          parentId: '',
          billboards: [],
        },
  });

  const imageUrl = watch('imageUrl');
  const nameValue = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!category && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', slug);
    }
  }, [nameValue, category, setValue]);

  const handleFormSubmit = async (data: any) => {
    // Remove empty optional fields
    const cleanedData = {
      ...data,
      imageUrl: data.imageUrl || undefined,
      description: data.description || undefined,
      parentId: data.parentId || undefined,
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
              label="Category Name"
              placeholder="Running Shoes"
              required
              error={errors.name?.message as string | undefined}
              {...register('name')}
            />

            <FormInput
              label="Slug"
              placeholder="running-shoes"
              helperText="URL-friendly identifier"
              required
              error={errors.slug?.message as string | undefined}
              {...register('slug')}
            />

            <FormTextarea
              label="Description (Optional)"
              placeholder="Describe this category..."
              error={errors.description?.message as string | undefined}
              {...register('description')}
            />

            {/* Parent Category for Subcategory Support */}
            <FormSelect
              label="Parent Category (Optional)"
              options={[{ value: 'none', label: '— No Parent (Top Level) —' }, ...parentOptions]}
              value={watch('parentId') || 'none'}
              onValueChange={(value) => setValue('parentId', value === 'none' ? '' : value)}
              error={errors.parentId?.message as string | undefined}
            />
            <p className="text-xs text-muted-foreground -mt-2">
              Select a parent to make this a subcategory
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Category Image</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Image (Optional)</label>
            <MediaUpload
              onMediaUploaded={(url) => setValue('imageUrl', url)}
              accept="image/*"
              maxSize={50}
            />
            {imageUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview</p>
                <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Category preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Category Carousel</h3>
        <Controller
          name="billboards"
          control={control}
          render={({ field }) => (
            <BillboardSelect
              storeId={storeId}
              value={field.value || []}
              onChange={field.onChange}
              label="Select carousel slides for this category"
            />
          )}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        <div className="space-y-3">
          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <FormCheckbox
                label="Feature this category on home page"
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
          {category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
