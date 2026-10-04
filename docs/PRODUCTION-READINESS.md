# Production verification — 4 October 2026

## Deployed applications

- Storefront: https://shop.crabtile.com — Vercel deployment `dpl_3rFsqtyLAa1UTQkChpaqM63HgZUM`, deployed 4 October, Next.js 16.3.8.
- Admin: https://shopadmin.crabtile.com — Vercel deployment `dpl_FL33AaWnwag7z8YFCnTu3iVAYg1S`, deployed 4 October, Next.js 16.3.8.
- Backend: https://crabtile-shop-backend-jtol2jufsq-el.a.run.app — revision `crabtile-shop-backend-00015-w2w`, Ready, 100% traffic. Image tag `release-20261004-patched`, built by successful Cloud Build `7832ac1b-8ef9-4350-91ba-5353a190a68e`.
- Migration commit: `fe9be58`; admin draft-list correction: `561ad23`; production dependency updates: `6d8d2b6`, all pushed to GitHub main.

The storefront, admin and backend health endpoint were reachable on 4 October. The PostgreSQL migration replaced the dummy MongoDB commerce data. Earlier MongoDB order IDs, release checks and rollback-data instructions from the September release no longer describe the current database. Historical dummy-data preparation scripts are retired.

## Database, cache and idle scaling

The backend uses PostgreSQL through Drizzle, versioned SQL migrations, relational constraints and serializable inventory/order transactions. Neon suspend-after-five-minutes was verified during migration. The application keeps no minimum database connections, closes idle connections after ten seconds and makes no database query from `/health`.

Cloud Run's final deployed revision was inspected on 4 October: service and revision minimum instances are zero (default), automatic scaling is enabled, and CPU throttling is enabled. This permits idle scale-to-zero; traffic, open requests or external uptime requests can delay idleness. Catalog MISS then HIT responses were verified against the production Redis cache after the new deployment. Cookie-bearing catalog responses bypass shared caching and carry `private, no-store`. Authenticated/private responses bypass shared caching. Product writes invalidate catalog caches. PostgreSQL and Redis remain Secret Manager references; no MongoDB connection reference remains.

See [the deployment runbook](POSTGRES-REDIS-SHIPPING.md) for configuration and integration activation.

## Verification completed

- Production storefront and admin deployed; Google admin sign-in succeeded.
- Production email OTP delivery and verification succeeded using the user-approved test mailbox.
- Storefront product rendering, bag, server-calculated ₹199 checkout and Razorpay **test-mode** mock-bank success completed.
- QA order `ORD-MUU0M00I-5QL5F` / `6f2224e968a7cbb71f203de2` created one captured transaction `13eaf14248162adc6818a15e` / provider payment `pay_TjtNfXmj6AYeZw`.
- PostgreSQL confirmed the paid order, committed inventory and stock change from 3 to 2.
- Admin order details, addresses, payment references and transaction reconciliation displayed the same records.
- Admin Processing update persisted and appeared in customer tracking. The order was subsequently cancelled, with a QA-only note; PostgreSQL confirmed released inventory and stock restored from 2 to 3. Customer order history also showed the cancellation. No parcel was shipped and no real money was charged.
- Production product image upload succeeded after the R2 CORS origin was corrected. The uploaded image appeared in the preview.
- Production admin product creation (inactive), editing, stock adjustment (2 to 4), variant creation, billboard creation (inactive), category editing and draft-page/text-section creation succeeded. A page-list response-shape bug was found and corrected; the deployed admin now displays drafts. Publishing the QA page returned HTTP 200; unpublishing returned HTTP 404.
- Customer summaries, contact details, addresses, order history and customer receipt detail displayed the QA order consistently. QA products, category and billboard are inactive; the QA page is a draft. The records remain for audit.
- An inactive QA product and draft page returned 404 publicly. Anonymous order and transaction requests returned 401. Public catalog responses excluded the inactive fixture.
- All 20 backend integration tests passed against an isolated local PostgreSQL database and a separate Redis test namespace. Coverage includes OTP replay/attempt controls, authorization, order retry idempotency, stock races, captured-payment reconciliation, webhook signatures, refund lifecycle, page consistency and Shiprocket duplicate-request protection. Payment/shipping provider calls in these tests are simulated; this is not live-carrier or live-money validation.
- All six monorepo builds and lint tasks passed after dependency updates (lint warnings remain). The production dependency audit reports no known vulnerabilities on 4 October. Nodemailer SMTP connection verification and Razorpay test-payment retrieval passed with the updated dependencies.
- GitHub Commerce checks passed for `6d8d2b6`: [run 37217487826](https://github.com/harshKapil1999/multi-store-ecommerce/actions/runs/37217487826). Deployment-script syntax and diff whitespace checks passed.
- After fixture cleanup and the final storefront deployment, all 15 sitemap URLs returned HTTP 200, a canonical link and exactly one H1 (zero failures). Health and both production aliases returned HTTP 200; inactive QA products and the draft page remained hidden. The patched admin displayed the QA draft page after reload, and the signed-in storefront retained access to the cancelled order receipt.

Screenshots are stored locally under `.local-backups/production-qa/`, excluded from Git and deployment uploads.

## Remaining activation and verification

Razorpay's live dashboard currently disables Generate Key until the business website is approved. Website review was attempted with the real storefront URL and a truthful explanation of OTP-only reviewer login; no approved/pending website status was confirmed. Live API keys and a live webhook secret are unavailable. Cloud Run therefore remains on the existing Razorpay test key. Do not describe this deployment as accepting live payments.

Shiprocket remains disabled with inert test placeholders, as requested. Actual API credentials, pickup configuration, KYC and shipping wallet funding are required before real courier rates, shipment creation, AWB, pickup, labels and tracking can be verified.

The simulated test payment remains captured. The admin full-refund confirmation is awaiting the user's approval; no refund was submitted. Refund lifecycle and signature handling passed automated integration tests, but a production UI refund has not been completed.

Production checks exercise the workflows listed above, not every admin operation or edge case. Actual shipping and live payment/refund verification remain pending. Replace QA fixtures with the real sellable catalog before business launch; this release does not invent product or merchant details.
