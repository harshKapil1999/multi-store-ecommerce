'use client';

import { useState } from 'react';
import { useBillboards, useCreateBillboard, useDeleteBillboard } from '@/hooks/useBillboards';
import { useCategories } from '@/hooks/useCategories';
import { Button, Card, FormInput, MediaUpload, FormSelect } from '@/components/index';
import type { Billboard, CreateBillboardInput } from '@repo/types';
import { Plus, Trash2, GripVertical, Image as ImageIcon, Video } from 'lucide-react';

interface BillboardManagerProps {
  storeId: string;
}

export function BillboardManager({ storeId }: BillboardManagerProps) {
  const { data: billboards, isLoading } = useBillboards(storeId);
  // Removed useCategories hook as it's no longer needed here
  const createBillboard = useCreateBillboard(storeId);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateBillboardInput>>({
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: '',
    ctaLink: '',
    // categoryId: '', // Removed
    isActive: true,
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.imageUrl) return;
    
    await createBillboard.mutateAsync({
      ...formData as CreateBillboardInput,
       // categoryId is no longer passed
    });

    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      ctaText: '',
      ctaLink: '',
      isActive: true,
    });
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  // The API returns a pagination wrapper { data: Billboard[], total, ... }
  // Extract the actual array from the wrapper
  const billboardList = Array.isArray(billboards?.data) ? billboards.data : Array.isArray(billboards) ? billboards : [];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Billboards Library</h3>
          <p className="text-sm text-muted-foreground">
            Create billboards here, then assign them to your Store Home or Categories in their respective settings.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Billboard
        </Button>
      </div>

      {/* Existing Billboards */}
      {billboardList.length > 0 ? (
        <div className="space-y-3">
          {billboardList.map((billboard, index) => (
            <BillboardItem
              key={billboard._id}
              billboard={billboard}
              storeId={storeId}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No billboards yet</p>
          <p className="text-sm text-muted-foreground">Create your first billboard to get started</p>
        </div>
      )}

      {/* Add New Billboard Form */}
      {showForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h4 className="font-medium">New Billboard</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Title"
              placeholder="Summer Collection"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            {/* Category Select Removed */}
            <FormInput
              label="Subtitle"
              placeholder="Discover the latest trends"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
            <FormInput
              label="CTA Text"
              placeholder="Shop Now"
              value={formData.ctaText || ''}
              onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
            />
            <FormInput
              label="CTA Link"
              placeholder="/category/summer"
              value={formData.ctaLink || ''}
              onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Banner Image <span className="text-red-500">*</span>
            </label>
            <MediaUpload
              onMediaUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
              accept="image/*,video/*"
              maxSize={50}
            />
            {formData.imageUrl && (
              <div className="mt-2 relative h-32 w-full rounded overflow-hidden">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!formData.title || !formData.imageUrl || createBillboard.isPending}
            >
              {createBillboard.isPending ? 'Creating...' : 'Create Billboard'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function BillboardItem({ 
  billboard, 
  storeId, 
  index,
}: { 
  billboard: Billboard; 
  storeId: string; 
  index: number;
}) {
  const deleteBillboard = useDeleteBillboard(storeId, billboard._id);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this billboard? It will be removed from all carousels.')) return;
    setIsDeleting(true);
    await deleteBillboard.mutateAsync();
  };

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
      <div className="cursor-move text-muted-foreground">
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="w-20 h-14 rounded overflow-hidden bg-muted flex-shrink-0 relative">
        <img
          src={billboard.imageUrl}
          alt={billboard.title}
          className="w-full h-full object-cover"
        />
        {(billboard.imageUrl.endsWith('.mp4') || billboard.imageUrl.endsWith('.webm')) && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Video className="w-6 h-6 text-white" />
           </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
           <p className="font-medium truncate">{billboard.title}</p>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {billboard.subtitle || billboard.ctaText || 'No description'}
        </p>
      </div>

      <div className={`text-xs px-2 py-1 rounded ${billboard.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
        {billboard.isActive ? 'Active' : 'Inactive'}
      </div>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
