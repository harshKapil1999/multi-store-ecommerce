import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { Store, CreateStoreRequest, UpdateStoreRequest, ApiResponse } from '@repo/types';
import { toast } from 'sonner';

const STORES_QUERY_KEY = ['stores'];

/**
 * List all stores with pagination
 */
export const useStores = (page = 1, limit = 20, search?: string) => {
  return useQuery({
    queryKey: [...STORES_QUERY_KEY, { page, limit, search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
      });
      const { data } = await apiClient.get(`/stores?${params}`);
      return data.data;
    },
    retry: 1,
    retryDelay: 1000,
  });
};

/**
 * Get single store by ID
 */
export const useStore = (id: string) => {
  return useQuery({
    queryKey: [...STORES_QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/stores/${id}`);
      return data;
    },
    enabled: !!id,
    retry: 1,
  });
};

/**
 * Get store by slug (for public access)
 */
export const useStoreBySlug = (slug: string) => {
  return useQuery({
    queryKey: [...STORES_QUERY_KEY, 'slug', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/stores/slug/${slug}`);
      return data;
    },
    enabled: !!slug,
    retry: 1,
  });
};

/**
 * Create new store
 */
export const useCreateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStoreRequest) => {
      const { data } = await apiClient.post('/stores', input);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Store created successfully!');
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
      queryClient.setQueryData([...STORES_QUERY_KEY, data._id], data);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create store';
      toast.error(message);
    },
  });
};

/**
 * Update store
 */
export const useUpdateStore = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStoreRequest) => {
      const { data } = await apiClient.put(`/stores/${id}`, input);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Store updated successfully!');
      queryClient.setQueryData([...STORES_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update store';
      toast.error(message);
    },
  });
};

/**
 * Delete store
 */
export const useDeleteStore = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/stores/${id}`);
    },
    onSuccess: () => {
      toast.success('Store deleted successfully!');
      queryClient.removeQueries({ queryKey: [...STORES_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete store';
      toast.error(message);
    },
  });
};

/**
 * Toggle store active status
 */
export const useToggleStore = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isActive?: boolean) => {
      const { data } = await apiClient.patch(`/stores/${id}/toggle`, {
        isActive,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Store ${data.isActive ? 'activated' : 'deactivated'} successfully!`);
      queryClient.setQueryData([...STORES_QUERY_KEY, id], data);
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to toggle store';
      toast.error(message);
    },
  });
};
