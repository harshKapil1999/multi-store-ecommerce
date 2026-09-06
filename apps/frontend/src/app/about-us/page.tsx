import { PolicyPage } from '@/components/policies/PolicyPage';
import { pageMetadata } from '@/lib/seo';
import { api } from '@/lib/api';
import type { Store } from '@repo/types';
export const metadata = pageMetadata('About Crabtile', 'About Crabtile for shopping with Crabtile in India.', '/about-us');
export default async function Page() {
  const result = await api.get<{ data: Store[] }>('/stores?limit=1');
  return <PolicyPage slug="about-us" settings={result.data[0]?.commerce} />;
}
