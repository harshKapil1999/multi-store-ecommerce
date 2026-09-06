import { SITE_URL, pageMetadata, jsonLd } from '@/lib/seo';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMetadata('Crabtile | Find your next everyday favourite', 'Explore collections at Crabtile. Shop online with delivery across India, secure payments and order tracking.', '/'),
  title: { default: 'Crabtile | Shop online in India', template: '%s' },
  applicationName: 'Crabtile', robots: { index: true, follow: true },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-white focus:p-4 focus:text-black">Skip to content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ '@context': 'https://schema.org', '@type': 'Organization', name: 'Crabtile', url: SITE_URL, email: 'support@crabtile.com', address: { '@type': 'PostalAddress', addressRegion: 'Himachal Pradesh', addressCountry: 'IN' } }) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
