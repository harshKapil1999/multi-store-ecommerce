import { api } from '@/lib/api';
import type { Store } from '@repo/types';
import Link from 'next/link';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Globe2,
  Search,
  ShoppingBag,
  Sparkles,
  Store as StoreIcon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type StoreListResponse = Store[] | {
  data?: Store[];
  total?: number;
};

async function getStores() {
  try {
    const response = await api.get<StoreListResponse>('/stores');
    const stores = Array.isArray(response) ? response : response.data || [];

    return {
      stores: stores.filter((store) => store.isActive),
      error: null,
    };
  } catch (error) {
    console.error('Failed to fetch stores:', error);
    return {
      stores: [],
      error: error instanceof Error ? error.message : 'Unable to connect to the stores API.',
    };
  }
}

export default async function Home() {
  const { stores, error } = await getStores();
  const featuredStore = stores[0];

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-neutral-950 dark:bg-neutral-950 dark:text-white">
      <header className="border-b border-neutral-200 bg-[#fbfaf7]/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Go to marketplace home">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold">Commerce Stores</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-600 dark:text-neutral-300 md:flex">
            <a href="#stores" className="hover:text-neutral-950 dark:hover:text-white">
              Stores
            </a>
            <a href="#why" className="hover:text-neutral-950 dark:hover:text-white">
              Why Shop Here
            </a>
            <a href="#featured" className="hover:text-neutral-950 dark:hover:text-white">
              Featured
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="#stores"
              className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              Browse Stores
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-16">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm font-medium text-neutral-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-neutral-200">
            <span className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'}`} />
            {error ? 'Store API needs attention' : `${stores.length} active ${stores.length === 1 ? 'store' : 'stores'} ready to shop`}
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] md:text-7xl">
            Discover curated stores in one polished marketplace.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-300">
            Explore every brand, collection, and storefront from one place. Choose a store,
            browse its catalog, and continue into a dedicated shopping experience.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#stores"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-950 px-6 py-3 font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              Explore Stores
              <ArrowRight className="h-4 w-4" />
            </Link>
            {featuredStore && (
              <Link
                href={`/${featuredStore.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-950 hover:border-neutral-950 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-white"
              >
                Visit {featuredStore.name}
              </Link>
            )}
          </div>
        </div>

        <div id="featured" className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="overflow-hidden rounded-md bg-neutral-950 text-white">
            <div className="grid min-h-[430px] content-between p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-300">Featured storefront</p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    {featuredStore?.name || 'Launch your first store'}
                  </h2>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white">
                  {featuredStore?.logo ? (
                    <img
                      src={featuredStore.logo}
                      alt={`${featuredStore.name} logo`}
                      className="max-h-12 max-w-12 object-contain"
                    />
                  ) : (
                    <StoreIcon className="h-8 w-8 text-neutral-950" />
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-white p-5 text-neutral-950">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
                  <Search className="h-4 w-4" />
                  Store preview
                </div>
                <p className="mt-4 text-xl font-semibold">
                  {featuredStore?.description || 'Create active stores in admin and they will appear here automatically.'}
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-md bg-[#f7f4ee] p-3">
                    <p className="font-semibold">{stores.length}</p>
                    <p className="text-neutral-500">Stores</p>
                  </div>
                  <div className="rounded-md bg-[#f7f4ee] p-3">
                    <p className="font-semibold">Live</p>
                    <p className="text-neutral-500">Catalogs</p>
                  </div>
                  <div className="rounded-md bg-[#f7f4ee] p-3">
                    <p className="font-semibold">Secure</p>
                    <p className="text-neutral-500">Checkout</p>
                  </div>
                </div>
              </div>

              {featuredStore ? (
                <Link
                  href={`/${featuredStore.slug}`}
                  className="mt-7 inline-flex w-fit items-center gap-2 rounded-md bg-white px-5 py-3 font-semibold text-neutral-950 hover:bg-neutral-100"
                >
                  Open Store
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="border-y border-neutral-200 bg-[#fbfaf7] dark:border-white/10 dark:bg-neutral-900">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-3 md:px-8">
          {[
            ['Curated storefronts', 'Only active stores are listed for customers.'],
            ['Brand-level shopping', 'Each card opens the dedicated store experience.'],
            ['Ready for checkout', 'Catalog, cart, payment, and order tracking stay connected.'],
          ].map(([title, copy]) => (
            <div key={title} className="flex gap-3 rounded-md border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-neutral-950">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="stores" className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              <Sparkles className="h-4 w-4" />
              Store directory
            </div>
            <h2 className="text-3xl font-semibold md:text-4xl">Choose a store to start shopping</h2>
          </div>
          <p className="max-w-xl text-neutral-600 dark:text-neutral-300">
            These stores are pulled from your backend in real time. Toggle availability from the admin
            panel and this directory updates automatically.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center dark:border-red-500/30 dark:bg-red-950/30">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h3 className="mt-4 text-2xl font-semibold">Stores API is not reachable</h3>
            <p className="mx-auto mt-2 max-w-xl text-neutral-600 dark:text-neutral-300">
              The marketplace is ready, but it could not load active stores from the backend. Check that
              `NEXT_PUBLIC_API_URL` points to the running backend and that `/api/v1/stores` returns JSON.
            </p>
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-white/15 dark:bg-white/5">
            <StoreIcon className="mx-auto h-10 w-10 text-neutral-400" />
            <h3 className="mt-4 text-2xl font-semibold">No active stores yet</h3>
            <p className="mx-auto mt-2 max-w-md text-neutral-600 dark:text-neutral-300">
              Create a store in admin or activate an existing one, then refresh this page.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Link
                key={store._id}
                href={`/${store.slug}`}
                className="group rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-neutral-950 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white"
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-neutral-200 bg-[#fbfaf7] dark:border-white/10 dark:bg-white/10">
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt={`${store.name} logo`}
                        className="max-h-11 max-w-11 object-contain"
                      />
                    ) : (
                      <StoreIcon className="h-7 w-7 text-neutral-500" />
                    )}
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold">{store.name}</h3>
                <p className="mt-3 min-h-[3rem] text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {store.description || 'Browse this brand storefront and discover its latest products.'}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-white/10">
                  <span className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <Globe2 className="h-4 w-4" />
                    /{store.slug}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    Visit
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-neutral-200 bg-[#fbfaf7] dark:border-white/10 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-neutral-500 dark:text-neutral-400 md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Commerce Stores. All rights reserved.</p>
          <p>Multi-store ecommerce platform for modern retail teams.</p>
        </div>
      </footer>
    </main>
  );
}
