# PostgreSQL, Redis and shipping

The backend now uses PostgreSQL through Drizzle and `pg`; MongoDB is no longer a runtime dependency. Run `pnpm --filter @repo/backend build` followed by `pnpm --filter @repo/backend db:migrate` before deploying a new schema. Migrations are explicit release steps, never request-time or startup jobs.

## Environment

Set `DATABASE_URL` (preferred) or the existing `DATABASE_CONNECTION_STRING`. For Neon, use the pooled endpoint and `sslmode=verify-full`. `DATABASE_POOL_MAX` defaults to 5, minimum connections is zero, and idle connections close after 10 seconds. Redis uses `REDIS_URL`; set `CACHE_NAMESPACE` differently for production, staging and tests.

`SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` must belong to a Shiprocket API user. The supplied `.test` email and `test-` password are deliberately inert placeholders, not vendor sandbox credentials. Shiprocket calls affect its real account; automated tests mock that API. Complete KYC, add/verify the pickup address and fund the wallet before dispatch.

Set `SHIPROCKET_WEBHOOK_SECRET` to a random secret, then configure Shiprocket Settings → Webhooks with:

- URL: `https://crabtile-shop-backend-jtol2jufsq-el.a.run.app/api/v1/delivery/events`
- Security token: the same secret (sent as `x-api-key`).
- Tracking events enabled.

To activate shipping after replacing placeholders, run `node scripts/deploy-backend.cjs --configure-shipping`, then deploy the built backend image with `node scripts/deploy-backend.cjs --image <image> --enable-shipping`. Finally configure the webhook URL/token in Shiprocket. The normal database deployment leaves shipping disabled until those credentials are supplied.

Do not put secrets in frontend variables, Git, URLs, or logs. Cloud Run uses Secret Manager references.

## Storage and correctness

Scalar fields have SQL columns, money uses fixed precision decimals, and nested address, item and page section values use JSONB. Existing 24-character string IDs and JSON API shapes remain supported. Unique constraints enforce checkout idempotency, email, SKU and store-scoped slugs. Foreign keys protect core relationships. Only one home page per store is allowed.

Checkout, payment capture, stock release, refunds and home-page changes use serializable SQL transactions with bounded retries. Inventory decrement is a conditional SQL update. Duplicate or concurrent payment and checkout requests do not decrement inventory twice. SQL timestamps use millisecond precision to match JavaScript optimistic-concurrency comparisons. Customer summaries aggregate and paginate in SQL. Search uses PostgreSQL full-text and bounded fuzzy candidates.

## Caching

Only successful anonymous catalog GET responses are cached (60 seconds, at most 512 KB). Requests with cookies or authorization, customer records, orders, payment, admin and newsletter endpoints bypass response caching. All catalog mutations and inventory changes rotate a shared Redis generation after commit; concurrent readers can only fill their previous generation. Generation eviction creates a new random generation. During a Redis outage the database remains authoritative; short TTLs bound old cached values after recovery. No cache is used to authorize users or reserve inventory.

Courier quotes are cached for five minutes by account, pickup/delivery pincodes, COD and parcel dimensions. Tracking is cached for one minute and fetched only after order authorization. Redis operations have bounded timeouts and fail open. The existing per-process HTTP rate limit remains a separate abuse-control layer; Redis is not used as a durable order queue.

## Shipping workflow

In the admin order page, enter the actual packed weight (kg), dimensions (cm), and exact pickup-location name and pincode. Check courier rates, create the shipment, assign the chosen courier, schedule pickup and generate the label. Checkout's configured shipping fee remains the customer charge; courier quotes are fulfillment costs.

Only paid or COD orders with committed inventory can be shipped. Shipment creation and each provider mutation are claimed in PostgreSQL first. An ambiguous response moves the operation to `needs_review` and prevents automatic retries. Use the Shiprocket order ID to reconcile its actual state before continuing. The same application order ID is always supplied as the vendor reference. No background worker or timer is needed.

Cancellation remains pending until confirmed by webhook or reconciliation. Active or uncertain shipments block local order cancellation/stock release; externally processed refunds do not replenish inventory while a shipment is active. Webhooks authenticate the security token, bind provider IDs/AWB, serialize updates with orders, ignore older events, and never regress a delivered order. COD delivery marks the payment collected. Shipment creation or AWB assignment alone does not mark an order shipped.

API routes under `/api/v1/orders/:id/shipment`: GET details, POST create, POST `/rates`, POST `/assign`, POST `/pickup`, POST `/label`, POST `/cancel`, POST `/reconcile`, GET `/tracking`. Management operations require admin or owning store manager; customers can only read their own shipment/tracking.

## Scale to zero

Neon production compute is configured to suspend after five minutes without activity. `/health` is process liveness only and never connects to PostgreSQL. Do not attach scheduled database pings or recurring HTTP warmers. Open SQL editors and external clients can keep a compute active.

Cloud Run must have BOTH service `--min=0` and revision `--min-instances=0`, automatic scaling and request-based CPU billing (`--cpu-throttling`). The checked-in deployment script sets these every release. Cloud Run determines when an idle instance is removed; zero is not instantaneous. Storage, Redis and network charges are independent of idle compute.

## Tests

Provide an isolated PostgreSQL database in `TEST_DATABASE_URL` and optionally `TEST_REDIS_URL`, then run `pnpm --filter @repo/backend test`. The tests truncate that PostgreSQL database and must never use the application database. CI provisions PostgreSQL and Redis services. Redis tests use a random namespace and expiring keys; no shared database flush is performed.

References: [Neon scale to zero](https://neon.com/docs/introduction/scale-to-zero), [Cloud Run minimum instances](https://cloud.google.com/run/docs/configuring/min-instances), [Shiprocket API documentation](https://www.postman.com/shiprocketdev/shiprocket-dev-s-public-workspace/documentation/qu05zax/shiprocket-api).
