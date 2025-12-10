'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, FormInput, FormTextarea, FormCheckbox, MediaUpload } from '@/components/index';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@repo/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

interface CategoryFormProps {
  storeId?: string;
  category?: Category;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  isLoading?: boolean;
}

export function CategoryForm({ storeId, category, onSubmit, isLoading = false }: CategoryFormProps) {
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
          isFeatured: category.isFeatured,
          isActive: category.isActive,
        }
      : {
          isFeatured: false,
          isActive: true,
        },
  });

  const imageUrl = watch('imageUrl');
  const nameValue = watch('name');

  const handleFormSubmit = async (data: any) => {
    // Remove empty optional fields
    const cleanedData = {
      ...data,
      imageUrl: data.imageUrl || undefined,
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
