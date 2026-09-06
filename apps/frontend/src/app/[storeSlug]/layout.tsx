import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { getStore, pageMetadata } from '@/lib/seo';
import { api } from '@/lib/api';
import type { CategoryWithChildren } from '@repo/types';
export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const store = await getStore(storeSlug).catch(() => null);
  if (!store) return { title: 'Store not found', robots: { index: false } };
  return pageMetadata(store.seo?.title || `${store.name} | Crabtile`, store.seo?.description || store.description || `Shop ${store.name} at Crabtile. Explore available products, prices and delivery within India.`, `/${storeSlug}`, store.seo?.image || store.logo);
}
export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const store = await getStore(storeSlug).catch((error) => { if (error.status === 404 || error.status === 403) notFound(); throw error; });
  const categories = await api.get<CategoryWithChildren[]>(`/stores/${store._id}/categories/tree`);
  return <StoreLayout storeSlug={storeSlug} initialStore={store} initialCategories={categories}>{children}</StoreLayout>;
}
