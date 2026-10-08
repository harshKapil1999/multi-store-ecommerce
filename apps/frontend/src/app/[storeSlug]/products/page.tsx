import { CatalogPage, type CatalogQuery } from '@/components/shop/CatalogPage';
import { getStore, pageMetadata } from '@/lib/seo';
type Props={params:Promise<{storeSlug:string}>;searchParams:Promise<CatalogQuery>};
export async function generateMetadata({params,searchParams}:Props){const {storeSlug}=await params;const store=await getStore(storeSlug);const query=await searchParams;return {...pageMetadata(`Shop ${store.name} | Crabtile`,store.description||`Browse products at ${store.name}.`,`/${storeSlug}/products${Number(query.page)>1?`?page=${Number(query.page)}`:''}`),...(query.sort||query.minPrice||query.maxPrice||query.packSize?{robots:{index:false,follow:true}}:{})};}
export default async function Page({params,searchParams}:Props){const {storeSlug}=await params;return <CatalogPage storeSlug={storeSlug} query={await searchParams}/>;}
