import { createClient } from 'redis';
import { randomUUID } from 'node:crypto';
let client: ReturnType<typeof createClient> | undefined;
let connecting: Promise<any> | undefined;
let retryAfter = 0;
const scoped = (key: string) => `${process.env.CACHE_NAMESPACE || 'commerce'}:${key}`;
async function bounded<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try { return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => { retryAfter = Date.now() + 10_000; if (client?.isOpen) client.destroy(); reject(new Error('Cache timeout')); }, Number(process.env.REDIS_COMMAND_TIMEOUT_MS || 1500)); })]); }
  finally { clearTimeout(timer!); }
}
export async function getRedis() {
  if (!process.env.REDIS_URL || Date.now() < retryAfter) return null;
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL, disableOfflineQueue: true,
      socket: { connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 2000), reconnectStrategy: false } });
    client.on('error', () => { retryAfter = Date.now() + 10_000; });
  }
  try {
    if (!client.isOpen) {
      connecting ||= client.connect().finally(() => { connecting = undefined; });
      await connecting;
    }
    return client.isReady ? client : null;
  } catch { retryAfter = Date.now() + 10_000; return null; }
}
export async function cacheGet(key: string): Promise<string | null> {
  try { const redis = await getRedis(); return redis ? await bounded(redis.get(scoped(key))) : null; } catch { return null; }
}
export async function cacheSet(key: string, value: string, ttl: number) {
  try { const redis = await getRedis(); if (redis) await bounded(redis.set(scoped(key), value, { EX: ttl })); } catch { /* Cache outages never reject commerce operations. */ }
}
const generationKey = 'commerce:v1:catalog-generation';
// Read the generation and response atomically in one network round trip.
export async function catalogLookup(hash: string): Promise<{ generation: string; cached: string | null } | null> {
  try {
    const redis = await getRedis();
    if (!redis) return null;
    const result = await bounded(redis.eval(`
      local g = redis.call('GET', KEYS[1])
      if not g then g = ARGV[1]; redis.call('SET', KEYS[1], g) end
      return {g, redis.call('GET', ARGV[2] .. g .. ':' .. ARGV[3]) or ''}
    `, { keys: [scoped(generationKey)], arguments: [randomUUID(), scoped('commerce:v2:catalog:'), hash] })) as string[];
    return { generation: result[0], cached: result[1] || null };
  } catch { return null; }
}
export async function catalogStore(hash: string, generation: string, value: string, ttl = 60) {
  try {
    const redis = await getRedis();
    if (!redis) return;
    // A write committed during a cache miss must not let that old response reappear.
    await bounded(redis.eval(`
      if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
      redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3]); return 1
    `, { keys: [scoped(generationKey), scoped(`commerce:v2:catalog:${generation}:${hash}`)], arguments: [generation, value, String(ttl)] }));
  } catch { /* Cache failure does not fail catalog requests. */ }
}
export async function catalogGeneration() {
  try {
    const redis = await getRedis();
    if (!redis) return null;
    return await bounded(redis.eval("local v = redis.call('GET', KEYS[1]); if v then return v end; redis.call('SET', KEYS[1], ARGV[1]); return ARGV[1]", { keys: [scoped(generationKey)], arguments: [randomUUID()] })) as string;
  } catch { return null; }
}
export async function invalidateCatalog() {
  try { const redis = await getRedis(); if (redis) await bounded(redis.set(scoped(generationKey), randomUUID())); } catch { /* Short TTL bounds stale reads during outages. */ }
}
export async function closeRedis() { if (client?.isOpen) client.destroy(); client = undefined; }
