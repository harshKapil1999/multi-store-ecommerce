# Production Deployment Runbook

This document describes the production deployment used by Crabtile Shop and
the procedure for deploying future changes.

## Production topology

| Component | Platform | Region or edge | Production address |
| --- | --- | --- | --- |
| Storefront | Vercel | Global edge | `https://shop.crabtile.com` |
| Admin | Vercel | Global edge | `https://shopadmin.crabtile.com` |
| API | Google Cloud Run | `asia-south1` (Mumbai) | `https://shopbackend.crabtile.com` |
| API origin | Google Cloud Run | `asia-south1` (Mumbai) | `https://crabtile-shop-backend-jtol2jufsq-el.a.run.app` |
| API domain proxy | Firebase Hosting | Global edge to Cloud Run | `shopbackend.crabtile.com` |
| Database | MongoDB Atlas | Managed | Stored in Secret Manager |
| Media | Cloudflare R2 | Managed | Configured in Cloud Run |
| DNS | Hostinger | Managed | `crabtile.com` zone |

Google Cloud project:

```text
project-919e6199-4ea0-4c25-bb6
```

Cloud Run service:

```text
crabtile-shop-backend
```

Direct Cloud Run domain mappings are not supported in `asia-south1`, so
Firebase Hosting owns the backend certificate and rewrites requests to the
Cloud Run service in Mumbai. Do not remove the Firebase Hosting site while the
custom backend domain is in use.

## Required tools

Install and authenticate these tools before deploying:

```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate
gcloud auth login
gcloud auth application-default login
gcloud config set project project-919e6199-4ea0-4c25-bb6
npx vercel@latest login
```

Run all commands from the repository root unless a command says otherwise.

## Pre-deployment checks

Never deploy a working tree that has not passed these checks:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
git status --short
```

Review dependency vulnerabilities separately before a production release:

```bash
pnpm audit --prod
```

Do not commit `.env`, `.env.local`, Firebase private keys, SMTP passwords,
database URLs, Razorpay secrets, or Vercel tokens.

## Backend: first-time Google Cloud setup

The following APIs and Docker repository must exist once per project:

```bash
PROJECT_ID=project-919e6199-4ea0-4c25-bb6
REGION=asia-south1
REPOSITORY=cloud-run-source-deploy

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  firebase.googleapis.com \
  firebasehosting.googleapis.com \
  --project "$PROJECT_ID"

gcloud artifacts repositories describe "$REPOSITORY" \
  --location "$REGION" \
  --project "$PROJECT_ID" >/dev/null 2>&1 || \
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format docker \
  --location "$REGION" \
  --project "$PROJECT_ID"
```

The runtime service account needs only the permissions used by the backend.
It must have Secret Manager Secret Accessor for the referenced secrets. Avoid
using the project owner account as the Cloud Run runtime identity.

## Backend secrets and configuration

Production secrets are stored in Google Secret Manager. Current secret names:

```text
backend-mongodb-uri
backend-jwt-secret
backend-session-secret
backend-r2-access-key-id
backend-r2-secret-access-key
backend-smtp-pass
backend-razorpay-key-secret
backend-razorpay-webhook-secret
```

Create a secret without placing its value in shell history:

```bash
read -rs SECRET_VALUE
printf %s "$SECRET_VALUE" | gcloud secrets create SECRET_NAME \
  --data-file=- \
  --replication-policy=automatic
unset SECRET_VALUE
```

Add a new version to an existing secret:

```bash
read -rs SECRET_VALUE
printf %s "$SECRET_VALUE" | gcloud secrets versions add SECRET_NAME \
  --data-file=-
unset SECRET_VALUE
```

Cloud Run maps secrets to environment variables. Keep non-secret settings such
as URLs, ports, bucket names, and sender aliases in regular environment
variables. The required CORS configuration is:

```text
FRONTEND_URL=https://shop.crabtile.com
ADMIN_URL=https://shopadmin.crabtile.com
PUBLIC_STOREFRONT_URL=https://shop.crabtile.com
ALLOWED_ORIGINS=https://shop.crabtile.com,https://shopadmin.crabtile.com
```

Use the existing service configuration as the source of truth:

```bash
gcloud run services describe crabtile-shop-backend \
  --region asia-south1 \
  --project project-919e6199-4ea0-4c25-bb6 \
  --format export > /tmp/crabtile-shop-backend.yaml
