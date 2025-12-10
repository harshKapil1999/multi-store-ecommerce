import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  Page,
  CreatePageInput,
  UpdatePageInput,
  AddPageSectionInput,
  UpdatePageSectionInput,
} from '@repo/types';
import { toast } from 'sonner';

export const PAGES_QUERY_KEY = ['pages'];

/**
 * List all pages for a store
 */
export const usePages = (storeId: string, published?: boolean) => {
  return useQuery({
    queryKey: [...PAGES_QUERY_KEY, storeId, { published }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (published !== undefined) {
        params.append('published', String(published));
      }
      const { data } = await apiClient.get(`/stores/${storeId}/pages?${params}`);
      return data;
    },
    enabled: !!storeId,
  });
};

/**
 * Get single page by ID
 */
export const usePage = (storeId: string, pageId: string) => {
  return useQuery({
    queryKey: [...PAGES_QUERY_KEY, storeId, pageId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/stores/${storeId}/pages/${pageId}`);
      return data;
    },
    enabled: !!storeId && !!pageId,
  });
};

/**
 * Get page by slug
 */
export const usePageBySlug = (storeId: string, slug: string) => {
  return useQuery({
    queryKey: [...PAGES_QUERY_KEY, storeId, 'slug', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/stores/${storeId}/pages/slug/${slug}`);
      return data;
    },
    enabled: !!storeId && !!slug,
  });
};

/**
 * Get home page
 */
export const useHomePage = (storeId: string) => {
  return useQuery({
    queryKey: [...PAGES_QUERY_KEY, storeId, 'home'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/stores/${storeId}/pages/home`);
      return data;
    },
    enabled: !!storeId,
  });
};

/**
 * Create new page
 */
export const useCreatePage = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePageInput) => {
      const { data } = await apiClient.post(`/stores/${storeId}/pages`, input);
      return data;
    },
    onSuccess: () => {
      toast.success('Page created successfully!');
      queryClient.invalidateQueries({ queryKey: [...PAGES_QUERY_KEY, storeId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create page';
      toast.error(message);
    },
  });
};

/**
 * Update page
 */
export const useUpdatePage = (storeId: string, pageId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePageInput) => {
      const { data } = await apiClient.put(`/stores/${storeId}/pages/${pageId}`, input);
      return data;
    },
    onSuccess: () => {
      toast.success('Page updated successfully!');
      queryClient.invalidateQueries({ queryKey: [...PAGES_QUERY_KEY, storeId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update page';
      toast.error(message);
    },
  });
};

/**
 * Delete page
 */
export const useDeletePage = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const { data } = await apiClient.delete(`/stores/${storeId}/pages/${pageId}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Page deleted successfully!');
      queryClient.invalidateQueries({ queryKey: [...PAGES_QUERY_KEY, storeId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete page';
      toast.error(message);
    },
  });
};

/**
 * Toggle page publish status
 */
export const useTogglePublish = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const { data } = await apiClient.patch(`/stores/${storeId}/pages/${pageId}/publish`);
      return data;
    },
    onSuccess: (data) => {
      const status = data.data.isPublished ? 'published' : 'unpublished';
      toast.success(`Page ${status} successfully!`);
      queryClient.invalidateQueries({ queryKey: [...PAGES_QUERY_KEY, storeId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to toggle publish status';
      toast.error(message);
    },
  });
};

/**
 * Add section to page
 */
export const useAddSection = (storeId: string, pageId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddPageSectionInput) => {
      const { data } = await apiClient.post(`/stores/${storeId}/pages/${pageId}/sections`, input);
      return data;
    },
    onSuccess: () => {
      toast.success('Section added successfully!');
      queryClient.invalidateQueries({ queryKey: [...PAGES_QUERY_KEY, storeId, pageId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to add section';
      toast.error(message);
    },
  });
};

/**
 * Update section
 */
export const useUpdateSection = (storeId: string, pageId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, ...input }: { sectionId: string } & Partial<UpdatePageSectionInput>) => {
      const { data } = await apiClient.put(
        `/stores/${storeId}/pages/${pageId}/sections/${sectionId}`,
        input
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Section updated successfully!');
      queryClient.invalidateQueries({ queryKey: [...PAGES_QUERY_KEY, storeId, pageId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update section';
      toast.error(message);
    },
  });
};

/**
 * Delete section
 */
export const useDeleteSection = (storeId: string, pageId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionId: string) => {
      const { data } = await apiClient.delete(
        `/stores/${storeId}/pages/${pageId}/sections/${sectionId}`
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Section deleted successfully!');
      queryClient.invalidateQueries({ queryKey: [...PAGES_QUERY_KEY, storeId, pageId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete section';
      toast.error(message);
    },
  });
};

/**
 * Reorder sections
 */
export const useReorderSections = (storeId: string, pageId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionIds: string[]) => {
      const { data } = await apiClient.post(
        `/stores/${storeId}/pages/${pageId}/sections/reorder`,
        { sectionIds }
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Sections reordered successfully!');
      queryClient.invalidateQueries({ queryKey: [...PAGES_QUERY_KEY, storeId, pageId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reorder sections';
      toast.error(message);
    },
  });
};
