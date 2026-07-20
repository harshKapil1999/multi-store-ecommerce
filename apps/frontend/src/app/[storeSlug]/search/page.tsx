import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';
import type { Product, Store } from '@repo/types';
import { api } from '@/lib/api';

type SearchPageProps = {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const [{ storeSlug }, queryParams] = await Promise.all([params, searchParams]);
  const query = String(queryParams.q || '').trim();
  const page = Math.max(1, Number(queryParams.page) || 1);
  const store = await api.get<Store>(`/stores/slug/${storeSlug}`);

  let result = { data: [] as Product[], total: 0, totalPages: 0 };
  if (query) {
    result = await api.get<typeof result>(
      `/stores/${store._id}/products?search=${encodeURIComponent(query)}&page=${page}&limit=24`
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 pb-20 pt-28 text-gray-950 dark:bg-black dark:text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href={`/${storeSlug}`} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-current">
          <ArrowLeft className="h-4 w-4" />
          Back to {store.name}
        </Link>

        <form action={`/${storeSlug}/search`} className="relative max-w-3xl">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder={`Search ${store.name}`}
            autoFocus
            className="w-full rounded-full border border-gray-300 bg-transparent py-4 pl-14 pr-6 text-lg outline-none focus:border-black dark:border-white/20 dark:focus:border-white"
          />
        </form>

        {query ? (
          <>
            <div className="mb-8 mt-12 flex items-end justify-between border-b border-gray-200 pb-5 dark:border-white/10">
              <div>
                <p className="text-sm text-gray-500">Search results</p>
                <h1 className="mt-1 text-3xl font-semibold">“{query}”</h1>
              </div>
              <p className="text-sm text-gray-500">{result.total} product{result.total === 1 ? '' : 's'}</p>
            </div>

            {result.data.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                {result.data.map((product) => (
                  <Link key={product._id} href={`/${storeSlug}/product/${product.slug}`} className="group">
                    <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-zinc-900">
                      <img src={product.featuredImage} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <h2 className="mt-4 font-semibold">{product.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">₹{product.sellingPrice.toLocaleString('en-IN')}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <Search className="mx-auto mb-4 h-10 w-10 text-gray-300" />
                <h2 className="text-xl font-semibold">No matching products</h2>
                <p className="mt-2 text-gray-500">Try a product name, description, or fewer words.</p>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center text-gray-500">Enter a product name or keyword to search this store.</div>
        )}
      </div>
    </main>
  );
}
