import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { Billboard, CreateBillboardInput, UpdateBillboardInput } from '@repo/types';

export const BILLBOARDS_QUERY_KEY = ['billboards'];

/**
 * List billboards for a store
 */
export const useBillboards = (storeId: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...BILLBOARDS_QUERY_KEY, storeId, { page, limit }],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/stores/${storeId}/billboards?page=${page}&limit=${limit}`
      );
      return data.data;
    },
    enabled: !!storeId,
  });
};

/**
 * Get single billboard by ID
 */
export const useBillboard = (storeId: string, billboardId: string) => {
  return useQuery({
    queryKey: [...BILLBOARDS_QUERY_KEY, storeId, billboardId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/stores/${storeId}/billboards/${billboardId}`
      );
      return data;
    },
    enabled: !!storeId && !!billboardId,
  });
};

/**
 * Create new billboard
 */
export const useCreateBillboard = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBillboardInput) => {
      const { data } = await apiClient.post(`/stores/${storeId}/billboards`, input);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...BILLBOARDS_QUERY_KEY, storeId],
      });
      queryClient.setQueryData([...BILLBOARDS_QUERY_KEY, storeId, data._id], data);
    },
  });
};

/**
 * Update billboard
 */
export const useUpdateBillboard = (storeId: string, billboardId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBillboardInput) => {
      const { data } = await apiClient.put(
        `/stores/${storeId}/billboards/${billboardId}`,
        input
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...BILLBOARDS_QUERY_KEY, storeId, billboardId], data);
      queryClient.invalidateQueries({
        queryKey: [...BILLBOARDS_QUERY_KEY, storeId],
      });
    },
  });
};

/**
 * Delete billboard
 */
export const useDeleteBillboard = (storeId: string, billboardId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/stores/${storeId}/billboards/${billboardId}`);
    },
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: [...BILLBOARDS_QUERY_KEY, storeId, billboardId],
      });
      queryClient.invalidateQueries({
        queryKey: [...BILLBOARDS_QUERY_KEY, storeId],
      });
    },
  });
};

/**
 * Reorder billboards
 */
export const useReorderBillboards = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (billboards: Array<{ id: string; order: number }>) => {
      const { data } = await apiClient.patch(
        `/stores/${storeId}/billboards/order/update`,
        { billboards }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...BILLBOARDS_QUERY_KEY, storeId],
      });
    },
  });
};
