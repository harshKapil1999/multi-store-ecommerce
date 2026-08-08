import { useQuery } from '@tanstack/react-query';
import type { CustomerDetail, CustomerSummary, PaginatedResponse } from '@repo/types';
import { apiClient } from '../lib/api-client';

export const CUSTOMERS_QUERY_KEY = ['customers'];

export const useCustomers = (
  storeId?: string,
  filters: { page?: number; limit?: number; search?: string } = {}
) =>
  useQuery<PaginatedResponse<CustomerSummary>>({
    queryKey: [...CUSTOMERS_QUERY_KEY, storeId, filters],
    queryFn: async () => {
      const { data } = await apiClient.get(`/stores/${storeId}/customers`, { params: filters });
      return data.data;
    },
    enabled: !!storeId,
  });

export const useCustomer = (storeId?: string, email?: string) =>
  useQuery<CustomerDetail>({
    queryKey: [...CUSTOMERS_QUERY_KEY, storeId, email],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/stores/${storeId}/customers/${encodeURIComponent(email || '')}`
      );
      return data.data;
    },
    enabled: !!storeId && !!email,
  });
