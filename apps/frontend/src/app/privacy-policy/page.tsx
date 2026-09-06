import { PolicyPage } from '@/components/policies/PolicyPage';
import { pageMetadata } from '@/lib/seo';
import { api } from '@/lib/api';
import type { Store } from '@repo/types';
export const metadata = pageMetadata('Privacy policy', 'Privacy policy for shopping with Crabtile in India.', '/privacy-policy');
export default async function Page() {
  const result = await api.get<{ data: Store[] }>('/stores?limit=1');
  return <PolicyPage slug="privacy-policy" settings={result.data[0]?.commerce} />;
}
