'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, FormInput, FormTextarea, MediaUpload } from '@/components/index';
import type { CreateStoreRequest, UpdateStoreRequest, Store } from '@repo/types';

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  domain: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
});

type StoreFormData = z.infer<typeof storeSchema>;

interface StoreFormProps {
  store?: Store;
  onSubmit: (data: CreateStoreRequest | UpdateStoreRequest) => Promise<void>;
  isLoading?: boolean;
}

export function StoreForm({ store, onSubmit, isLoading = false }: StoreFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: store
      ? {
          name: store.name,
          slug: store.slug,
          domain: store.domain,
          description: store.description,
          logo: store.logo,
        }
      : {},
  });

  const nameValue = watch('name');

  const handleFormSubmit = async (data: StoreFormData) => {
    // Remove empty optional fields
    const cleanedData = {
      ...data,
      domain: data.domain || undefined,
      description: data.description || undefined,
      logo: data.logo || undefined,
    };
    await onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Store Information</h3>
          <div className="space-y-4">
            <FormInput
              label="Store Name"
              placeholder="Nike Store"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            <FormInput
              label="Slug"
              placeholder="nike-store"
              helperText="URL-friendly identifier (lowercase alphanumeric with hyphens)"
              required
              error={errors.slug?.message}
              {...register('slug')}
            />

            <FormInput
              label="Domain (Optional)"
              placeholder="nike-store.com"
              helperText="Custom domain for your store"
              error={errors.domain?.message}
              {...register('domain')}
            />

            <FormTextarea
              label="Description (Optional)"
              placeholder="Tell us about your store..."
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Store Logo</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Logo (Optional)</label>
            <MediaUpload
              onMediaUploaded={(url) => setValue('logo', url)}
              accept="image/*"
              maxSize={5}
            />
            {watch('logo') && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview</p>
                <div className="relative w-32 h-32 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={watch('logo')}
                    alt="Store logo preview"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <span className="animate-spin mr-2">⏳</span>}
          {store ? 'Update Store' : 'Create Store'}
        </Button>
      </div>
    </form>
  );
}
