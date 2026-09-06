'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
export function CatalogControls() {
  const pathname = usePathname(), router = useRouter(), search = useSearchParams();
  return <label className="flex items-center gap-3 text-sm">Sort by<select aria-label="Sort products" value={search.get('sort') || 'newest'} onChange={event=>{const query=new URLSearchParams(search.toString());query.set('sort',event.target.value);query.delete('page');router.push(`${pathname}?${query}`);}} className="rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-white/20"><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name: A–Z</option></select></label>;
}
