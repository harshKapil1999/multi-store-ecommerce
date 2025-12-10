'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, FormInput, FormTextarea, FormCheckbox, MediaUpload } from '@/components/index';
import type { Billboard, CreateBillboardInput, UpdateBillboardInput } from '@repo/types';

const billboardSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional().default(''),
  imageUrl: z.string().min(1, 'Image URL is required'),
  ctaText: z.string().optional().default(''),
  ctaLink: z.string().optional().default(''),
  isActive: z.boolean().default(true),
});

interface BillboardFormProps {
  billboard?: Billboard;
  onSubmit: (data: CreateBillboardInput | UpdateBillboardInput) => Promise<void>;
  isLoading?: boolean;
}

export function BillboardForm({ billboard, onSubmit, isLoading = false }: BillboardFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setValue,
  } = useForm<any>({
    resolver: zodResolver(billboardSchema),
    defaultValues: billboard
      ? {
          title: billboard.title,
          subtitle: billboard.subtitle,
          imageUrl: billboard.imageUrl,
          ctaText: billboard.ctaText,
          ctaLink: billboard.ctaLink,
          isActive: billboard.isActive,
        }
      : {
          isActive: true,
        },
  });

  const imageUrl = watch('imageUrl');

  const handleFormSubmit = async (data: any) => {
    // Remove empty optional fields
    const cleanedData = {
      ...data,
      subtitle: data.subtitle || undefined,
      ctaText: data.ctaText || undefined,
      ctaLink: data.ctaLink || undefined,
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
              label="Title"
              placeholder="Summer Collection 2024"
              required
              error={errors.title?.message as string | undefined}
              {...register('title')}
            />

            <FormTextarea
              label="Subtitle (Optional)"
              placeholder="Discover the latest trends..."
              error={errors.subtitle?.message as string | undefined}
              {...register('subtitle')}
            />

            <FormInput
              label="CTA Text (Optional)"
              placeholder="Shop Now"
              error={errors.ctaText?.message as string | undefined}
              {...register('ctaText')}
            />

            <FormInput
              label="CTA Link (Optional)"
              placeholder="https://example.com/collection"
              error={errors.ctaLink?.message as string | undefined}
              {...register('ctaLink')}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Billboard Image</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Image <span className="text-red-500">*</span></label>
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
                    alt="Billboard preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            {errors.imageUrl && (
              <p className="text-sm text-red-500">
                {typeof errors.imageUrl?.message === 'string'
                  ? errors.imageUrl.message
                  : 'Image URL is required'}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        <div className="flex items-center">
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
          {billboard ? 'Update Billboard' : 'Create Billboard'}
        </Button>
      </div>
    </form>
  );
}
