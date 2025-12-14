import { api } from '@/lib/api';
import { ImageGallery } from '@/components/product/ImageGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { Store, Product, Category } from '@repo/types';

interface ProductPageProps {
  params: Promise<{
    storeSlug: string;
    productSlug: string;
  }>;
}

async function getProductData(storeSlug: string, productSlug: string) {
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

     return {
        store,
        product,
        categoryName,
        relatedProducts: (Array.isArray(relatedResponse?.data) ? relatedResponse.data : []).filter(p => p._id !== product._id),
     };

  } catch (error) {
     console.error('Error fetching product:', error);
     return null;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { storeSlug, productSlug } = await params;
  const data = await getProductData(storeSlug, productSlug);

  if (!data) {
    return <div className="p-20 text-center">Product not found</div>;
  }

  const { product, categoryName, relatedProducts } = data;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-12">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <ImageGallery 
            featuredImage={product.featuredImage} 
            mediaGallery={product.mediaGallery} 
          />
          <ProductInfo product={product} categoryName={categoryName} />
       </div>
       
       <RelatedProducts products={relatedProducts} />
    </div>
  );
}
