import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { UploadedFile } from '@repo/types';

export const MEDIA_QUERY_KEY = ['media'];

interface PresignedUrlResponse {
  uploadUrl: string;
  mediaUrl: string;
  key: string;
  expiresIn: number;
}

interface ConfirmUploadResponse {
  url: string;
  key: string;
  filename: string;
}

/**
 * Get presigned URL for uploading file to R2
 */
export const useGetPresignedUrl = () => {
  return useMutation({
    mutationFn: async ({
      filename,
      contentType,
      size,
    }: {
      filename: string;
      contentType: string;
      size: number;
    }): Promise<PresignedUrlResponse> => {
      const { data } = await apiClient.post('/media/presigned-url', {
        filename,
        contentType,
        size,
      });
      return data.data;
    },
  });
};

/**
 * Confirm file upload and get permanent URL
 */
export const useConfirmUpload = () => {
  return useMutation({
    mutationFn: async (key: string): Promise<ConfirmUploadResponse> => {
      const { data } = await apiClient.post('/media/confirm', { key });
      return data.data;
    },
  });
};

/**
 * Delete media file from R2
 */
export const useDeleteMedia = () => {
  return useMutation({
    mutationFn: async (key: string) => {
      await apiClient.delete(`/media/${encodeURIComponent(key)}`);
    },
  });
};

/**
 * Upload file to R2 (presigned URL + confirmation)
 */
export const useUploadMedia = () => {
  const getPresignedUrl = useGetPresignedUrl();
  const confirmUpload = useConfirmUpload();

  return useMutation({
    mutationFn: async (file: File): Promise<ConfirmUploadResponse> => {
      // Step 1: Get presigned URL
      const { uploadUrl, key, mediaUrl } = await getPresignedUrl.mutateAsync({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });

      // Step 2: Upload file directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Step 3: Confirm upload with backend
      const confirmation = await confirmUpload.mutateAsync(key);

      return confirmation;
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });
};
