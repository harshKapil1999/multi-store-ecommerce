import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getStore, pageMetadata, absoluteUrl, plainText, jsonLd } from '@/lib/seo';
import { api } from '@/lib/api';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { ProductView } from '@/components/product/ProductView';
import { Store, Product, Category, ProductVariant } from '@repo/types';

interface ProductPageProps {
  params: Promise<{
    storeSlug: string;
    productSlug: string;
  }>;
}

const getProductData = cache(async (storeSlug: string, productSlug: string) => {
  try {
     const store = await api.get<Store>(`/stores/slug/${storeSlug}`);
     if (!store) throw new Error('Store not found');

     const product = await api.get<Product>(`/stores/${store._id}/products/slug/${productSlug}`);
     if (!product) throw new Error('Product not found');

     // Fetch category for display name
     let categoryName = '';
     if (product.categoryId) {
       try {
         const category = await api.get<Category>(`/stores/${store._id}/categories/${product.categoryId}`);
         categoryName = category?.name || '';
       } catch {
         // Category fetch failed, continue without name
       }
     }

     // Fetch related products (e.g., same category)
     const relatedResponse = await api.get<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }>(`/stores/${store._id}/products?category=${product.categoryId}&limit=10`);

     // Fetch variants if product has them
     let variants: ProductVariant[] = [];
     if (product.hasVariants) {
       try {
         const variantsResponse = await api.get<ProductVariant[]>(`/products/${product._id}/variants`);
         if (Array.isArray(variantsResponse)) {
           variants = variantsResponse;
         }
       } catch (error) {
         console.error('Error fetching variants:', error);
       }
     }

     return {
        store,
        product,
        variants,
        categoryName,
        relatedProducts: (Array.isArray(relatedResponse?.data) ? relatedResponse.data : []).filter(p => p._id !== product._id),
     };

  } catch (error) {
     console.error('Error fetching product:', error);
     return null;
  }
});

export async function generateMetadata({ params }: ProductPageProps) {
  const { storeSlug, productSlug } = await params;
  const data = await getProductData(storeSlug, productSlug);
  if (!data) return { title: 'Product not found', robots: { index: false } };
  return pageMetadata(`${data.product.name} | Crabtile`, data.product.description, `/${storeSlug}/product/${productSlug}`, data.product.featuredImage);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { storeSlug, productSlug } = await params;
  const data = await getProductData(storeSlug, productSlug);

  if (!data) notFound();

   const { product, variants, categoryName, relatedProducts } = data;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-12">
       <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap gap-2 text-sm text-gray-500"><Link href="/">Crabtile</Link><span>/</span><Link href={`/${storeSlug}`}>{data.store.name}</Link><span>/</span><span>{product.name}</span></nav>
       <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
         '@context': 'https://schema.org', '@type': 'Product', name: product.name,
         description: plainText(product.description), image: [product.featuredImage, ...(product.mediaGallery || []).filter(media => media.type === 'image').map(media => media.url)],
         ...(product.sku ? { sku: product.sku } : {}),
         offers: product.hasVariants && variants.length ? variants.map(variant => ({ '@type': 'Offer', sku: variant.sku, name: variant.name, url: absoluteUrl(`/${storeSlug}/product/${productSlug}`), price: variant.price, priceCurrency: 'INR', availability: variant.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@type': 'Organization', name: 'Crabtile' } })) : { '@type': 'Offer', url: absoluteUrl(`/${storeSlug}/product/${productSlug}`), price: product.sellingPrice, priceCurrency: 'INR', availability: !product.hasVariants && product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@type': 'Organization', name: 'Crabtile' } },
       }) }} />
       <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Crabtile', item: absoluteUrl('/') }, { '@type': 'ListItem', position: 2, name: data.store.name, item: absoluteUrl(`/${storeSlug}`) }, { '@type': 'ListItem', position: 3, name: product.name, item: absoluteUrl(`/${storeSlug}/product/${productSlug}`) }] }) }} />
       <ProductView 
         product={product} 
         variants={variants} 
         categoryName={categoryName} 
       />
       
       <RelatedProducts products={relatedProducts} storeSlug={storeSlug} />
    </div>
  );
}
