import { PolicyPage } from '@/components/policies/PolicyPage';
import { pageMetadata } from '@/lib/seo';
import { api } from '@/lib/api';
import type { Store } from '@repo/types';
export const metadata = pageMetadata('Terms & conditions', 'Terms & conditions for shopping with Crabtile in India.', '/terms-and-conditions');
export default async function Page() {
  const result = await api.get<{ data: Store[] }>('/stores?limit=1');
  return <PolicyPage slug="terms-and-conditions" settings={result.data[0]?.commerce} />;
}
