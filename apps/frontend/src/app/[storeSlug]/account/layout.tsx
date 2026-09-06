import { privateMetadata } from '@/lib/seo';
export const metadata = privateMetadata;
import { AccountShell } from '@/components/account/AccountShell';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
