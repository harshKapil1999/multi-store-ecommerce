# Production performance release — 8 October 2026

## Result

The production storefront and admin now call the Singapore Cloud Run origin. Neon stays on its existing Singapore project; products, variants and orders were preserved. Redis was replaced with the explicitly selected **Free, $0/month, 30 MB** Singapore database after the owner deleted the Virginia cache.

| Service | Runtime location | Idle/capacity configuration |
| --- | --- | --- |
| Cloud Run commerce API | Google `asia-southeast1`, Singapore | Service and revision minimum 0; request-based CPU; maximum 10 |
| Neon PostgreSQL | AWS `ap-southeast-1`, Singapore | Existing Free project, suspend after 5 minutes; pool minimum 0, idle close after 10 seconds |
| Redis Cloud | AWS `ap-southeast-1`, Singapore | Free subscription #3443293, database #14678776; 30 MB, 100 ops/sec, 30 connections |
| Storefront and admin server functions | Vercel `sin1`, Singapore | Verified deployed page/API functions and saved project defaults |
| Static assets and routing middleware | Vercel global delivery network | Assets served near visitors |

Singapore is a shared geographic location across AWS and Google, rather than one shared provider region identifier. Redis remains available as a cache; scale-to-zero applies to Cloud Run and Neon compute.

The previous Mumbai service remains available with minimum 0 for compatibility with previously issued origin URLs/provider callbacks. It uses the same database, cache and current backend image. Fresh storefront/admin deployments use Singapore directly. The existing `shopbackend.crabtile.com` Firebase Hosting proxy was also moved to Singapore by cloning its two hosted files and preserving all other configuration; health/catalog checks pass.

## Causes and changes

- Removed the Virginia Redis round trip. Anonymous catalog cache lookup now reads the generation and response atomically in **one** Redis command instead of two sequential commands.
- Cache fills check the generation before storing a response, preventing a concurrent catalog write from restoring an outdated response. Catalog writes invalidate after commit. Cookie/authenticated requests, orders and account data bypass public response caching; Redis failures fall back to PostgreSQL.
- Added and applied four indexes for store/newest order, store/price, category/price, and active variant pack/price lookup. Existing full-text, customer, order and relationship indexes remain. SQL projection now retrieves requested columns instead of entire records.
- Deduplicated API GETs within each server render and parallelized product details/related data. Metadata only waits for core product information.
- Added catalog navigation skeletons and immediate filter progress feedback. Product, gallery and Chai homepage images use responsive Next image delivery; lower images load lazily.
- Replaced unrelated ₹2,500–₹10,000 price bands with bands derived from actual active catalog prices. Quantity filters use active pack weights. Selecting 250 g updates cards, bounds, sorting and product links to the variant price; the selected pack persists into the product page and bag.
- Patched `proxy-addr` and `source-map-js` dependency advisories; production dependency audit reports no known vulnerabilities.

Small catalogs can legitimately use sequential scans. The pre-change production price query executed in about 1.7 ms; cross-region networking and repeated requests were the dominant observed delays. Index presence was verified after migration; no production data was added for benchmarking.

## Measurements

Client-to-production HTTP measurements include network transit and reading the response body. These are small samples, not an SLA or a controlled load test.

| Request | Before | After, warm samples |
| --- | --- | --- |
| Cached catalog API | 645–940 ms | 142–352 ms; median 148 ms across 5 hits |
| Tea catalog HTML | 2,715–4,797 ms | 285–507 ms; median 499 ms across 5 requests |

The first page request in the final sample took 1,383 ms. Scale-to-zero can still introduce cold starts; no periodic warming or database health query was added. Zero latency on every request is not achievable with network access and idle suspension.

## Verification and release

- All **21 backend tests pass**, including checkout concurrency, stock reservation, payment finalization/refunds, authorization, shipping idempotency, Redis invalidation/outage behavior and pack-price boundaries/pagination.
- All 6 workspace builds and lint tasks pass; existing lint warnings remain. `pnpm audit --prod --audit-level high` reports no known vulnerabilities.
- Production API health 200, protected orders 401 without login, active catalog six products. Under ₹250 returns Masala/Ginger; ₹250–under ₹300 returns three teas; 250 g under ₹500 returns Ginger only.
- Browser QA: selected 250 g Cardamom → product ₹599 → bag variant 250 g/subtotal ₹599. QA item removed. Admin stores/products/orders load using the new backend.
- Backend image: `performance-20261008-final`; Singapore revision `crabtile-shop-backend-00003-sbc`.
- Frontend deployment: `dpl_HxX9a65yxSDUp22fNxADYS7QbrtC`; admin: `dpl_6coVEZbCeq5uFac3HMYEHjms1Uuz`. Both aliased to their production domains, with page/API functions verified in `sin1`.
- Existing uncommitted Chai design work was preserved in the deployed storefront. This release does not enable live payments or real shipment creation.

## Future deployment

Use `scripts/deploy-backend.cjs --image <built-image>`; it defaults to Singapore. The current Artifact Registry repository is in Mumbai and is separate from request-serving runtime placement. Use `CLOUD_RUN_REGION=asia-south1` only when updating the compatibility service.

Both Vercel project defaults and app manifests select `sin1`. For CLI deployments from the monorepo root, pass `--regions sin1` and verify the function's `lambda.deployedTo`, rather than assuming the build machine's location is the execution region. [Vercel region configuration](https://vercel.com/docs/functions/configuring-functions/region).

Keep Redis on Free. Capacity increases require an explicit budget decision; the application remains functional through cache outages. Private logs, credentials, snapshots and screenshots are stored only in ignored `.local-backups/performance-20261008/`.
