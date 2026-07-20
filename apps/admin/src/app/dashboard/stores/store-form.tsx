'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, FormInput, FormTextarea, MediaUpload, BillboardSelect, FormCheckbox } from '@/components/index';
import { Checkbox } from '@/components/ui/checkbox';
import type { CreateStoreRequest, UpdateStoreRequest, Store, HomeSectionConfig } from '@repo/types';
import { DEFAULT_HOME_SECTIONS } from '@repo/types';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

const normalizeHomeSections = (sections?: HomeSectionConfig[]) =>
  DEFAULT_HOME_SECTIONS.map((fallback) => ({
    ...fallback,
    ...(sections?.find((section) => section.type === fallback.type) || {}),
  })).sort((a, b) => a.order - b.order);

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
  homeSections: z.array(z.object({
    id: z.string(),
    type: z.enum(['featured_categories', 'category_collection', 'spotlight', 'featured_products', 'newsletter']),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    isVisible: z.boolean(),
    order: z.number(),
    categoryIds: z.array(z.string()).optional(),
    productIds: z.array(z.string()).optional(),
    limit: z.number().optional(),
    layout: z.enum(['grid', 'carousel']).optional(),
    buttonLabel: z.string().optional(),
    consentText: z.string().optional(),
  })).optional(),
});

type StoreFormData = any;

interface StoreFormProps {
  store?: Store;
  onSubmit: (data: CreateStoreRequest | UpdateStoreRequest) => Promise<void>;
  isLoading?: boolean;
}

export function StoreForm({ store, onSubmit, isLoading = false }: StoreFormProps) {
  const { data: categoriesData } = useCategories(store?._id || '');
  const { data: productsData } = useProducts(store?._id || '', { limit: 100 });
  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
  const products = Array.isArray(productsData?.data) ? productsData.data : [];
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
          homeSections: normalizeHomeSections(store.homeSections),
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
          homeSections: normalizeHomeSections(),
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
  const homeSections = watch('homeSections') || [];

  const updateSection = (index: number, patch: Partial<HomeSectionConfig>) => {
    setValue(`homeSections.${index}`, { ...homeSections[index], ...patch }, { shouldDirty: true });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= homeSections.length) return;
    const reordered = [...homeSections];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setValue('homeSections', reordered.map((section, order) => ({ ...section, order })), { shouldDirty: true });
  };

  const toggleSelection = (index: number, field: 'categoryIds' | 'productIds', id: string) => {
    const current = homeSections[index]?.[field] || [];
    updateSection(index, { [field]: current.includes(id) ? current.filter((value: string) => value !== id) : [...current, id] });
  };

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
              placeholder="brand.example.com"
              helperText="Optional custom domain for this individual storefront. The platform domain is configured during deployment."
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
          <div>
            <h3 className="text-lg font-semibold">Announcement Bar</h3>
            <p className="mt-1 text-sm text-muted-foreground">Shown above the storefront navigation. Use it for a short promotion or support link.</p>
          </div>
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
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Home Page Sections</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose which sections appear, edit their content, select catalog items, and change their order. Empty selections use the store&apos;s featured items automatically.
            </p>
          </div>

          <div className="space-y-4">
            {homeSections.map((section: HomeSectionConfig, index: number) => {
              const usesCategories = section.type === 'featured_categories' || section.type === 'category_collection';
              const usesProducts = section.type === 'spotlight' || section.type === 'featured_products';
              const sectionLabel = {
                featured_categories: 'Featured category stories',
                category_collection: 'Shop by collection',
                spotlight: 'Spotlight carousel',
                featured_products: 'Featured product grid',
                newsletter: 'Newsletter / Join now',
              }[section.type];

              return (
                <div key={section.id} className="rounded-md border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{sectionLabel}</p>
                      <p className="text-xs text-muted-foreground">Position {index + 1}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <FormCheckbox
                        label="Visible"
                        checked={section.isVisible}
                        onCheckedChange={(checked) => updateSection(index, { isVisible: checked })}
                      />
                      <Button type="button" variant="ghost" size="icon" title="Move section up" disabled={index === 0} onClick={() => moveSection(index, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" title="Move section down" disabled={index === homeSections.length - 1} onClick={() => moveSection(index, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <FormInput label="Section title" value={section.title} onChange={(event) => updateSection(index, { title: event.target.value })} />
                    <FormInput label="Supporting text (optional)" value={section.subtitle || ''} onChange={(event) => updateSection(index, { subtitle: event.target.value })} />
                  </div>

                  {(usesCategories || usesProducts) && (
                    <div className="mt-4 grid gap-4 md:grid-cols-[180px_180px_1fr]">
                      <FormInput
                        label="Maximum items"
                        type="number"
                        min={1}
                        max={24}
                        value={section.limit || 8}
                        onChange={(event) => updateSection(index, { limit: Math.max(1, Math.min(24, Number(event.target.value) || 1)) })}
                      />
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Layout</label>
                        <select
                          value={section.layout || 'grid'}
                          onChange={(event) => updateSection(index, { layout: event.target.value as 'grid' | 'carousel' })}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground"
                        >
                          <option value="grid">Grid</option>
                          <option value="carousel">Carousel</option>
                        </select>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium">Choose {usesCategories ? 'categories' : 'products'}</p>
                        <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border bg-background p-3">
                          {(usesCategories ? categories : products).map((item: any) => {
                            const field = usesCategories ? 'categoryIds' : 'productIds';
                            const selected = (section[field] || []).includes(item._id);
                            return (
                              <label key={item._id} className="flex cursor-pointer items-center gap-2 text-sm">
                                <Checkbox checked={selected} onCheckedChange={() => toggleSelection(index, field, item._id)} />
                                <span>{item.name}</span>
                              </label>
                            );
                          })}
                          {(usesCategories ? categories : products).length === 0 && (
                            <p className="text-sm text-muted-foreground">No catalog items available yet.</p>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Leave all unchecked to use featured items automatically.</p>
                      </div>
                    </div>
                  )}

                  {section.type === 'newsletter' && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <FormInput label="Button label" value={section.buttonLabel || ''} onChange={(event) => updateSection(index, { buttonLabel: event.target.value })} />
                      <FormInput label="Consent note" value={section.consentText || ''} onChange={(event) => updateSection(index, { consentText: event.target.value })} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {store && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-1">Home Page Carousel</h3>
          <p className="mb-4 text-sm text-muted-foreground">The selected active billboards appear as hero slides on this store's home page, in this order.</p>
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
