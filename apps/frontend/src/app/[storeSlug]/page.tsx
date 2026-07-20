import { api } from '@/lib/api';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { ProductSpotlight } from '@/components/home/ProductSpotlight';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { DEFAULT_HOME_SECTIONS, Product, CategoryWithChildren, Store, HomeSectionConfig } from '@repo/types';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getStoreData(slug: string) {
  try {
    const store = await api.get<Store>(`/stores/slug/${slug}`);
    if (!store) throw new Error('Store not found');

    const [productsResponse, categories] = await Promise.all([
      api.get<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }>(`/stores/${store._id}/products?limit=100&sortBy=createdAt&sortOrder=desc`),
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

function flattenCategories(categories: CategoryWithChildren[]): CategoryWithChildren[] {
  return categories.flatMap((category) => [
    category,
    ...(category.children ? flattenCategories(category.children) : []),
  ]);
}

function selectConfiguredItems<T extends { _id: string }>(items: T[], ids: string[] | undefined, fallback: T[], limit: number) {
  if (ids?.length) {
    const itemMap = new Map(items.map((item) => [item._id, item]));
    return ids.map((id) => itemMap.get(id)).filter((item): item is T => Boolean(item)).slice(0, limit);
  }
  return fallback.slice(0, limit);
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

  const { store, billboards, products, categories } = data;
  const allCategories = flattenCategories(categories);
  const categoryTiles = allCategories.slice(0, 6);
  const spotlightProducts = products.slice(0, 8);
  const configuredSections: HomeSectionConfig[] = (store.homeSections?.length ? store.homeSections : DEFAULT_HOME_SECTIONS)
    .filter((section) => section.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {billboards.length > 0 ? (
        <HeroCarousel billboards={billboards} storeSlug={storeSlug} />
      ) : (
        <section className="bg-white px-4 py-12 dark:bg-black md:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                <Sparkles className="h-4 w-4" />
                New season storefront
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-gray-950 dark:text-white md:text-7xl">
                {store.name}
              </h1>
              {store.description && (
                <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                  {store.description}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${storeSlug}${categoryTiles[0] ? `/category/${categoryTiles[0].slug}` : ''}`}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {categoryTiles[1] && (
                  <Link
                    href={`/${storeSlug}/category/${categoryTiles[1].slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-7 py-4 font-bold text-gray-950 hover:border-black dark:border-white/20 dark:text-white dark:hover:border-white"
                  >
                    Explore {categoryTiles[1].name}
                  </Link>
                )}
              </div>
            </div>
            <div className="grid min-h-[520px] grid-cols-2 gap-4">
              {spotlightProducts.slice(0, 4).map((product, index) => (
                <Link
                  key={product._id}
                  href={`/${storeSlug}/product/${product.slug}`}
                  className={`group overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 ${index === 0 ? 'row-span-2' : ''}`}
                >
                  <img
                    src={product.featuredImage}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="pb-20">
        {configuredSections.map((section) => {
          const limit = Math.max(1, section.limit || 8);

          if (section.type === 'featured_categories') {
            const featured = allCategories.filter((category) => category.isFeatured);
            const selected = selectConfiguredItems(allCategories, section.categoryIds, featured.length ? featured : allCategories, limit);
            return <FeaturedCategories key={section.id} categories={selected} storeSlug={storeSlug} title={section.title} subtitle={section.subtitle} />;
          }

          if (section.type === 'category_collection') {
            const selected = selectConfiguredItems(allCategories, section.categoryIds, allCategories, limit);
            if (!selected.length) return null;
            return (
              <section key={section.id} className="bg-white py-12 dark:bg-black">
                <div className="container mx-auto px-4 md:px-8">
                  <h2 className="text-3xl font-semibold text-gray-950 dark:text-white">{section.title}</h2>
                  {section.subtitle && <p className="mt-2 max-w-2xl text-gray-500 dark:text-gray-400">{section.subtitle}</p>}
                  <div className={`mt-8 gap-4 ${section.layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'flex overflow-x-auto pb-4'}`}>
                    {selected.map((category) => (
                      <Link key={category._id} href={`/${storeSlug}/category/${category.slug}`} className={`group ${section.layout === 'grid' ? '' : 'min-w-[280px] md:min-w-[360px]'}`}>
                        <div className="aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-zinc-900">
                          {category.imageUrl && <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-gray-950 dark:text-white">{category.name}</h3>
                        {category.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{category.description}</p>}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (section.type === 'spotlight') {
            const featured = products.filter((product) => product.isFeatured);
            const selected = selectConfiguredItems(products, section.productIds, featured.length ? featured : products, limit);
            return <ProductSpotlight key={section.id} title={section.title} subtitle={section.subtitle} products={selected} storeSlug={storeSlug} />;
          }

          if (section.type === 'featured_products') {
            const featured = products.filter((product) => product.isFeatured);
            const selected = selectConfiguredItems(products, section.productIds, featured.length ? featured : products, limit);
            if (!selected.length) return null;
            if (section.layout === 'carousel') {
              return <ProductSpotlight key={section.id} title={section.title} subtitle={section.subtitle} products={selected} storeSlug={storeSlug} />;
            }
            return (
              <section key={section.id} className="bg-white py-12 dark:bg-black">
                <div className="container mx-auto px-4 md:px-8">
                  <h2 className="text-3xl font-semibold text-gray-950 dark:text-white">{section.title}</h2>
                  {section.subtitle && <p className="mb-8 mt-2 max-w-2xl text-gray-500 dark:text-gray-400">{section.subtitle}</p>}
                  {!section.subtitle && <div className="mb-8" />}
                  <ProductGrid products={selected} storeSlug={storeSlug} />
                </div>
              </section>
            );
          }

          if (section.type === 'newsletter') {
            return <NewsletterSection key={section.id} storeId={store._id} title={section.title} subtitle={section.subtitle} buttonLabel={section.buttonLabel} consentText={section.consentText} />;
          }

          return null;
        })}
      </div>
    </>
  );
}
