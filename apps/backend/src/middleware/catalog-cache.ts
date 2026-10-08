import { Request, Response, NextFunction } from 'express';
import { createHash } from 'node:crypto';
import { catalogLookup, catalogStore } from '../services/cache.service';

// Cache only anonymous catalog responses. Accounts, orders, payment and admin
// responses are never cached. The generation changes after catalog/stock commits.
export async function catalogCache(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET' || req.headers.authorization || req.headers.cookie ||
      !/^\/api\/v1\/(stores(?:\/[^/]+)*(?:\?.*)?|products\/[^/]+\/variants(?:\?.*)?|variants\/[^/?]+(?:\?.*)?)$/.test(req.originalUrl) ||
      /\/(orders|customers|newsletter|stats|admin)(\/|\?|$)/.test(req.originalUrl)) return next();
  const hash = createHash('sha256').update(req.originalUrl).digest('hex');
  const lookup = await catalogLookup(hash);
  if (!lookup) return next();
  if (lookup.cached) { res.setHeader('X-Cache', 'HIT'); return res.type('json').send(lookup.cached); }
  const send = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (res.statusCode === 200) {
      const serialized = JSON.stringify(body);
      // Await cache storage before ending the request (Cloud Run throttles after response).
      if (Buffer.byteLength(serialized) < 512_000) {
        void catalogStore(hash, lookup.generation, serialized).then(() => { send(body); });
        return res;
      }
    }
    return send(body);
  }) as Response['json'];
  res.setHeader('X-Cache', 'MISS');
  next();
}
