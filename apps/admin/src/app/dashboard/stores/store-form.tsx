'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, FormInput, FormTextarea, MediaUpload, BillboardSelect, FormCheckbox } from '@/components/index';
import type { CreateStoreRequest, UpdateStoreRequest, Store } from '@repo/types';
import { X, Plus } from 'lucide-react';

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  domain: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  homeBillboards: z.array(z.string()).optional(),
  topBar: z.object({
    isVisible: z.boolean().default(true),
    text: z.string().optional().default(''),
    logo: z.string().optional().default(''),
    message: z.string().optional().default(''),
    backgroundColor: z.string().optional().default('#F5F5F5'),
    links: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })).optional().default([]),
  }).optional(),
});

type StoreFormData = any;

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
    control,
  } = useForm<any>({
    resolver: zodResolver(storeSchema),
    defaultValues: store
      ? {
          name: store.name,
          slug: store.slug,
          domain: store.domain,
          description: store.description,
          logo: store.logo,
          homeBillboards: store.homeBillboards?.map((b: any) => typeof b === 'string' ? b : b._id) || [],
          topBar: store.topBar || {
            isVisible: true,
            text: '',
            message: '',
            backgroundColor: '#F5F5F5',
            links: [],
          },
        }
      : {
          name: '',
          slug: '',
          homeBillboards: [],
          topBar: {
            isVisible: true,
            text: '',
            message: '',
            backgroundColor: '#F5F5F5',
            links: [],
          },
        },
  });

  const nameValue = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!store && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', slug);
    }
  }, [nameValue, store, setValue]);

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
              error={errors.name?.message as string}
              {...register('name')}
            />

            <FormInput
              label="Slug"
              placeholder="nike-store"
              helperText="URL-friendly identifier (lowercase alphanumeric with hyphens)"
              required
              error={errors.slug?.message as string}
              {...register('slug')}
            />

            <FormInput
              label="Domain (Optional)"
              placeholder="nike-store.com"
              helperText="Custom domain for your store"
              error={errors.domain?.message as string}
              {...register('domain')}
            />

            <FormTextarea
              label="Description (Optional)"
              placeholder="Tell us about your store..."
              error={errors.description?.message as string}
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

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Top Bar Configuration</h3>
          <Controller
            name="topBar.isVisible"
            control={control}
            render={({ field }) => (
              <FormCheckbox
                label="Visible"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        {watch('topBar')?.isVisible && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Left Side Text (e.g. Jordan)"
                placeholder="Jordan"
                {...register('topBar.text')}
              />
              <FormInput
                label="Background Color"
                type="color"
                {...register('topBar.backgroundColor')}
              />
            </div>
            
            <FormInput
              label="Promotion Message"
              placeholder="Free Delivery on orders above ₹2,500"
              {...register('topBar.message')}
            />

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Utility Links</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentLinks = watch('topBar.links') || [];
                    setValue('topBar.links', [...currentLinks, { label: '', href: '' }]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </div>

              <div className="space-y-3">
                {(watch('topBar.links') || []).map((link: any, index: number) => (
                  <div key={index} className="flex items-end gap-3">
                    <div className="flex-1">
                      <FormInput
                        label="Label"
                        placeholder="Help"
                        {...register(`topBar.links.${index}.label`)}
                      />
                    </div>
                    <div className="flex-1">
                      <FormInput
                        label="URL"
                        placeholder="/help"
                        {...register(`topBar.links.${index}.href`)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 mb-1"
                      onClick={() => {
                        const current = [...(watch('topBar.links') || [])];
                        current.splice(index, 1);
                        setValue('topBar.links', current);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {store && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Home Page Carousel</h3>
          <Controller
            name="homeBillboards"
            control={control}
            render={({ field }) => (
              <BillboardSelect
                storeId={store._id}
                value={field.value || []}
                onChange={field.onChange}
                label="Select carousel slides for the store home page"
              />
            )}
          />
        </Card>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <span className="animate-spin mr-2">⏳</span>}
          {store ? 'Update Store' : 'Create Store'}
        </Button>
      </div>
    </form>
  );
}
