'use client';

import { useState, useEffect } from 'react';
import { useSelectedStore } from '@/contexts/store-context';
import { Card, Button, FormInput } from '@/components/index';
import { Plus, X, Trash2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ProductVariant, Product } from '@repo/types';
import { useUploadMedia } from '@/hooks/useMedia';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api-client';

interface BulkVariantCreatorProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

interface VariantToCreate {
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  attributes: Record<string, string>;
}

export function BulkVariantCreator({ product, onClose, onSuccess }: BulkVariantCreatorProps) {
  const { selectedStoreId } = useSelectedStore();
  const queryClient = useQueryClient();
  const uploadMedia = useUploadMedia();
  const [uploading, setUploading] = useState(false);

  // Shared attributes for all variants
  const [sharedImages, setSharedImages] = useState<string[]>([]);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const [baseAttributes, setBaseAttributes] = useState<Record<string, string>>({});
  
  // Varying attribute
  const [varyingAttribute, setVaryingAttribute] = useState('');
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  
  // Pricing strategy
  const [pricingStrategy, setPricingStrategy] = useState<'same' | 'individual'>('same');
  const [sharedPrice, setSharedPrice] = useState(product.sellingPrice);
  const [sharedComparePrice, setSharedComparePrice] = useState(product.mrp);
  
  // Individual variant details
  const [variants, setVariants] = useState<VariantToCreate[]>([]);

  // Generate variants when values selected
  useEffect(() => {
    if (!varyingAttribute || selectedValues.size === 0) {
      setVariants([]);
      return;
    }

    const newVariants: VariantToCreate[] = Array.from(selectedValues).map((value) => {
      const attrs = { ...baseAttributes, [varyingAttribute]: value };
      const attrString = Object.entries(attrs)
        .map(([k, v]) => `${v}`)
        .join(' - ');

      return {
        name: `${product.name} - ${attrString}`,
        sku: `${product.slug}-${Object.values(attrs).join('-').toLowerCase()}`.replace(/\s+/g, '-'),
        price: sharedPrice,
        compareAtPrice: sharedComparePrice,
        stock: 0,
        attributes: attrs,
      };
    });

    setVariants(newVariants);
  }, [varyingAttribute, selectedValues, baseAttributes, sharedPrice, sharedComparePrice]);

  // File upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const uploadPromises = Array.from(files).map(file => uploadMedia.mutateAsync(file));
      const uploaded = await Promise.all(uploadPromises);
      setSharedImages((prev) => [...prev, ...uploaded.map((u: {url: string}) => u.url)]);
      toast.success(`${uploaded.length} image(s) uploaded!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const createVariantsMutation = useMutation({
    mutationFn: async () => {
      const variantsToCreate = variants.map(v => ({
        ...v,
        images: sharedImages,
        featuredImageIndex,
        isActive: true,
      }));

      const { data } = await api.post(`/products/${product._id}/variants/bulk`, {
        variants: variantsToCreate,
      });
      return data;
    },
    onSuccess: () => {
      toast.success(`${variants.length} variants created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['variants', product._id] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create variants');
    },
  });

  const availableOptions = product.variantOptions || [];
  const varyingOption = availableOptions.find(opt => opt.name === varyingAttribute);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border-blue-200 dark:border-blue-900 overflow-hidden">
        {/* Header - Fixed */}
        <div className="p-6 border-b flex items-center justify-between bg-white dark:bg-gray-950">
          <div>
            <h2 className="text-2xl font-bold">Bulk Variant Creator</h2>
            <p className="text-sm text-muted-foreground">Create multiple variants at once with shared images</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50 dark:bg-gray-900/50">
          {/* Step 1: Base Attributes */}
          <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border-dashed border-2 border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-bold">1</span>
              Set Base Attributes (Optional)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select common attributes shared by all variants (e.g., Color: White)
            </p>
            <div className="grid grid-cols-2 gap-4">
              {availableOptions.map((option) => (
                <div key={option.name}>
                  <label className="block text-sm font-medium mb-2">{option.name}</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={baseAttributes[option.name] || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setBaseAttributes(prev => ({ ...prev, [option.name]: e.target.value }));
                      } else {
                        const { [option.name]: removed, ...rest } = baseAttributes;
                        setBaseAttributes(rest);
                      }
                    }}
                  >
                    <option value="" className="text-gray-500">-- Skip --</option>
                    {option.values.map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Upload Images */}
          <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border-dashed border-2 border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-bold">2</span>
              Upload Shared Images
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or WebP (MAX. 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                </label>
              </div>

              {sharedImages.length > 0 && (
                <div className="grid grid-cols-5 gap-3">
                  {sharedImages.map((url, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        featuredImageIndex === idx ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-800 hover:border-blue-300'
                      }`}
                      onClick={() => setFeaturedImageIndex(idx)}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {featuredImageIndex === idx && (
                        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white bg-blue-500 rounded-full p-1" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharedImages(prev => prev.filter((_, i) => i !== idx));
                          if (featuredImageIndex >= idx && featuredImageIndex > 0) {
                            setFeaturedImageIndex(prev => prev - 1);
                          }
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground text-center">
                Select an image above to set as featured (used for color selection thumbnails)
              </p>
            </div>
          </div>

          {/* Step 3: Select Varying Attribute */}
          <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border-dashed border-2 border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-bold">3</span>
              Choose Attribute to Vary
            </h3>
            <select
              className="w-full border rounded-md px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={varyingAttribute}
              onChange={(e) => {
                setVaryingAttribute(e.target.value);
                setSelectedValues(new Set());
              }}
            >
              <option value="" className="text-gray-500">-- Select Attribute --</option>
              {availableOptions
                .filter(opt => !baseAttributes[opt.name])
                .map((option) => (
                  <option key={option.name} value={option.name}>{option.name}</option>
                ))}
            </select>

            {varyingOption && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-3 text-muted-foreground">Select {varyingOption.name} values to generate variants:</p>
                <div className="flex flex-wrap gap-2">
                  {varyingOption.values.map((value) => {
                    const isSelected = selectedValues.has(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          const newSet = new Set(selectedValues);
                          if (isSelected) {
                            newSet.delete(value);
                          } else {
                            newSet.add(value);
                          }
                          setSelectedValues(newSet);
                        }}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-500/20 scale-105'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-900'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Pricing & Stock */}
          {variants.length > 0 && (
            <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border-dashed border-2 border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-bold">4</span>
                Set Pricing & Stock
              </h3>
              
              <div className="mb-6 flex gap-4 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => setPricingStrategy('same')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    pricingStrategy === 'same' 
                      ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Uniform Pricing
                </button>
                <button
                  type="button"
                  onClick={() => setPricingStrategy('individual')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    pricingStrategy === 'individual' 
                      ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Per-variant Pricing
                </button>
              </div>

              {pricingStrategy === 'same' && (
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <FormInput
                    type="number"
                    label="Uniform Selling Price (₹)"
                    value={sharedPrice}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value);
                      setSharedPrice(price);
                      setVariants(prev => prev.map(v => ({ ...v, price })));
                    }}
                  />
                  <FormInput
                    type="number"
                    label="Uniform MRP (₹)"
                    value={sharedComparePrice}
                    onChange={(e) => {
                      const comparePrice = parseFloat(e.target.value);
                      setSharedComparePrice(comparePrice);
                      setVariants(prev => prev.map(v => ({ ...v, compareAtPrice: comparePrice })));
                    }}
                  />
                </div>
              )}

              <div className="space-y-3 px-1">
                {variants.map((variant, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-950/50 border border-gray-100 dark:border-gray-800 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{variant.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate uppercase tracking-tighter opacity-70">{variant.sku}</p>
                    </div>
                    {pricingStrategy === 'individual' && (
                      <div className="flex gap-2">
                        <FormInput
                          type="number"
                          label="Price"
                          value={variant.price}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[idx].price = parseFloat(e.target.value);
                            setVariants(newVariants);
                          }}
                          className="w-28 text-xs"
                        />
                        <FormInput
                          type="number"
                          label="MRP"
                          value={variant.compareAtPrice}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[idx].compareAtPrice = parseFloat(e.target.value);
                            setVariants(newVariants);
                          }}
                          className="w-28 text-xs"
                        />
                      </div>
                    )}
                    <FormInput
                      type="number"
                      label="Stock"
                      value={variant.stock}
                      onChange={(e) => {
                        const newVariants = [...variants];
                        newVariants[idx].stock = parseInt(e.target.value);
                        setVariants(newVariants);
                      }}
                      className="w-24 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t bg-white dark:bg-gray-950 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {variants.length} Variant(s) ready
            </span>
            <span className="text-[10px] text-muted-foreground">
              {sharedImages.length} images will be shared
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => createVariantsMutation.mutate()}
              disabled={variants.length === 0 || sharedImages.length === 0 || createVariantsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
            >
              {createVariantsMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {createVariantsMutation.isPending ? 'Creating...' : `Create ${variants.length} Variants`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
