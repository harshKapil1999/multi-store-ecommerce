import Link from 'next/link';
import type { Product } from '@repo/types';

interface EditorialSpotlightProps {
  title: string;
  subtitle?: string;
  products: Product[];
  storeSlug: string;
}

export function EditorialSpotlight({
  title,
  subtitle,
  products,
  storeSlug,
}: EditorialSpotlightProps) {
  if (!products.length) return null;

  return (
    <section className="bg-white px-4 py-16 dark:bg-black md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-black uppercase text-gray-950 dark:text-white md:text-6xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300 md:text-lg">
              {subtitle}
            </p>
          )}
        </header>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-8 lg:gap-x-6">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/${storeSlug}/product/${product.slug}`}
              className="group min-w-0 text-center"
            >
              <div className="aspect-square overflow-hidden rounded-md bg-gray-50 p-2 dark:bg-zinc-900">
                <img
                  src={product.featuredImage}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-gray-950 group-hover:underline dark:text-white">
                {product.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
