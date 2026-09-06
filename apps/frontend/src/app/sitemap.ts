import type { MetadataRoute } from 'next';
import type { Store, Product, CategoryWithChildren, Page, PaginatedResponse } from '@repo/types';
import { api } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import { POLICY_TITLES } from '@/lib/policies';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [{url:absoluteUrl('/')}];
  Object.keys(POLICY_TITLES).forEach(slug=>entries.push({url:absoluteUrl(`/${slug}`)}));
  let storePage=1,storePages=1;
  do {
    const stores=await api.get<PaginatedResponse<Store>>(`/stores?limit=100&page=${storePage}`);storePages=stores.totalPages;
    for(const store of stores.data){
      entries.push({url:absoluteUrl(`/${store.slug}`),lastModified:store.updatedAt},{url:absoluteUrl(`/${store.slug}/products`)});
      const [categories,pages]=await Promise.all([api.get<CategoryWithChildren[]>(`/stores/${store._id}/categories/tree`),api.get<Page[]>(`/stores/${store._id}/pages`)]);
      const visit=(items:CategoryWithChildren[])=>items.forEach(category=>{entries.push({url:absoluteUrl(`/${store.slug}/category/${category.slug}`),lastModified:category.updatedAt});visit(category.children||[])});visit(categories);
      const pageSlugs=new Set<string>();pages.forEach(page=>{pageSlugs.add(page.slug);entries.push({url:absoluteUrl(`/${store.slug}/${page.slug}`),lastModified:page.updatedAt})});
      Object.keys(POLICY_TITLES).filter(slug=>!pageSlugs.has(slug)).forEach(slug=>entries.push({url:absoluteUrl(`/${store.slug}/${slug}`)}));
      let productPage=1,productPages=1;
      do{const products=await api.get<PaginatedResponse<Product>>(`/stores/${store._id}/products?limit=100&page=${productPage}`);productPages=products.totalPages;products.data.forEach(product=>entries.push({url:absoluteUrl(`/${store.slug}/product/${product.slug}`),lastModified:product.updatedAt,images:[product.featuredImage]}));productPage++;}while(productPage<=productPages);
    }
    storePage++;
  }while(storePage<=storePages);
  return entries;
}
