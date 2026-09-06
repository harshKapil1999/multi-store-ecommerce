import type { Metadata } from 'next';
import { cache } from 'react';
import type { Store } from '@repo/types';
import { api } from './api';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.crabtile.com').replace(/\/$/, '');
export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
export const plainText = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
export const getStore = cache((slug: string) => api.get<Store>(`/stores/slug/${encodeURIComponent(slug)}`));
export function pageMetadata(title: string, description: string, path: string, image?: string): Metadata {
  const url = absoluteUrl(path);
  return { title, description: plainText(description).slice(0, 180), alternates: { canonical: url },
    openGraph: { title, description: plainText(description).slice(0, 180), url, siteName: 'Crabtile', locale: 'en_IN', type: 'website', ...(image ? { images: [{ url: image, alt: title }] } : { images: [{ url: absoluteUrl('/opengraph-image'), alt: 'Crabtile' }] }) },
    twitter: { card: 'summary_large_image', title, description: plainText(description).slice(0, 180), images: [image || absoluteUrl('/opengraph-image')] },
  };
}
export const privateMetadata: Metadata = { robots: { index: false, follow: false }, alternates: { canonical: null } };
export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
