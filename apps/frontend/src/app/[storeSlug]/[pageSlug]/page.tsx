import { notFound } from 'next/navigation';
import type { Billboard, Category, Page, PageSection, Product, Store } from '@repo/types';
import { api } from '@/lib/api';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { ProductSpotlight } from '@/components/home/ProductSpotlight';
import Link from 'next/link';

type StorePageProps = {
  params: Promise<{ storeSlug: string; pageSlug: string }>;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadSection(store: Store, section: PageSection) {
  if (!section.isVisible) return { section };

  if ((section.type === 'billboard' || section.type === 'hero') && section.billboardId) {
    const billboard = await api.get<Billboard>(`/stores/${store._id}/billboards/${section.billboardId}`).catch(() => null);
    return { section, billboard };
  }

  if (section.type === 'featured_products' || section.type === 'product_grid') {
    let products: Product[] = [];
    if (section.productIds?.length) {
      const resolved = await Promise.all(
        section.productIds.map((id) => api.get<Product>(`/stores/${store._id}/products/${id}`).catch(() => null))
      );
      products = resolved.filter((product): product is Product => Boolean(product));
    } else {
      const params = new URLSearchParams({ limit: String(section.productsLimit || 12) });
      if (section.showFeaturedOnly) params.set('isFeatured', 'true');
      if (section.categoryFilter) params.set('category', section.categoryFilter);
      const result = await api.get<{ data: Product[] }>(`/stores/${store._id}/products?${params}`);
      products = Array.isArray(result.data) ? result.data : [];
    }
    return { section, products };
  }

  if (section.type === 'featured_categories' || section.type === 'category_grid') {
    let categories: Category[] = [];
    if (section.categoryIds?.length) {
      const resolved = await Promise.all(
        section.categoryIds.map((id) => api.get<Category>(`/stores/${store._id}/categories/${id}`).catch(() => null))
      );
      categories = resolved.filter((category): category is Category => Boolean(category));
    } else {
      categories = await api.get<Category[]>(`/stores/${store._id}/categories/featured`);
    }
    return { section, categories };
  }

  return { section };
}

export default async function PublishedStorePage({ params }: StorePageProps) {
  const { storeSlug, pageSlug } = await params;
  const store = await api.get<Store>(`/stores/slug/${storeSlug}`).catch(() => null);
  if (!store) notFound();

  const page = await api.get<Page>(`/stores/${store._id}/pages/slug/${pageSlug}`).catch(() => null);
  if (!page) notFound();

  const loadedSections = await Promise.all(
    [...page.sections].sort((a, b) => a.order - b.order).map((section) => loadSection(store, section))
  );

  return (
    <article className="min-h-[60vh] bg-white text-gray-950 dark:bg-black dark:text-white">
      <header className="border-b border-gray-200 px-4 py-14 dark:border-white/10 md:px-8 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-semibold md:text-6xl">{page.title}</h1>
          {page.description && <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-500">{page.description}</p>}
        </div>
      </header>

      {loadedSections.map(({ section, billboard, products, categories }: any) => {
        if (!section.isVisible) return null;
        if (billboard) return <HeroCarousel key={section._id} billboards={[billboard]} storeSlug={storeSlug} />;
        if (products?.length) return <ProductSpotlight key={section._id} title={section.title || 'Featured Products'} products={products} storeSlug={storeSlug} />;
        if (categories?.length) {
          return (
            <section key={section._id} className="mx-auto max-w-7xl px-4 py-12 md:px-8">
              {section.title && <h2 className="mb-7 text-3xl font-semibold">{section.title}</h2>}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category: Category) => (
                  <Link key={category._id} href={`/${storeSlug}/category/${category.slug}`} className="group">
                    {category.imageUrl && <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-zinc-900"><img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>}
                    <h3 className="mt-3 text-xl font-semibold">{category.name}</h3>
                  </Link>
                ))}
              </div>
            </section>
          );
        }
        if (section.content || section.html) {
          return (
            <section key={section._id} className="mx-auto max-w-5xl px-4 py-12 md:px-8">
              {section.title && section.title !== page.title && <h2 className="mb-6 text-3xl font-semibold">{section.title}</h2>}
              <div className="store-page-content" dangerouslySetInnerHTML={{ __html: section.content || section.html || '' }} />
            </section>
          );
        }
        return null;
      })}
    </article>
  );
}
