import { randomBytes } from 'node:crypto';
import { sql, SQL, getTableColumns } from 'drizzle-orm';
import { getDB, DatabaseSession, startSession } from '../config/database';
import metadata from './metadata.json';
import { invalidateCatalog } from '../services/cache.service';

export const newId = () => randomBytes(12).toString('hex');
export const isValidId = (id: unknown) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
export type FilterQuery<T = unknown> = Record<string, any>;
export interface Entity { _id: string; createdAt: Date; updatedAt: Date; }
type Options = { session?: DatabaseSession; new?: boolean; upsert?: boolean; timestamps?: boolean; [key: string]: any };
const registry: Record<string, any> = {};
const catalogModels = new Set(['Store', 'Product', 'ProductVariant', 'Category', 'Billboard', 'Page']);
const join = (parts: SQL[], separator: string) => parts.length ? sql.join(parts, sql.raw(separator)) : sql`true`;
const plain = (value: any): any => JSON.parse(JSON.stringify(value));
function normalizeError(error: any): never {
  const code = error.code || error.cause?.code;
  if (code === '23503') { const conflict = new Error('This record is referenced by another record.') as any; conflict.statusCode = 409; throw conflict; }
  if (code === '23505') { const duplicate = new Error('This record already exists.') as any; duplicate.code = 11000; throw duplicate; }
  if (['23502', '23514', '22P02'].includes(code)) { const invalid = new Error('Invalid record data'); invalid.name = 'ValidationError'; throw invalid; }
  throw error;
}

/** Small typed repository facade retained by controllers during the SQL migration.
 * Every filter, pagination, count and conditional update executes in PostgreSQL.
 * Unsupported operators throw rather than silently weakening a predicate.
 */
