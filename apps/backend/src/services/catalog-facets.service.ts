import { sql, SQL } from 'drizzle-orm';
import { getDB } from '../config/database';

function scope(storeId: string, category?: string): SQL {
  return sql`p."storeId" = ${storeId} AND p."isActive" = true ${category ? sql`AND p."categoryId" IN (
    WITH RECURSIVE descendants AS (
      SELECT "_id" FROM category WHERE "_id" = ${category} AND "storeId" = ${storeId}
      UNION SELECT c."_id" FROM category c JOIN descendants d ON c."parentId" = d."_id" WHERE c."storeId" = ${storeId}
    ) SELECT "_id" FROM descendants
  )` : sql``}`;
}
function packJoin(packSize?: string): SQL {
  return packSize ? sql`JOIN LATERAL (
    SELECT v.price FROM product_variant v WHERE v."productId" = p."_id" AND v."isActive" = true
      AND v.attributes->>'Pack weight' = ${packSize} ORDER BY v.price ASC, v."_id" ASC LIMIT 1
  ) pack ON true` : sql``;
}
export async function catalogFacets(storeId: string, category?: string, packSize?: string) {
  const [row] = (await getDB().execute(sql`
    SELECT (SELECT jsonb_build_object('min', min(${packSize ? sql`pack.price` : sql`p."sellingPrice"`}),
      'max', max(${packSize ? sql`pack.price` : sql`p."sellingPrice"`}))
      FROM product p ${packJoin(packSize)} WHERE ${scope(storeId, category)}) AS price,
      (SELECT coalesce(jsonb_agg(s.size ORDER BY s.size), '[]'::jsonb) FROM (
        SELECT DISTINCT v.attributes->>'Pack weight' AS size FROM product_variant v
        JOIN product p ON p."_id" = v."productId" WHERE ${scope(storeId, category)}
        AND v."isActive" = true AND nullif(v.attributes->>'Pack weight', '') IS NOT NULL
      ) s) AS "packSizes"
  `)).rows as any[];
  return row;
}
export async function listPackProducts(storeId: string, options: {
  packSize: string; category?: string; minPrice?: number; maxPrice?: number;
  page: number; limit: number; sortBy?: string; sortOrder?: string; search?: string;
}) {
  const predicate = sql`${scope(storeId, options.category)}
    ${options.minPrice !== undefined ? sql`AND pack.price >= ${options.minPrice}` : sql``}
    ${options.maxPrice !== undefined ? sql`AND pack.price <= ${options.maxPrice}` : sql``}
    ${options.search ? sql`AND to_tsvector('simple', coalesce(p.name, '') || ' ' || coalesce(p.description, '')) @@ plainto_tsquery('simple', ${options.search})` : sql``}`;
  const sort = options.sortBy === 'sellingPrice' ? sql`pack.price` : options.sortBy === 'name' ? sql`p.name` : sql`p."createdAt"`;
  const direction = sql.raw(options.sortOrder === 'asc' ? 'ASC' : 'DESC');
  const [rows, count] = await Promise.all([
    getDB().execute(sql`SELECT p.*, pack.price AS "catalogPrice", ${options.packSize}::text AS "catalogPackSize"
      FROM product p ${packJoin(options.packSize)} WHERE ${predicate}
      ORDER BY ${sort} ${direction}, p."_id" ${direction} LIMIT ${options.limit} OFFSET ${(options.page - 1) * options.limit}`),
    getDB().execute(sql`SELECT count(*)::int AS total FROM product p ${packJoin(options.packSize)} WHERE ${predicate}`),
  ]);
  const total = Number(count.rows[0].total);
  const data = rows.rows.map((p: any) => ({ ...p, sellingPrice: Number(p.sellingPrice), mrp: Number(p.mrp), catalogPrice: Number(p.catalogPrice) }));
  return { data, total, page: options.page, limit: options.limit, totalPages: Math.ceil(total / options.limit) };
}
