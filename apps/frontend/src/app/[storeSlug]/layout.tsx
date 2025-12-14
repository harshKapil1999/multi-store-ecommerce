import { use } from 'react';
import { StoreLayout } from '@/components/layout/StoreLayout';

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = use(params);
  return <StoreLayout storeSlug={storeSlug}>{children}</StoreLayout>;
}