```

Never commit the exported file because it may contain environment metadata.

### Transactional email sender

Use the primary Hostinger mailbox only for SMTP authentication and use the
purpose-specific Crabtile aliases as the visible sender addresses. An alias
does not have its own SMTP password.

```text
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<primary-hostinger-mailbox>@crabtile.com
SMTP_FROM=shop@crabtile.com
MAIL_FROM_NAME=Crabtile Shop
MAIL_FROM_AUTH=noreply@crabtile.com
MAIL_FROM_ORDERS=orders@crabtile.com
MAIL_REPLY_TO_ORDERS=orders@crabtile.com
MAIL_REPLY_TO_SUPPORT=support@crabtile.com
```

Replace the `backend-smtp-pass` secret with the Hostinger primary mailbox
password before changing `SMTP_HOST`. Then deploy a new Cloud Run revision and
send one OTP plus one order-status test email. Hostinger SPF and DKIM records
must remain enabled; publish a DMARC record before moving Razorpay to live
payments.

## Backend: deploy future changes

The checked-in `cloudbuild.backend.yaml` builds the monorepo with
`Dockerfile.backend` and pushes an immutable image tag.

```bash
PROJECT_ID=project-919e6199-4ea0-4c25-bb6
REGION=asia-south1
REPOSITORY=cloud-run-source-deploy
SERVICE=crabtile-shop-backend
TAG="$(git rev-parse --short HEAD)-$(date +%Y%m%d%H%M%S)"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$SERVICE:$TAG"

gcloud builds submit . \
  --project "$PROJECT_ID" \
  --config cloudbuild.backend.yaml \
  --substitutions "_REGION=$REGION,_REPOSITORY=$REPOSITORY,_SERVICE=$SERVICE,_TAG=$TAG"

gcloud run deploy "$SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --image "$IMAGE" \
  --quiet
```

Supplying only the new image preserves the service's existing secrets,
service account, scaling, port, CORS configuration, and public IAM policy.
Inspect the generated revision before moving on.

```bash
gcloud run services describe "$SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format='value(status.latestReadyRevisionName,status.url)'
```

## Backend verification

Verify both the Cloud Run origin and custom domain:

```bash
curl --fail --show-error \
  https://crabtile-shop-backend-jtol2jufsq-el.a.run.app/health

curl --fail --show-error \
  "https://shopbackend.crabtile.com/health?probe=$(date +%s)"

curl --fail --show-error \
  -H 'Origin: https://shop.crabtile.com' \
  -D - \
  https://shopbackend.crabtile.com/api/v1/stores
```

The last response must include an `Access-Control-Allow-Origin` header for the
request origin. The timestamp also avoids reading a stale Firebase edge entry
immediately after first attaching or changing the custom domain. Do not bypass
TLS verification in production checks.

Check the certificate:

```bash
openssl s_client \
  -connect shopbackend.crabtile.com:443 \
  -servername shopbackend.crabtile.com </dev/null 2>/dev/null | \
openssl x509 -noout -issuer -dates -ext subjectAltName
```

The subject alternative names must contain `shopbackend.crabtile.com`.

## Backend rollback

List revisions and send traffic back to a known-good revision:

```bash
gcloud run revisions list \
  --service crabtile-shop-backend \
  --region asia-south1 \
  --project project-919e6199-4ea0-4c25-bb6

gcloud run services update-traffic crabtile-shop-backend \
  --region asia-south1 \
  --project project-919e6199-4ea0-4c25-bb6 \
  --to-revisions REVISION_NAME=100
