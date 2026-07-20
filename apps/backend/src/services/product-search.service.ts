import Fuse from 'fuse.js';
import type { FilterQuery } from 'mongoose';
import { Product, IProduct } from '../models/product.model';

type SearchableProduct = {
  _id: unknown;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  featuredImage: string;
  sellingPrice: number;
  attributes?: Array<{ value: string }>;
  isFeatured?: boolean;
  [key: string]: unknown;
};

const MAX_CANDIDATES = 400;

const normalizeSearch = (value: unknown) => String(value ?? '').trim().slice(0, 80);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const flexiblePattern = (term: string) => {
  const compact = term.replace(/[\s_-]+/g, '');
  return compact.split('').map(escapeRegex).join('[\\s_-]*');
};

const normalizedValue = (value: unknown) => String(value ?? '').toLowerCase().replace(/[\s_-]+/g, '');

export async function searchProducts(
  baseQuery: FilterQuery<IProduct>,
  rawTerm: unknown
): Promise<SearchableProduct[]> {
  const term = normalizeSearch(rawTerm);
  if (!term) return [];

  const regex = new RegExp(flexiblePattern(term), 'i');
  const flexibleQuery = {
    ...baseQuery,
    $or: [
      { name: regex },
      { sku: regex },
      { description: regex },
      { 'attributes.value': regex },
    ],
  };

  const [textMatches, flexibleMatches, candidates] = await Promise.all([
    Product.find({ ...baseQuery, $text: { $search: term } })
      .select({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(MAX_CANDIDATES)
      .lean(),
    Product.find(flexibleQuery).limit(MAX_CANDIDATES).lean(),
    Product.find(baseQuery).sort({ isFeatured: -1, createdAt: -1 }).limit(MAX_CANDIDATES).lean(),
  ]);

  const fuse = new Fuse(candidates, {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.42,
    minMatchCharLength: Math.min(2, term.length),
    keys: [
      { name: 'name', weight: 0.58 },
      { name: 'sku', weight: 0.2 },
      { name: 'attributes.value', weight: 0.12 },
      { name: 'description', weight: 0.1 },
    ],
  });

  const textIds = new Set(textMatches.map((product) => String(product._id)));
  const fuzzyScores = new Map(
    fuse.search(term).map((result) => [String(result.item._id), result.score ?? 1])
  );
  const combined = new Map<string, SearchableProduct>();

  for (const product of [...textMatches, ...flexibleMatches]) {
    combined.set(String(product._id), product as unknown as SearchableProduct);
  }
  for (const result of fuse.search(term)) {
    combined.set(String(result.item._id), result.item as unknown as SearchableProduct);
  }

  const normalizedTerm = normalizedValue(term);
  const rank = (product: SearchableProduct) => {
    const name = normalizedValue(product.name);
    const sku = normalizedValue(product.sku);
    let score = 0;
    if (name === normalizedTerm || sku === normalizedTerm) score += 100;
    else if (name.startsWith(normalizedTerm) || sku.startsWith(normalizedTerm)) score += 70;
    else if (name.includes(normalizedTerm) || sku.includes(normalizedTerm)) score += 45;
    if (textIds.has(String(product._id))) score += 30;
    score += (1 - (fuzzyScores.get(String(product._id)) ?? 1)) * 25;
    if (product.isFeatured) score += 2;
    return score;
  };

  return [...combined.values()].sort((a, b) => rank(b) - rank(a));
}
