'use client';

import { useState, useRef } from 'react';
import {
  useGetPresignedUrl,
  useConfirmUpload,
  useDeleteMedia,
} from '@/hooks/useMedia';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface MediaUploadProps {
  onMediaUploaded?: (mediaUrl: string, mediaKey: string) => void;
  maxSize?: number; // in MB
  accept?: string;
  className?: string;
}

export function MediaUpload({
  onMediaUploaded,
  maxSize = 50,
  accept = 'image/*,video/*',
  className = '',
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedMedias, setUploadedMedias] = useState<
    Array<{ url: string; key: string; name: string; type: string; error?: string }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: getPresignedUrl } = useGetPresignedUrl();
  const { mutate: confirmUpload } = useConfirmUpload();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Allow all file types - no type restriction
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadedMedias((prev) => [
        ...prev,
        {
          url: '',
          key: '',
          name: file.name,
          type: file.type,
          error,
        },
      ]);
      return;
    }

    setIsUploading(true);

    try {
      // Get presigned URL
      await new Promise<string>((resolve, reject) => {
        getPresignedUrl(
          {
            filename: file.name,
            contentType: file.type,
            size: file.size,
          },
          {
            onSuccess: async (data: any) => {
              try {
                // Upload to presigned URL
                const uploadResponse = await fetch(data.uploadUrl, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': file.type,
                  },
                  body: file,
                });

                if (!uploadResponse.ok) {
                  throw new Error('Failed to upload file');
                }

                // Confirm upload
                confirmUpload(data.key, {
                  onSuccess: (confirmData: any) => {
                    const mediaItem = {
                      url: confirmData.url,
                      key: data.key,
                      name: file.name,
                      type: file.type,
                    };
                    setUploadedMedias((prev) => [...prev, mediaItem]);
                    onMediaUploaded?.(confirmData.url, data.key);
                    resolve(confirmData.url);
                  },
                  onError: (error: any) => {
                    reject(
                      new Error(error.message || 'Failed to confirm upload')
                    );
                  },
                });
              } catch (err) {
                reject(err);
              }
            },
            onError: (error: any) => {
              reject(new Error(error.message || 'Failed to get presigned URL'));
            },
          }
        );
      });
    } catch (err: any) {
      setUploadedMedias((prev) => [
        ...prev,
        {
          url: '',
          key: '',
          name: file.name,
          type: file.type,
          error: err.message || 'Upload failed',
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (key: string) => {
    setUploadedMedias((prev) => prev.filter((m) => m.key !== key));
  };

  return (
    <div className={className}>
      <Card
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className="h-12 w-12 text-muted-foreground" />
          </div>

          <div>
            <p className="text-lg font-semibold">Drag and drop files here</p>
            <p className="text-sm text-muted-foreground">
              or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline"
              >
                click to browse
              </button>
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            All file formats supported • Max {maxSize}MB
          </p>

          {isUploading && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          )}
        </div>
      </Card>

      {uploadedMedias.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-4 font-semibold">Uploaded Media</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {uploadedMedias.map((media, idx) => (
              <div key={`${media.key}-${idx}`} className="relative">
                {media.error ? (
                  <Card className="relative h-24 flex items-center justify-center bg-red-50 border-red-200">
                    <div className="text-center">
                      <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-red-600 line-clamp-2">
                        {media.error}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMedia(media.key || `error-${idx}`)}
                      className="absolute top-1 right-1 p-1 hover:bg-red-200 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Card>
                ) : media.url ? (
                  <Card className="relative h-24 overflow-hidden bg-muted">
                    {media.type.startsWith('image/') ? (
                      <Image
                        src={media.url}
                        alt={media.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video src={media.url} className="w-full h-full object-cover" controls />
                    )}
                    <button
                      onClick={() => removeMedia(media.key)}
                      className="absolute top-1 right-1 p-1 bg-background hover:bg-destructive rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-1 right-1">
                      <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                    </div>
                  </Card>
                ) : (
                  <Card className="relative h-24 flex items-center justify-center bg-muted">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </Card>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
