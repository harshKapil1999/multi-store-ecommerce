import Link from 'next/link';
import type { CommerceSettings } from '@repo/types';
import { POLICY_TITLES, policySections } from '@/lib/policies';
export function PolicyPage({ slug, settings, storeSlug }: { slug: string; settings?: Partial<CommerceSettings>; storeSlug?: string }) {
  return <article className="mx-auto max-w-4xl px-5 py-14 md:py-20">
    <Link href={storeSlug ? `/${storeSlug}` : '/'} className="text-sm text-gray-500 hover:underline">Crabtile / Customer care</Link>
    <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">{POLICY_TITLES[slug]}</h1>
    <p className="mt-4 text-sm text-gray-500">Last updated: 5 September 2026</p>
    <div className="mt-12 space-y-9">{policySections(slug, settings).map(section => <section key={section.title}><h2 className="mb-3 text-xl font-semibold">{section.title}</h2><p className="whitespace-pre-line text-base leading-8 text-gray-600 dark:text-gray-300">{section.text}</p></section>)}</div>
    <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-gray-200 pt-8 text-sm dark:border-white/10">{Object.entries(POLICY_TITLES).filter(([key]) => key !== slug).map(([key, title]) => <Link className="underline underline-offset-4" key={key} href={`${storeSlug ? `/${storeSlug}` : ''}/${key}`}>{title}</Link>)}</div>
    <a className="mt-8 inline-block rounded-full bg-black px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black" href={`mailto:${settings?.supportEmail || 'support@crabtile.com'}`}>Contact support</a>
  </article>;
}
