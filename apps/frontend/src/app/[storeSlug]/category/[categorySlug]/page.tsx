import { CatalogPage, type CatalogQuery } from '@/components/shop/CatalogPage';
import { getStore, pageMetadata } from '@/lib/seo';
import { api } from '@/lib/api';
import type { Category } from '@repo/types';
type Props={params:Promise<{storeSlug:string;categorySlug:string}>;searchParams:Promise<CatalogQuery>};
export async function generateMetadata({params,searchParams}:Props){const {storeSlug,categorySlug}=await params;const store=await getStore(storeSlug);const category=await api.get<Category>(`/stores/${store._id}/categories/slug/${categorySlug}`).catch(()=>null);const query=await searchParams;if(!category)return {title:'Category not found',robots:{index:false}};return {...pageMetadata(`${category.name} | ${store.name} | Crabtile`,category.description||`Shop ${category.name} at Crabtile.`,`/${storeSlug}/category/${categorySlug}${Number(query.page)>1?`?page=${Number(query.page)}`:''}`,category.imageUrl),...(query.sort||query.minPrice||query.maxPrice?{robots:{index:false,follow:true}}:{})};}
export default async function Page({params,searchParams}:Props){const {storeSlug,categorySlug}=await params;return <CatalogPage storeSlug={storeSlug} categorySlug={categorySlug} query={await searchParams}/>;}
