export function CatalogLoading() {
  return <div role="status" aria-label="Loading products" className="mx-auto max-w-7xl animate-pulse px-5 py-10 md:px-8">
    <div className="mb-8 h-4 w-40 rounded bg-gray-200 dark:bg-white/10" />
    <div className="mb-10 h-10 w-48 rounded bg-gray-200 dark:bg-white/10" />
    <div className="flex gap-8"><div className="hidden w-72 shrink-0 space-y-5 lg:block">{[0,1,2].map(n => <div key={n} className="h-20 rounded bg-gray-100 dark:bg-white/5" />)}</div>
      <div className="grid flex-1 grid-cols-2 gap-6 lg:grid-cols-3">{[0,1,2,3,4,5].map(n => <div key={n}><div className="aspect-square rounded bg-gray-100 dark:bg-white/5" /><div className="mt-4 h-4 w-3/4 rounded bg-gray-200 dark:bg-white/10" /></div>)}</div>
    </div><span className="sr-only">Loading products…</span>
  </div>;
}
