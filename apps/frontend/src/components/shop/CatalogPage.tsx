import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Product, CategoryWithChildren, PaginatedResponse } from '@repo/types';
import { api } from '@/lib/api';
import { getStore } from '@/lib/seo';
import { ProductGrid } from './ProductGrid';
import { FilterSidebar } from './FilterSidebar';
import { CatalogControls } from './CatalogControls';
import { Pagination } from './Pagination';
import { HeroCarousel } from '@/components/home/HeroCarousel';
export type CatalogQuery = { page?: string; sort?: string; minPrice?: string; maxPrice?: string };
export async function CatalogPage({ storeSlug, categorySlug, query }: { storeSlug: string; categorySlug?: string; query: CatalogQuery }) {
  const store=await getStore(storeSlug);
  const category=categorySlug ? await api.get<CategoryWithChildren>(`/stores/${store._id}/categories/slug/${categorySlug}`).catch((error)=>{if(error.status===404)notFound();throw error}) : undefined;
  const page=Math.max(1,Math.floor(Number(query.page)||1));
  const sort = ({'price-asc':['sellingPrice','asc'],'price-desc':['sellingPrice','desc'],name:['name','asc']} as Record<string,string[]>)[query.sort||''] || ['createdAt','desc'];
  const params=new URLSearchParams({page:String(page),limit:'24',sortBy:sort[0],sortOrder:sort[1]});
  if(category)params.set('category',category._id);
  for(const key of ['minPrice','maxPrice'] as const)if(query[key]!==undefined && Number.isFinite(Number(query[key])) && Number(query[key])>=0)params.set(key,query[key]!);
  const [result,categories]=await Promise.all([api.get<PaginatedResponse<Product>>(`/stores/${store._id}/products?${params}`),api.get<CategoryWithChildren[]>(`/stores/${store._id}/categories/tree`)]);
  const path=`/${storeSlug}${categorySlug?`/category/${categorySlug}`:'/products'}`;
  return <>{category?.billboards?.length ? <HeroCarousel billboards={category.billboards} storeSlug={storeSlug}/> : null}<div className="mx-auto max-w-7xl px-5 py-10 md:px-8"><nav aria-label="Breadcrumb" className="mb-8 flex gap-2 text-sm text-gray-500"><Link href={`/${storeSlug}`}>{store.name}</Link><span>/</span><span>{category?.name || 'All products'}</span></nav><h1 className="text-4xl font-semibold tracking-tight">{category?.name || 'All products'}</h1>{category?.description && <p className="mt-4 max-w-2xl leading-7 text-gray-500">{category.description}</p>}<div className="mt-10 flex flex-col gap-8 lg:flex-row"><FilterSidebar categories={categories} storeSlug={storeSlug} activeCategoryId={category?.slug}/><div className="min-w-0 flex-1"><div className="mb-7 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-gray-500">{result.total} product{result.total===1?'':'s'}</p><CatalogControls/></div>{result.data.length ? <ProductGrid products={result.data} storeSlug={storeSlug}/> : <div className="rounded-xl bg-gray-50 px-6 py-16 text-center dark:bg-white/5"><h2 className="text-xl font-semibold">No products found</h2><p className="mt-2 text-sm text-gray-500">Try another collection or clear your filters.</p><Link href={`/${storeSlug}/products`} className="mt-6 inline-block underline">Browse all products</Link></div>}<Pagination page={page} totalPages={result.totalPages} basePath={path} query={query}/></div></div></div></>;
}
