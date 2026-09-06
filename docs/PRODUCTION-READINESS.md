# Crabtile release — 6 September 2026

## Deployed applications

- Storefront: https://shop.crabtile.com
- Admin: https://shopadmin.crabtile.com
- API: https://shopbackend.crabtile.com
- Backend revision: `crabtile-shop-backend-00013-thz` (100% traffic).
- Cloud Build: `13ccb429-123a-4b6b-a580-a31c3f48e4da`.
- Initial storefront deployment: `dpl_5q2zw8UPxdvfMEusJhRVvKH4qR2h`.
- Initial admin deployment: `dpl_41ajvygVw5ebsXwZivya5kDuiywR`.

## Completed work

Email OTPs use cryptographic generation, hashed storage, bounded attempts, an atomic one-time consume operation, and a per-email resend delay. Registration cannot assign privileged roles. Customer tokens use the current database identity; customer email changes require fresh verification. Upload endpoints require store-manager access. Public reads exclude inactive stores and draft catalog records. Page writes validate allowed fields and sanitize HTML. Tenant checks protect catalog references and customer/order access. Personal API responses are not cacheable. Admin authentication checks verified Firebase email and the configured allowlist; the admin backend bridge checks mutation origin. Dependencies were updated and the production audit reports zero known advisories as of this release.

Checkout validates Indian delivery details and verified customer identity, calculates price and shipping from database records, requires valid variants, and creates one order per checkout key. Transactions coordinate inventory with COD orders and captured payments. Repeated captures, delayed failures, order retries and concurrent purchases cannot debit stock twice or oversell available stock. Captured payments with unavailable inventory are recorded as paid and flagged for manual review, preventing silent loss of payment evidence. Refunds reconcile with Razorpay and are full-refund only in the admin. Undispatched inventory is restored once on cancellation or full refund.

The admin now has complete paid-order revenue totals, paginated products and transactions, customer history, addresses, payment references, fulfillment notes, tracking details, and guarded order transitions. Category ordering and homepage section order follow saved admin settings. Sections and selected categories/products can be added, removed and reordered. Store settings include contact, shipping, return/refund windows, SEO, grievance contact and optional tax registration fields. Stores containing records must be deactivated instead of deleted.

The storefront has a redesigned Crabtile collection landing page, a simplified Nike homepage, configurable catalog sections, working product/category links, category/product filtering, sort and pagination, account profiles, saved addresses, order history, automatic tracking refresh, receipts and marketing unsubscribe. Removed hardcoded product selectors, duplicate homepage sections, placeholder category copy and unrelated importer text. Existing factual product descriptions still require merchant review before replacing the test catalog.

Public pages include About, Contact, Terms, Privacy (including purposes of data collection), Shipping, and Returns/Refunds. Defaults use Crabtile in Himachal Pradesh, India. A published CMS page with the corresponding slug overrides its default store policy. SEO includes server-rendered metadata, canonicals, social cards, Product and Breadcrumb structured data, sitemap and robots rules. Account, checkout, cart, wishlist, search and admin surfaces are not intended for indexing. Search engine indexing/ranking is not guaranteed.

## Verification

- Frozen lockfile installation and monorepo production build passed.
- Lint passed with zero errors; existing warning debt remains (primarily typing, unused imports and image optimization).
- 14 isolated MongoDB replica-set integration tests passed. Tests never connect to production or send email.
- All 24 sitemap pages returned HTTP 200, a canonical link and exactly one H1.
- Deleted-store route returned 404; anonymous private-order request returned 401.
- Live OTP delivery to the supplied test mailbox and browser verification passed.
- Saved address persisted and was selected at checkout.
- Razorpay **test-mode** payment created one captured transaction and one paid order; product stock changed exactly once.
- Test order `ORD-MTPSC3TD-GN0EN` / `6a9d5bca17e2954fdcdcf818` completed processing, simulated dispatch and simulated delivery. Customer tracking refreshed automatically with each note and carrier detail. No goods were shipped and no real money was charged.
- Mobile landing and catalog fit a 390 px viewport; price sorting passed. Closed mobile navigation and collapsed category links are excluded from keyboard/accessibility navigation.
- Test refund initiation remains blocked: Razorpay returned HTTP 400, `invalid request sent`, through both its SDK and direct documented API. Provider inspection confirmed no refund exists and the payment is still captured. The admin now clears a definitively rejected refund claim and shows the error; uncertain network failures remain pending for reconciliation. Automated refund lifecycle and duplicate-webhook tests pass.
- The one QA item was restored to stock (4 → 5) in a guarded database transaction. The order/payment evidence remains for audit, with a test-cleanup note.
- GitHub Actions now runs installation, lint, build, isolated commerce tests and the production dependency audit on pull requests and main pushes.
- Test payment reference: `pay_TYkbiCYt0BbSwO`; transaction `6a9d5bcb17e2954fdcdcf82a`.

