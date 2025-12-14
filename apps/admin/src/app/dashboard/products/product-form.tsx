'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormInput, FormTextarea, FormCheckbox, FormSelect, MediaUpload, Card } from '@/components/index';
import { MediaGalleryUpload } from '@/components/MediaGalleryUpload';
import type { Product, CreateProductInput, UpdateProductInput, Attribute, Media } from '@repo/types';
import { useCategories } from '@/hooks/useCategories';
import { X, Plus } from 'lucide-react';

const attributeSchema = z.object({
  name: z.string().min(1, 'Attribute name is required'),
  value: z.string().min(1, 'Attribute value is required'),
  isFilterable: z.boolean().default(false),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().default(''),
  categoryId: z.string().min(1, 'Category is required'),
  featuredImage: z.string().min(1, 'Featured image is required'),
  mediaGallery: z.array(z.object({
    url: z.string(),
    type: z.enum(['image', 'video']),
    mimeType: z.string(),
    order: z.number().optional(),
    alt: z.string().optional(),
  })).default([]),
  mrp: z.coerce.number().positive('MRP must be positive'),
  sellingPrice: z.coerce.number().positive('Selling price must be positive'),
  stock: z.coerce.number().nonnegative('Stock must be non-negative'),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  attributes: z.array(attributeSchema).default([]),
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
          mediaGallery: product.mediaGallery || [],
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
          stock: product.stock,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          attributes: product.attributes || [],
        }
      : {
          isFeatured: false,
          isActive: true,
          mrp: 0,
          sellingPrice: 0,
          stock: 0,
          mediaGallery: [],
          attributes: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'attributes',
  });

  const featuredImage = watch('featuredImage');
  const nameValue = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!product && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', slug);
    }
  }, [nameValue, product, setValue]);

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

      {/* Product Attributes Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Product Attributes</h3>
            <p className="text-sm text-muted-foreground">
              Add attributes like Size, Color, Brand, etc. Mark as filterable to show in shop filters.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', value: '', isFilterable: false })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Attribute
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm">No attributes added yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Common: Size, Color, Brand, Gender, Material
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <FormInput
                    label="Attribute Name"
                    placeholder="Size"
                    {...register(`attributes.${index}.name`)}
                  />
                  <FormInput
                    label="Value"
                    placeholder="UK 10"
                    {...register(`attributes.${index}.value`)}
                  />
                </div>
                <div className="pt-8 flex items-center gap-3">
                  <Controller
                    name={`attributes.${index}.isFilterable`}
                    control={control}
                    render={({ field }) => (
                      <FormCheckbox
                        label="Filterable"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Product Images</h3>
        <div className="space-y-6">
          {/* Featured Image */}
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

          {/* Media Gallery */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">Gallery Images/Videos (Optional)</label>
                <p className="text-xs text-muted-foreground">Add additional product images or videos</p>
              </div>
            </div>
            <MediaGalleryUpload
              mediaGallery={watch('mediaGallery') || []}
              onUpdate={(gallery) => setValue('mediaGallery', gallery)}
            />
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
