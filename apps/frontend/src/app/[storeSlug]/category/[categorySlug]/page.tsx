import { api } from '@/lib/api';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { FilterSidebar } from '@/components/shop/FilterSidebar';
import { Store, Product, CategoryWithChildren, Billboard } from '@repo/types';
import { HeroCarousel } from '@/components/home/HeroCarousel';

interface CategoryPageProps {
  params: Promise<{ 
    storeSlug: string;
    categorySlug: string;
  }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
  }>;
}

async function getCategoryData(storeSlug: string, categorySlug: string, page = 1) {
  try {
     const store = await api.get<Store>(`/stores/slug/${storeSlug}`);
     if (!store) throw new Error('Store not found');

     // Get category details to get ID
     const category = await api.get<CategoryWithChildren>(`/stores/${store._id}/categories/slug/${categorySlug}`);
     if (!category) throw new Error('Category not found');

     // Recursively collect all category IDs (current + all descendants)
     const getAllCategoryIds = (cat: CategoryWithChildren): string[] => {
       let ids = [cat._id];
       if (cat.children && cat.children.length > 0) {
         cat.children.forEach(child => {
           ids = ids.concat(getAllCategoryIds(child));
         });
       }
       return ids;
     };

     const allCategoryIds = getAllCategoryIds(category);

     // Fetch products for all these categories
     const [productsData, categories] = await Promise.all([
        // Fetch products from all category IDs in one query
        api.get<{ data: Product[], total: number }>(`/stores/${store._id}/products?page=${page}&limit=12`),
        api.get<CategoryWithChildren[]>(`/stores/${store._id}/categories/tree`),
     ]);

     // Filter products to only include those in the current category and its descendants
     const allProducts = Array.isArray(productsData?.data) ? productsData.data : [];
     const filteredProducts = allProducts.filter(product => 
       allCategoryIds.includes(product.categoryId)
     );
     
     return {
        store,
        category,
        products: filteredProducts,
        categories: Array.isArray(categories) ? categories : [],
        billboards: category.billboards || [],
     };

  } catch (error) {
     console.error('Error fetching category data:', error);
     return null;
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { storeSlug, categorySlug } = await params;
  const search = await searchParams;
  const page = Number(search.page) || 1;
  const data = await getCategoryData(storeSlug, categorySlug, page);

  if (!data) {
     return <div className="p-20 text-center">Category not found</div>;
  }

  const { store, category, products, categories, billboards } = data;

  return (
    <>
      {billboards.length > 0 && <HeroCarousel billboards={billboards} storeSlug={storeSlug} />}
      
      <div className="container mx-auto px-4 md:px-8 py-8">
        {/* Header - Only show title if no billboards, or keep it as breadcrumb/title */}
        <div className="mb-8">
           <h1 className="text-3xl font-black uppercase italic tracking-tight mb-2">
              {category.name}
           </h1>
           {category.description && (
             <p className="text-gray-500 max-w-2xl">{category.description}</p>
           )}
        </div>

        <div className="flex gap-8">
           {/* Sidebar */}
           <FilterSidebar 
              categories={categories} 
              storeSlug={store.slug}
              activeCategoryId={category.slug}
           />
           
           {/* Main Content */}
           <div className="flex-1">
              <div className="mb-6 flex justify-between items-center">
                 <span className="text-gray-500 text-sm">{products.length} Results</span>
                 <select className="bg-transparent text-sm font-medium border-none focus:ring-0 cursor-pointer">
                    <option>Sort By: Featured</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Newest</option>
                 </select>
              </div>
              
              <ProductGrid products={products} storeSlug={store.slug} />
           </div>
        </div>
      </div>
    </>
  );
}
