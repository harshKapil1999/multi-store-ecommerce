import { PolicyPage } from '@/components/policies/PolicyPage';
import { pageMetadata } from '@/lib/seo';
import { api } from '@/lib/api';
import type { Store } from '@repo/types';
export const metadata = pageMetadata('Returns & refunds', 'Returns & refunds for shopping with Crabtile in India.', '/returns-refunds');
export default async function Page() {
  const result = await api.get<{ data: Store[] }>('/stores?limit=1');
  return <PolicyPage slug="returns-refunds" settings={result.data[0]?.commerce} />;
}