## Store cleanup and recovery

Only the explicitly requested, empty Adidas and Puma stores were removed. Nike's 11 pre-existing orders were preserved. The migration writes a private backup to `.local-backups/` before changing records; backups are excluded from Git, Docker, Vercel and Cloud Build uploads. `scripts/finalize-production.cjs` previews unless `--apply` is supplied. Do not rerun it casually: it resets Nike's launch homepage settings. `scripts/verify-release-order.cjs` verifies only the named QA order. Back up and review any future data migration separately.

Rollback application revisions using `docs/DEPLOYMENT.md`. Do not restore the full database backup over subsequent customer purchases. A data rollback should restore only the specific affected catalog/configuration documents after checking current records.

## Launch inputs still required from the business

1. Replace the test products, imagery, sizes, stock, descriptions and brand claims with your actual sellable catalog. Confirm MRP, tax treatment, country of origin and manufacturer/importer details where applicable. Receipts are not a substitute for a compliant GST tax invoice when one is required.
2. Complete the actual correspondence/return address, grievance officer contact and customer-support details in Store settings. The phone was intentionally left blank at your request. The policy defaults need business/legal review against actual operations; this release is not a compliance certification.
3. Review the configured shipping charge (₹99, free from ₹2,500), COD availability, dispatch (2 business days), delivery (3–7 business days after dispatch), returns (7 days) and refunds (7 business days). These are editable operating commitments, not carrier integrations or guaranteed delivery dates.
4. Resolve the test refund API rejection with Razorpay and complete a successful provider refund before accepting real orders. Switch Razorpay to live keys only when the merchant account is ready. Test and live webhooks are separate: subscribe to payment.captured, payment.failed, order.paid, refund.created, refund.processed and refund.failed with the matching secret. The existing test custom-domain webhook was updated to include refund lifecycle events. Two existing webhook URLs target this backend; duplicate deliveries are handled idempotently.
5. Business aliases exist in Hostinger, but SMTP currently authenticates through the existing Gmail configuration. OTP delivery was verified. Configure the business mailbox credentials through Secret Manager, then verify SPF/DKIM/DMARC and sender alignment before volume sending. Do not paste credentials into source or chat.
6. Verify domain ownership in Google Search Console and submit `/sitemap.xml`. Configure `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` only with the real verification token. Add actual product data before requesting indexing of the final catalog.

## Daily order handling

Review Orders for pending online payments and paid orders needing inventory review. Never dispatch a review order until inventory and payment are reconciled; refund the captured payment if it cannot be fulfilled. Normal orders progress Confirmed → Processing → Shipped → Delivered. Before marking Shipped, enter a real carrier and tracking number; use an HTTPS tracking link. Customer notes are public to that customer and are included in transactional updates. Mark COD delivered only once collection has been confirmed; this marks its payment paid.

Cancel before dispatch to return committed stock once. For online refunds use Transactions → payment → Issue full refund, and wait for provider confirmation. If a refund remains pending after a network error, reconcile in Razorpay before retrying. Partial refunds are handled and reconciled through Razorpay; the admin initiates full refunds only. For shipped returns, inspect the returned goods and adjust stock manually after accepting the return. A refund does not automatically assert that shipped goods have returned to inventory.

Review Cloud Run errors and Razorpay webhook delivery failures. The email transport is best effort for order updates: a persisted order remains authoritative if email fails; there is no durable retry queue in this release. General IP rate limits are per running backend instance; OTP resend and consumption controls persist in MongoDB. Configure monitoring/alerting, database backup retention and a restore drill for your operating requirements before scaling sales. This audit and testing reduce risk; they do not establish that every possible defect or vulnerability is absent.

## Reference documentation

- [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Razorpay webhooks](https://razorpay.com/docs/webhooks/)
- [Department of Consumer Affairs consumer protection rules](https://consumeraffairs.nic.in/acts-and-rules/consumer-protection/consumer-protection)
