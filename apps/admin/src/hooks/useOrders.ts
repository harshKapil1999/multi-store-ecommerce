import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { Order, OrderFilters } from '@repo/types';
import { toast } from 'sonner';

export const ORDERS_QUERY_KEY = ['orders'];

/**
 * List all orders with optional filters
 */
export const useOrders = (storeId?: string, filters?: Partial<OrderFilters>) => {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, storeId, filters],
    queryFn: async () => {
      const endpoint = storeId ? `/orders/store/${storeId}` : `/orders`;
      const { data } = await apiClient.get(endpoint, { params: filters });
      return data;
    },
  });
};

/**
 * Get single order by ID
 */
export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, orderId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/${orderId}`);
      return data;
    },
    enabled: !!orderId,
  });
};

/**
 * Update order status
 */
export const useUpdateOrderStatus = (orderId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: string) => {
      const { data } = await apiClient.put(`/orders/${orderId}/status`, { status });
      return data;
    },
    onSuccess: (data) => {
      toast.success('Order status updated successfully!');
      queryClient.setQueryData([...ORDERS_QUERY_KEY, orderId], data);
      queryClient.invalidateQueries({
        queryKey: ORDERS_QUERY_KEY,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update order status';
      toast.error(message);
    },
  });
};
