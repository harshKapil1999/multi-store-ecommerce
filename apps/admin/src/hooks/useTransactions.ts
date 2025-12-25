import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { Transaction } from '@repo/types';

export const TRANSACTIONS_QUERY_KEY = ['transactions'];

/**
 * List all transactions with optional filters
 */
export const useTransactions = (storeId?: string) => {
    return useQuery({
        queryKey: [...TRANSACTIONS_QUERY_KEY, storeId],
        queryFn: async () => {
            const endpoint = storeId ? `/transactions/store/${storeId}` : `/transactions`;
            const { data } = await apiClient.get(endpoint);
            // API returns { success: true, data: { data: [], total: ... } }
            // We want to return the array of transactions, or the full object if we handle pagination later
            // For now, let's match what the view expects (an array) by returning data.data.data
            // However, the component expects 'data' to be the array.
            // Let's modify the component to handle the pagination object, OR return just the array here.
            // Given the existing code in page.tsx treats 'data' as Transaction[], we return just the array.
            return data.data.data;
        },
        enabled: !!storeId,
    });
};

/**
 * Get single transaction by ID
 */
export const useTransaction = (transactionId: string) => {
    return useQuery({
        queryKey: [...TRANSACTIONS_QUERY_KEY, transactionId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/transactions/${transactionId}`);
            return data;
        },
        enabled: !!transactionId,
    });
};
