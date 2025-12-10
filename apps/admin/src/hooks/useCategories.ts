import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@repo/types';
import { toast } from 'sonner';

export const CATEGORIES_QUERY_KEY = ['categories'];

/**
 * List categories for a store
 */
export const useCategories = (storeId: string, featured?: boolean) => {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, storeId, { featured }],
    queryFn: async () => {
      const endpoint = featured
        ? `/stores/${storeId}/categories/featured`
        : `/stores/${storeId}/categories`;
      const { data } = await apiClient.get(endpoint);
      return data.data;
    },
    enabled: !!storeId,
  });
};

/**
 * Get single category by ID
 */
export const useCategory = (storeId: string, categoryId: string) => {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, storeId, categoryId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/stores/${storeId}/categories/${categoryId}`
      );
      return data;
    },
    enabled: !!storeId && !!categoryId,
  });
};

/**
 * Create new category
 */
export const useCreateCategory = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const { data } = await apiClient.post(`/stores/${storeId}/categories`, input);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Category created successfully!');
      queryClient.invalidateQueries({
        queryKey: [...CATEGORIES_QUERY_KEY, storeId],
      });
      queryClient.setQueryData([...CATEGORIES_QUERY_KEY, storeId, data._id], data);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create category';
      toast.error(message);
    },
  });
};

/**
 * Update category
 */
export const useUpdateCategory = (storeId: string, categoryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCategoryInput) => {
      const { data } = await apiClient.put(
        `/stores/${storeId}/categories/${categoryId}`,
        input
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success('Category updated successfully!');
      queryClient.setQueryData([...CATEGORIES_QUERY_KEY, storeId, categoryId], data);
      queryClient.invalidateQueries({
        queryKey: [...CATEGORIES_QUERY_KEY, storeId],
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update category';
      toast.error(message);
    },
  });
};

/**
 * Delete category
 */
export const useDeleteCategory = (storeId: string, categoryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/stores/${storeId}/categories/${categoryId}`);
    },
    onSuccess: () => {
      toast.success('Category deleted successfully!');
      queryClient.removeQueries({
        queryKey: [...CATEGORIES_QUERY_KEY, storeId, categoryId],
      });
      queryClient.invalidateQueries({
        queryKey: [...CATEGORIES_QUERY_KEY, storeId],
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete category';
      toast.error(message);
    },
  });
};
