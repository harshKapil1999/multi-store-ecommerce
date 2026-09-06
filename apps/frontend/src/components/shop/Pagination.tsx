import Link from 'next/link';
export function Pagination({ page, totalPages, basePath, query = {} }: { page: number; totalPages: number; basePath: string; query?: Record<string, string | undefined> }) {
  if (totalPages < 2) return null;
  const href = (next: number) => { const params=new URLSearchParams();Object.entries(query).forEach(([key,value])=>{if(value)params.set(key,value)});params.set('page',String(next));return `${basePath}?${params}`; };
  return <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-6 text-sm">{page > 1 && <Link rel="prev" className="rounded-full border px-5 py-3" href={href(page-1)}>Previous</Link>}<span>Page {page} of {totalPages}</span>{page < totalPages && <Link rel="next" className="rounded-full border px-5 py-3" href={href(page+1)}>Next</Link>}</nav>;
}