export function createRepository<T extends Entity>(name: keyof typeof metadata, table: any) {
  const meta = metadata[name] as any;
  const columns = getTableColumns(table) as Record<string, any>;
  function field(key: string): SQL {
    const [root, ...path] = key.split('.');
    if (!columns[root]) throw new Error(`Unknown ${name} field: ${key}`);
    if (!path.length) return sql`${columns[root]}`;
    if (root === 'attributes' && path[0] === 'value') return sql`${columns[root]}::text`;
    return sql`${columns[root]} #>> ARRAY[${sql.join(path.map(part => sql`${part}`), sql`, `)}]::text[]`;
  }
  function filter(query: FilterQuery = {}): SQL {
    return join(Object.entries(query).map(([key, value]) => {
      if (key === '$or' || key === '$and') {
        if (!value.length) return key === '$or' ? sql`false` : sql`true`;
        return sql`(${join(value.map((v: any) => filter(v)), key === '$or' ? ' OR ' : ' AND ')})`;
      }
      if (key === '$text') return sql`to_tsvector('simple', coalesce(${field('name')}, '') || ' ' || coalesce(${field('description')}, '')) @@ plainto_tsquery('simple', ${String(value.$search)})`;
      const column = field(key);
      if (value instanceof RegExp) return sql`${column} ${sql.raw(value.ignoreCase ? '~*' : '~')} ${value.source}`;
      if (value === null || value === undefined) return sql`${column} IS NULL`;
      if (typeof value !== 'object' || value instanceof Date) return sql`${column} = ${value}`;
      return join(Object.entries(value).filter(([op]) => op !== '$options').map(([op, operand]: any) => {
        switch (op) {
          case '$in': return operand.length ? sql`${column} IN (${sql.join(operand.map((v: any) => sql`${v}`), sql`, `)})` : sql`false`;
          case '$nin': return operand.length ? sql`(${column} IS NULL OR ${column} NOT IN (${sql.join(operand.map((v: any) => sql`${v}`), sql`, `)}))` : sql`true`;
          case '$ne': return sql`${column} IS DISTINCT FROM ${operand}`;
          case '$exists': return sql`${column} IS ${sql.raw(operand ? 'NOT NULL' : 'NULL')}`;
          case '$gte': return sql`${column} >= ${operand}`;
          case '$gt': return sql`${column} > ${operand}`;
          case '$lte': return sql`${column} <= ${operand}`;
          case '$lt': return sql`${column} < ${operand}`;
          case '$regex': return sql`${column} ${sql.raw(value.$options?.includes('i') ? '~*' : '~')} ${String(operand)}`;
          default: throw new Error(`Unsupported SQL repository operator: ${op}`);
        }
      }), ' AND ');
    }), ' AND ');
  }
  async function changed(session?: DatabaseSession) {
    if (!catalogModels.has(name)) return;
    if (session?.db) session.afterCommit.push(invalidateCatalog);
    else await invalidateCatalog();
  }
  function prepare(input: any, creating = false) {
    const data: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (!columns[key] || value === undefined) continue;
      data[key] = meta.fields[key].type === 'jsonb' ? plain(value) : meta.fields[key].type === 'timestamp' && value ? new Date(value as any) : value;
    }
    if (creating) {
      data._id ||= newId();
      for (const [key, info] of Object.entries(meta.fields) as any) if (data[key] === undefined && info.default !== undefined) data[key] = structuredClone(info.default);
    }
    if (data.parentId === '') data.parentId = null;
    if (data.email) data.email = data.email.trim().toLowerCase();
    if (name === 'User' && data.addresses) data.addresses = data.addresses.map((v: any) => ({ ...v, _id: v._id || newId() }));
    if (name === 'Page' && data.sections) data.sections = data.sections.map((v: any) => ({ order: 0, isVisible: true, layout: 'grid', columns: 3, ...v, _id: v._id || newId() }));
    return data;
  }
  class RecordEntity {
    [key: string]: any;
    constructor(data: any = {}) { Object.assign(this, data); }
    toObject() { return { ...this }; }
    toJSON() { const data = this.toObject(); delete data.checkoutFingerprint; return data; }
    async save(options: Options = {}) {
      const data = prepare(this);
      delete data._id; delete data.createdAt;
      const found = await Repository.findOneAndUpdate({ _id: this._id }, { $set: data }, { ...options, new: true });
      if (!found) throw new Error('Record no longer exists');
      Object.assign(this, found); return this;
    }
    async deleteOne() { return Repository.deleteOne({ _id: this._id }); }
  }
  type Row = T & RecordEntity;
  class Query<R> implements PromiseLike<R> {
    public ordering: Record<string, any> = {};
    public take?: number;
    public offset = 0;
    public projection?: string;
    public population?: any;
    public options: Options = {};
    constructor(public query: FilterQuery, public single: boolean, public operation?: (options: Options) => Promise<any>) {}
    sort(value: Record<string, any>) { this.ordering = value; return this; }
    limit(value: number) { this.take = Math.max(0, Math.floor(value)); return this; }
    skip(value: number) { this.offset = Math.max(0, Math.floor(value)); return this; }
    select(value: string | object) { if (typeof value === 'string') this.projection = value; return this; }
    lean() { return this; }
    populate(value: any) { this.population = value; return this; }
    session(value: DatabaseSession) { this.options.session = value; return this; }
    async exec(): Promise<R> {
      try {
        let rows: any[];
        if (this.operation) { const result = await this.operation(this.options); rows = result ? [result] : []; }
        else {
          let q = (this.options.session?.db || getDB()).select().from(table).where(filter(this.query)).$dynamic();
          const order = Object.entries(this.ordering).filter(([k]) => k !== 'score').map(([k, direction]) => sql`${field(k)} ${sql.raw(direction === -1 ? 'DESC' : 'ASC')}`);
          if (order.length) q = q.orderBy(...order);
          if (this.single || this.take !== undefined) q = q.limit(this.single ? 1 : this.take);
          if (this.offset) q = q.offset(this.offset);
          if (this.options.session?.db) q = q.for('update');
          rows = await q;
        }
        for (const row of rows) {
          // SQL NULL represents absent optional fields in the public API.
          for (const k of Object.keys(row)) if (row[k] === null) delete row[k];
          if (this.population) {
            const { path, match = {} } = typeof this.population === 'string' ? { path: this.population } : this.population;
            if (!['billboards', 'homeBillboards'].includes(path)) throw new Error('Unsupported relationship');
            const ids = row[path] || [];
            const related = await registry.Billboard.find({ _id: { $in: ids }, storeId: name === 'Store' ? row._id : row.storeId, ...match });
            row[path] = ids.map((id: string) => related.find((v: any) => v._id === id)).filter(Boolean);
          }
          if (name === 'Order' && !this.projection?.includes('+checkoutFingerprint')) delete row.checkoutFingerprint;
          if (this.projection) {
            const tokens = this.projection.split(/\s+/);
            const include = tokens.filter(k => !/^[+-]/.test(k));
            if (include.length) for (const k of Object.keys(row)) if (k !== '_id' && !include.includes(k)) delete row[k];
            for (const k of tokens.filter(k => k.startsWith('-'))) delete row[k.slice(1)];
          }
        }
        return (this.single ? rows[0] ? new RecordEntity(rows[0]) : null : rows.map(row => new RecordEntity(row))) as R;
      } catch (error) { normalizeError(error); }
    }
    then<A = R, B = never>(onfulfilled?: ((value: R) => A | PromiseLike<A>) | null, onrejected?: ((reason: any) => B | PromiseLike<B>) | null): Promise<A | B> { return this.exec().then(onfulfilled, onrejected); }
  }
  async function update(query: FilterQuery, mutation: any, options: Options = {}, many = false): Promise<any[]> {
    if (name === 'Page' && (mutation.$set || mutation).isHomePage === true && !options.session?.db) {
      const session = await startSession();
      try { return await session.withTransaction(() => update(query, mutation, { ...options, session }, many)); }
      finally { await session.endSession(); }
    }
    const db = options.session?.db || getDB();
    if (name === 'Page' && (mutation.$set || mutation).isHomePage === true) {
      const current = await Repository.findOne(query).session(options.session!);
      if (current) await db.update(table).set({ isHomePage: false }).where(sql`${columns.storeId} = ${current.storeId} AND ${columns._id} <> ${current._id}`);
    }
    const set: any = prepare(mutation.$set || Object.fromEntries(Object.entries(mutation).filter(([k]) => !k.startsWith('$'))));
    for (const [key, value] of Object.entries(mutation.$set || {})) if (key.includes('.')) {
      const [root, ...path] = key.split('.');
      set[root] = sql`jsonb_set(coalesce(${set[root] || field(root)}, '{}'::jsonb), ARRAY[${sql.join(path.map(part => sql`${part}`), sql`, `)}]::text[], ${JSON.stringify(value)}::jsonb, true)`;
    }
    for (const key of Object.keys(mutation.$unset || {})) set[key] = null;
    for (const [key, value] of Object.entries(mutation.$inc || {})) set[key] = sql`${field(key)} + ${value}`;
    for (const [key, value] of Object.entries(mutation.$push || {})) set[key] = sql`coalesce(${field(key)}, '[]'::jsonb) || ${JSON.stringify([value])}::jsonb`;
    if (options.timestamps !== false) set.updatedAt = new Date();
    // A single conditional UPDATE is atomic; no read/modify/write inventory race.
    const predicate = many ? filter(query) : sql`${columns._id} IN (SELECT ${columns._id} FROM ${table} WHERE ${filter(query)} LIMIT 1 FOR UPDATE)`;
    const rows = await db.update(table).set(set).where(predicate).returning();
    if (!rows.length && options.upsert) {
      const identity = Object.fromEntries(Object.entries(query).filter(([k, v]) => !k.startsWith('$') && (typeof v !== 'object' || v instanceof Date)));
      return [await Repository.create({ ...identity, ...(mutation.$set || mutation) }, options)];
    }
    if (rows.length) await changed(options.session);
    return rows;
  }
  class Repository extends RecordEntity {
    static find(query: FilterQuery = {}) { return new Query<Row[]>(query, false); }
    static findOne(query: FilterQuery = {}) { return new Query<Row | null>(query, true); }
    static exists(query: FilterQuery) { return this.findOne(query).select('_id'); }
    static findById(id: any) { return this.findOne({ _id: id }); }
    static create(input: any[], options?: Options): Promise<Row[]>;
    static create(input: Record<string, any>, options?: Options): Promise<Row>;
    static async create(input: any, options: Options = {}): Promise<any> {
      try {
        if (name === 'Page' && !Array.isArray(input) && input.isHomePage && !options.session?.db) {
          const session = await startSession();
          try { return await session.withTransaction(() => Repository.create(input, { ...options, session })); }
          finally { await session.endSession(); }
        }
        if (name === 'Page' && !Array.isArray(input) && input.isHomePage) await options.session!.db.update(table).set({ isHomePage: false }).where(sql`${columns.storeId} = ${input.storeId}`);
        const data = (Array.isArray(input) ? input : [input]).map(v => prepare(v, true));
        const result = await (options.session?.db || getDB()).insert(table).values(data).returning();
        await changed(options.session);
        return Array.isArray(input) ? result.map((v: any) => new RecordEntity(v)) : new RecordEntity(result[0]);
      } catch (error) { normalizeError(error); }
    }
    static insertMany(input: any[]) { return this.create(input); }
    static async countDocuments(query: FilterQuery = {}) {
      const [row] = await getDB().select({ count: sql<number>`count(*)::int` }).from(table).where(filter(query)); return row.count;
    }
    static findOneAndUpdate(query: FilterQuery, mutation: any, options: Options = {}) {
      return new Query<Row | null>(query, true, async chained => (await update(query, mutation, { ...options, ...chained }))[0] || null);
    }
    static findByIdAndUpdate(id: any, mutation: any, options: Options = {}) { return this.findOneAndUpdate({ _id: id }, mutation, options); }
    static async updateOne(query: FilterQuery, mutation: any, options: Options = {}) {
      try { const rows = await update(query, mutation, options); return { modifiedCount: rows.length, matchedCount: rows.length }; } catch (error) { normalizeError(error); }
    }
    static async updateMany(query: FilterQuery, mutation: any, options: Options = {}) {
      try { const rows = await update(query, mutation, options, true); return { modifiedCount: rows.length }; } catch (error) { normalizeError(error); }
    }
    static async findOneAndDelete(query: FilterQuery) {
      const rows: any = await getDB().delete(table).where(sql`${columns._id} IN (SELECT ${columns._id} FROM ${table} WHERE ${filter(query)} LIMIT 1 FOR UPDATE)`).returning();
      if (rows.length) await changed();
      return rows[0] ? new RecordEntity(rows[0]) as Row : null;
    }
    static async deleteOne(query: FilterQuery) { const row = await this.findOneAndDelete(query); return { deletedCount: row ? 1 : 0 }; }
    static async deleteMany(query: FilterQuery = {}) { const rows: any = await getDB().delete(table).where(filter(query)).returning(); await changed(); return { deletedCount: rows.length }; }
  }
  registry[name] = Repository;
  return Repository as typeof Repository & { new(data?: Partial<T>): Row };
}
