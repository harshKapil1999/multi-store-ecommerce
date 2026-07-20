'use client';

import { useState } from 'react';
import { Button, MediaUpload } from '@/components/index';
import { X, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Media } from '@repo/types';

interface MediaGalleryUploadProps {
  mediaGallery: Media[];
  onUpdate: (gallery: Media[]) => void;
}

export function MediaGalleryUpload({ mediaGallery, onUpdate }: MediaGalleryUploadProps) {
  const [isAdding, setIsAdding] = useState(false);
  const normalizeOrder = (items: Media[]) => items.map((item, index) => ({ ...item, order: index }));

  const handleAddMedia = (url: string) => {
    // Determine type from URL
    const isVideo = /\.(mp4|webm|mov|avi)$/i.test(url);
    const newMedia: Media = {
      url,
      type: isVideo ? 'video' : 'image',
      mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
      order: mediaGallery.length,
    };
    // Add new media without clearing isAdding so user can add more files
    onUpdate(normalizeOrder([...mediaGallery, newMedia]));
  };

  const handleRemove = (index: number) => {
    const updated = mediaGallery.filter((_, i) => i !== index);
    onUpdate(normalizeOrder(updated));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= mediaGallery.length) return;

    const updated = [...mediaGallery];
    [updated[index], updated[destination]] = [updated[destination], updated[index]];
    onUpdate(normalizeOrder(updated));
  };

  return (
    <div className="space-y-4">
      {/* Existing Gallery Items */}
      {mediaGallery.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {mediaGallery.map((media, index) => (
            <div key={`${media.url}-${index}`} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              {media.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <video 
                    src={media.url} 
                    className="w-full h-full object-cover"
                    controls
                  />
                </div>
              ) : (
                <img
                  src={media.url}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  className="rounded-full bg-black/75 p-1 text-white disabled:opacity-30"
                  aria-label={`Move media ${index + 1} earlier`}
                >
                  <ArrowLeft className="h-3 w-3" />
                </button>
                <span className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">{index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={index === mediaGallery.length - 1}
                  className="rounded-full bg-black/75 p-1 text-white disabled:opacity-30"
                  aria-label={`Move media ${index + 1} later`}
                >
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Media */}
      {isAdding ? (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">Upload Image or Video (You can add multiple files)</p>
          <MediaUpload
            onMediaUploaded={handleAddMedia}
            accept="image/*,video/*"
            maxSize={100}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
            Done Adding
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Image or Video
        </Button>
      )}
    </div>
  );
}
