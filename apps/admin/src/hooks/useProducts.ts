import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  UpdateStockInput,
  PaginatedResponse,
  ProductFilters,
} from '@repo/types';
import { toast } from 'sonner';

export const PRODUCTS_QUERY_KEY = ['products'];

/**
 * List products for a store with filters
 */
export const useProducts = (storeId: string, filters?: Partial<ProductFilters>) => {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, storeId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.minPrice && { minPrice: String(filters.minPrice) }),
        ...(filters?.maxPrice && { maxPrice: String(filters.maxPrice) }),
        ...(filters?.isFeatured !== undefined && { isFeatured: String(filters.isFeatured) }),
        ...(filters?.sortBy && { sortBy: filters.sortBy }),
        ...(filters?.sortOrder && { sortOrder: filters.sortOrder }),
      });
      const { data } = await apiClient.get(
        `/stores/${storeId}/products?${params}`
      );
      return data;
    },
    enabled: !!storeId,
  });
};

/**
 * Get single product by ID
 */
export const useProduct = (storeId: string, productId: string) => {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, storeId, productId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/stores/${storeId}/products/${productId}`);
      return data;
    },
    enabled: !!storeId && !!productId,
  });
};

/**
 * Get featured products
 */
export const useFeaturedProducts = (storeId: string, limit = 10) => {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, storeId, 'featured', limit],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/stores/${storeId}/products/featured?limit=${limit}`
      );
      return data;
    },
    enabled: !!storeId,
  });
};

/**
 * Create new product
 */
export const useCreateProduct = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const { data } = await apiClient.post(`/stores/${storeId}/products`, input);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Product created successfully!');
      queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, storeId],
      });
      queryClient.setQueryData([...PRODUCTS_QUERY_KEY, storeId, data._id], data);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create product';
      toast.error(message);
    },
  });
};

/**
 * Update product
 */
export const useUpdateProduct = (storeId: string, productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      const { data } = await apiClient.put(
        `/stores/${storeId}/products/${productId}`,
        input
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success('Product updated successfully!');
      queryClient.setQueryData([...PRODUCTS_QUERY_KEY, storeId, productId], data);
      queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, storeId],
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
    },
  });
};

/**
 * Update product stock
 */
export const useUpdateStock = (storeId: string, productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStockInput) => {
      const { data } = await apiClient.patch(
        `/stores/${storeId}/products/${productId}/stock`,
        input
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success('Stock updated successfully!');
      queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, storeId, productId],
      });
      queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, storeId],
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update stock';
      toast.error(message);
    },
  });
};

/**
 * Delete product
 */
export const useDeleteProduct = (storeId: string, productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/stores/${storeId}/products/${productId}`);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully!');
      queryClient.removeQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, storeId, productId],
      });
      queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, storeId],
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete product';
      toast.error(message);
    },
  });
};
