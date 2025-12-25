import { api } from '@/lib/api';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { ProductSpotlight } from '@/components/home/ProductSpotlight';
import { Billboard, Product, CategoryWithChildren, Store } from '@repo/types';

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

async function getStoreData(slug: string) {
  try {
    const store = await api.get<Store>(`/stores/slug/${slug}`);
    if (!store) throw new Error('Store not found');

    const [productsResponse, categories] = await Promise.all([
      api.get<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }>(`/stores/${store._id}/products?isFeatured=true&limit=10`),
      api.get<CategoryWithChildren[]>(`/stores/${store._id}/categories/tree`),
    ]);

    // Extract products array from pagination response
    const products = Array.isArray(productsResponse?.data) ? productsResponse.data : [];

    return {
      store,
      billboards: store.homeBillboards || [],
      products,
      categories: Array.isArray(categories) ? categories : [],
    };
  } catch (error) {
    console.error('Error fetching store data:', error);
    return null;
  }
}

export default async function StorePage({ params }: PageProps) {
  const { storeSlug } = await params;
  const data = await getStoreData(storeSlug);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Store Not Found</h1>
          <p className="text-gray-500">The store you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const { billboards, products, categories } = data;

  return (
    <>
      <HeroCarousel billboards={billboards} storeSlug={storeSlug} />
      
      <div className="space-y-12 pb-20">
        <FeaturedCategories categories={categories} storeSlug={storeSlug} />
        
        <ProductSpotlight 
          title="Trending This Week" 
          products={products} 
          storeSlug={storeSlug}
        />
        
        {/* Additional sections can be added here */}
        <section className="container mx-auto px-4 md:px-8 py-12">
           <div className="bg-gray-100 dark:bg-zinc-900 rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Join the Club</h2>
              <p className="max-w-xl mx-auto mb-8 text-gray-500">
                Sign up for our newsletter to get the latest updates, exclusive offers, and more.
              </p>
              <div className="max-w-md mx-auto flex gap-4">
                 <input 
                   type="email" 
                   placeholder="Enter your email" 
                   className="flex-1 px-4 py-3 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-black"
                 />
                 <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity">
                   Sign Up
                 </button>
              </div>
           </div>
        </section>
      </div>
    </>
  );
}