```

Do not delete the failed revision until the incident is understood.

## Frontend and admin: Vercel configuration

This repository uses two independent Vercel projects:

| App | Vercel project | Project root | Domain |
| --- | --- | --- | --- |
| Storefront | `crabtile-shop-frontend` | `apps/frontend` | `shop.crabtile.com` |
| Admin | `crabtile-shop-admin` | `apps/admin` | `shopadmin.crabtile.com` |

Vercel must install dependencies from the pnpm workspace and build the selected
Next.js app. Do not deploy the repository root as a single Next.js project.

Storefront production environment:

```text
NEXT_PUBLIC_API_URL=https://shopbackend.crabtile.com/api/v1
```

Admin production environment:

```text
NEXT_PUBLIC_API_URL=https://shopbackend.crabtile.com/api/v1
NEXT_PUBLIC_FRONTEND_URL=https://shop.crabtile.com
SESSION_SECRET=<secret>
NEXT_PUBLIC_FIREBASE_API_KEY=<Firebase web config>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<Firebase web config>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<Firebase web config>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<Firebase web config>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<Firebase web config>
NEXT_PUBLIC_FIREBASE_APP_ID=<Firebase web config>
FIREBASE_PROJECT_ID=<Firebase Admin project>
FIREBASE_ADMIN_EMAILS=<comma-separated allowlist>
```

Firebase web configuration values are public identifiers. The server verifies
Firebase ID tokens against Google's published signing keys, so no Firebase
service-account private key is required by the admin deployment. The session
secret is private and must remain encrypted in Vercel.

## Frontend and admin: deploy future changes

For a manual production deployment, run Vercel from the repository root so the
pnpm workspace files and shared packages are included. Link the root to the app
being deployed, then deploy it:

```bash
npx vercel@latest link --cwd . --yes --project crabtile-shop-frontend
npx vercel@latest --cwd . --prod --archive=tgz

npx vercel@latest link --cwd . --yes --project crabtile-shop-admin
npx vercel@latest --cwd . --prod --archive=tgz
```

The Vercel project settings continue to select `apps/frontend` or `apps/admin`
as the project root. Do not run a manual upload with `--cwd apps/frontend` or
`--cwd apps/admin`; those directories do not contain the complete workspace.

Vercel production environment variable changes only affect new deployments.
Redeploy after changing a variable.

Both projects are connected to
`https://github.com/harshKapil1999/multi-store-ecommerce.git`:

```text
crabtile-shop-frontend -> apps/frontend
crabtile-shop-admin    -> apps/admin
```

For normal releases, merge or push a verified commit to `main`. Vercel builds
both production projects automatically, while pull requests create Preview
deployments. Confirm both deployments are Ready before considering the release
complete. Manual uploads remain a recovery path, not the normal CI/CD path.

## Vercel rollback

Open the affected Vercel project, select Deployments, open the last known-good
production deployment, and choose Promote to Production. This changes the
production alias without rebuilding the application.

## DNS records

Hostinger owns the authoritative DNS zone. The expected records are:

```text
CNAME shop        2b548f4b017052e6.vercel-dns-017.com
CNAME shopadmin   959bcafbba84e327.vercel-dns-017.com
CNAME shopbackend project-919e6199-4ea0-4c25-bb6.web.app
```

These targets are project-specific. If a domain is removed and re-added, use
the current target shown by Vercel rather than assuming the value above remains
unchanged. Keep TTL at 300 seconds during setup; it can be increased after all
domains are stable.

Verify DNS independently:

```bash
dig +short shop.crabtile.com CNAME
dig +short shopadmin.crabtile.com CNAME
dig +short shopbackend.crabtile.com CNAME
```

## Razorpay webhook

Test and Live modes have separate webhook configuration. The webhook endpoint
is:

```text
https://shopbackend.crabtile.com/api/v1/payment/webhook
```

Subscribe to:

```text
payment.captured
payment.failed
order.paid
refund.created
```

The dashboard webhook secret must exactly match the value in
`backend-razorpay-webhook-secret`. Never log this value. Remove obsolete ngrok
webhooks before end-to-end testing so the same event is not sent to multiple
endpoints.

## Release checklist

1. Build and lint the monorepo.
2. Deploy the backend and verify both health URLs.
3. Run an API request with storefront and admin CORS origins.
4. Deploy the storefront and admin.
5. Verify all three certificates and domains.
6. Test Firebase admin sign-in and sign-out.
7. Test store discovery, search, product pages, wishlist, and cart isolation.
8. Complete a Razorpay test payment and verify one order and one transaction.
9. Confirm the customer order email, invoice email, and admin order view.
10. Test order tracking with the order email and identifier.
11. Check Cloud Run and Vercel logs for new errors.
12. Record the deployed Git commit and deployment URLs in the release notes.

## Incident safety rules

- Roll back application revisions; do not rotate or delete secrets during an
  unrelated application incident.
- Do not change DNS and application code simultaneously unless required.
- Do not point production at localhost, ngrok, a preview deployment, or a test
  database.
- Keep Cloud Run's direct URL available for diagnosis, but use the custom API
  domain in customer-facing application configuration after its TLS certificate
  is valid.
- Treat payment webhook delivery as at-least-once. Order creation must remain
  idempotent for repeated Razorpay event IDs.
