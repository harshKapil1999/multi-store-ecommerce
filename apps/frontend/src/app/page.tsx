import { api } from '@/lib/api';
import type { Store, Product } from '@repo/types';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, ShoppingBag, PackageCheck, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { POLICY_TITLES } from '@/lib/policies';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const result = await api.get<{ data: Store[] }>('/stores?limit=100');
  const stores = result.data;
  const featured = stores[0];
  const products = featured ? (await api.get<{data: Product[]}>(`/stores/${featured._id}/products?limit=4`)).data : [];
  return <main id="main-content" className="min-h-screen bg-[#f5f4ef] text-[#172b29] dark:bg-[#10211f] dark:text-[#f5f4ef]">
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-6 md:px-10">
      <Link href="/" className="text-2xl font-extrabold tracking-tight">crabtile<span className="text-[#78946b]">.</span></Link>
      <nav className="hidden items-center gap-8 text-sm md:flex"><a href="#collections">Collections</a><Link href="/about-us">Our story</Link><Link href="/contact">Customer care</Link></nav>
      <div className="flex items-center gap-3"><ThemeToggle /><a href="#collections" className="rounded-full border border-current/20 px-5 py-2.5 text-sm font-semibold">Explore <ArrowUpRight className="ml-1 inline h-4 w-4" /></a></div>
    </header>
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:px-10 md:pb-24 md:pt-16">
      <div><p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em]">A little discovery. An everyday favourite.</p><h1 className="max-w-xl text-6xl font-semibold leading-[1.02] tracking-[-0.055em] md:text-8xl">Find your<br />next <span className="font-serif italic text-[#6b8060] dark:text-[#b5cb9d]">favourite.</span></h1><p className="mt-7 max-w-md text-base leading-7 opacity-70">A fresh perspective on your everyday. Explore our collections, take a closer look, and find something that feels like you.</p><a href={featured ? `/${featured.slug}/products` : '#collections'} className="mt-9 inline-flex items-center gap-8 rounded-full bg-[#172b29] px-7 py-4 text-sm font-semibold text-white dark:bg-[#dbe5c8] dark:text-[#172b29]">Discover the collection <ArrowRight className="h-4 w-4" /></a><p className="mt-8 text-xs opacity-60">Based in Himachal Pradesh. Delivering across India.</p></div>
      <div className="relative grid grid-cols-2 gap-3 md:gap-4">
        {products.map((product,index) => <Link key={product._id} href={`/${featured.slug}/product/${product.slug}`} className={`group relative overflow-hidden rounded-2xl bg-[#e8e9e2] dark:bg-white/5 ${index % 2 ? 'translate-y-6' : ''}`}><div className="aspect-[4/5]"><img src={product.featuredImage} alt={product.name} loading={index < 2 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div><div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl bg-white/95 px-3 py-3 text-[#172b29]"><span className="text-xs font-semibold leading-4">{product.name}</span><ArrowUpRight className="h-4 w-4 shrink-0" /></div></Link>)}
        {!products.length && <div className="col-span-2 flex aspect-square items-center justify-center rounded-3xl bg-[#e4e9dc] text-[#78946b]"><ShoppingBag size={100} strokeWidth={1} /></div>}
      </div>
    </section>
    <section id="collections" className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20"><div className="mb-9 flex flex-wrap items-end justify-between gap-5 border-b border-current/15 pb-7"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">Explore Crabtile</p><h2 className="text-3xl font-semibold tracking-tight md:text-4xl">A collection for your next chapter.</h2></div><span className="text-sm opacity-60">Take a look around.</span></div>
      <div className={`grid gap-5 ${stores.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>{stores.map(store => <Link key={store._id} href={`/${store.slug}`} className="group flex flex-wrap items-center justify-between gap-8 rounded-2xl border border-current/10 bg-white/50 p-8 transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 md:p-10"><div className="flex items-center gap-7">{store.logo && <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-4"><img src={store.logo} alt="" className="max-h-full max-w-full object-contain" /></div>}<div><h3 className="text-2xl font-semibold">{store.name}</h3>{store.description && <p className="mt-2 max-w-lg text-sm leading-6 opacity-65">{store.description}</p>}</div></div><span className="inline-flex items-center gap-4 text-sm font-semibold">Explore store <ArrowUpRight className="h-6 w-6 transition group-hover:-translate-y-1 group-hover:translate-x-1" /></span></Link>)}</div>
      {!stores.length && <p className="py-12 text-center opacity-60">Our next collection is on its way. Check back soon.</p>}
    </section>
    <section className="bg-[#dfe6d4] dark:bg-white/5"><div className="mx-auto grid max-w-7xl gap-9 px-5 py-12 md:grid-cols-3 md:px-10">{[[ShoppingBag,'Make it yours','Explore product details, choose your options, and save your favourites.'],[PackageCheck,'Follow every step','Keep your order and delivery updates together in your account.'],[Mail,'A real point of contact','Product questions or an order to check? Our support team is an email away.']].map(([Icon,title,copy]: any)=><div key={title} className="flex gap-4"><Icon className="mt-1 h-6 w-6 shrink-0" strokeWidth={1.4}/><div><h3 className="font-semibold">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 opacity-65">{copy}</p></div></div>)}</div></section>
    <footer className="mx-auto max-w-7xl px-5 py-12 md:px-10"><div className="flex flex-col justify-between gap-8 md:flex-row"><div><Link href="/" className="text-2xl font-bold tracking-tight">crabtile.</Link><p className="mt-3 text-sm opacity-60">Himachal Pradesh, India</p><a className="mt-2 inline-block text-sm underline underline-offset-4" href="mailto:support@crabtile.com">support@crabtile.com</a></div><nav aria-label="Customer information" className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm opacity-75">{Object.entries(POLICY_TITLES).map(([slug,title])=><Link key={slug} href={`/${slug}`}>{title}</Link>)}</nav></div><div className="mt-10 border-t border-current/10 pt-6 text-xs opacity-50">© {new Date().getFullYear()} Crabtile. All rights reserved.</div></footer>
  </main>;
}
