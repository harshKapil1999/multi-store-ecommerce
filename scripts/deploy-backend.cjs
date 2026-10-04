#!/usr/bin/env node
// Run from repository root after tests. Secrets are read from the ignored backend
// environment and streamed to Secret Manager; they never appear in arguments/logs.
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const backendRequire = createRequire(path.resolve('apps/backend/package.json'));
const project = 'project-919e6199-4ea0-4c25-bb6';
const region = 'asia-south1';
const service = 'crabtile-shop-backend';
const runtime = `crabtile-backend-runtime@${project}.iam.gserviceaccount.com`;
const gc = args => execFileSync('gcloud', [...args, '--project', project, '--quiet'], { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
const flags = process.argv.slice(2);
try {
  const configurationFlags = flags.filter(flag => ['--configure-secrets', '--configure-shipping', '--configure-razorpay-live'].includes(flag));
  if (configurationFlags.length > 1) throw new Error('Configure one integration at a time');
  if (flags.some(flag => ['--enable-shipping', '--enable-razorpay-live'].includes(flag)) && !flags.includes('--image')) throw new Error('Enable integrations with --image <built-image>');
  if (flags.includes('--configure-secrets') || flags.includes('--configure-shipping') || flags.includes('--configure-razorpay-live')) {
    const env = backendRequire('dotenv').parse(fs.readFileSync('apps/backend/.env'));
    let secrets = {
      'backend-database-url': env.DATABASE_URL || env.DATABASE_CONNECTION_STRING,
      'backend-redis-url': env.REDIS_URL,
    };
    if (flags.includes('--configure-shipping')) {
      if (!env.SHIPROCKET_EMAIL || env.SHIPROCKET_EMAIL.endsWith('.test') || !env.SHIPROCKET_PASSWORD || env.SHIPROCKET_PASSWORD.startsWith('test-') || !env.SHIPROCKET_WEBHOOK_SECRET || env.SHIPROCKET_WEBHOOK_SECRET.startsWith('test-')) throw new Error('Replace Shiprocket test placeholders before enabling shipping');
      secrets = { 'backend-shiprocket-email': env.SHIPROCKET_EMAIL, 'backend-shiprocket-password': env.SHIPROCKET_PASSWORD, 'backend-shipping-webhook-secret': env.SHIPROCKET_WEBHOOK_SECRET };
    }
    if (flags.includes('--configure-razorpay-live')) {
      if (!/^rzp_live_[A-Za-z0-9]+$/.test(env.RAZORPAY_KEY_ID || '') || !env.RAZORPAY_KEY_SECRET || !env.RAZORPAY_WEBHOOK_SECRET) throw new Error('Live Razorpay API key and webhook secret are required');
      secrets = { 'backend-razorpay-live-key-secret': env.RAZORPAY_KEY_SECRET, 'backend-razorpay-live-webhook-secret': env.RAZORPAY_WEBHOOK_SECRET };
    }
    if (!Object.values(secrets).every(Boolean)) throw new Error('PostgreSQL and Redis URLs are required');
    for (const [name, value] of Object.entries(secrets)) {
      let exists = true;
      try { gc(['secrets', 'describe', name, '--format=value(name)']); } catch { exists = false; }
      if (!exists) gc(['secrets', 'create', name, '--replication-policy=automatic']);
      execFileSync('gcloud', ['secrets', 'versions', 'add', name, '--data-file=-', '--project', project, '--quiet'], { input: value, stdio: ['pipe', 'pipe', 'pipe'] });
      gc(['secrets', 'add-iam-policy-binding', name, `--member=serviceAccount:${runtime}`, '--role=roles/secretmanager.secretAccessor']);
      console.log(`Configured ${name}`);
    }
  }
  const imageIndex = flags.indexOf('--image');
  if (imageIndex >= 0) {
    const image = flags[imageIndex + 1];
    if (!image?.startsWith(`${region}-docker.pkg.dev/${project}/`)) throw new Error('Provide a built image from this project');
    const enableRazorpayLive = flags.includes('--enable-razorpay-live');
    const env = enableRazorpayLive ? backendRequire('dotenv').parse(fs.readFileSync('apps/backend/.env')) : {};
    if (enableRazorpayLive && !/^rzp_live_[A-Za-z0-9]+$/.test(env.RAZORPAY_KEY_ID || '')) throw new Error('Live Razorpay key ID is required');
    const liveVersion = name => {
      const version = gc(['secrets', 'versions', 'list', name, '--filter=state=ENABLED', '--sort-by=~createTime', '--limit=1', '--format=value(name)']).split('/').pop();
      if (!/^\d+$/.test(version || '')) throw new Error(`Configure ${name} before enabling live payments`);
      return version;
    };
    const liveSecrets = enableRazorpayLive ? `,RAZORPAY_KEY_SECRET=backend-razorpay-live-key-secret:${liveVersion('backend-razorpay-live-key-secret')},RAZORPAY_WEBHOOK_SECRET=backend-razorpay-live-webhook-secret:${liveVersion('backend-razorpay-live-webhook-secret')}` : '';
    console.log(gc(['run', 'deploy', service, '--region', region, '--image', image,
      '--min=0', '--min-instances=0', '--cpu-throttling', '--scaling=auto',
      '--update-secrets=DATABASE_URL=backend-database-url:latest,REDIS_URL=backend-redis-url:latest' + (flags.includes('--enable-shipping') ? ',SHIPROCKET_EMAIL=backend-shiprocket-email:latest,SHIPROCKET_PASSWORD=backend-shiprocket-password:latest,SHIPROCKET_WEBHOOK_SECRET=backend-shipping-webhook-secret:latest' : '') + liveSecrets,
      '--remove-secrets=MONGODB_URI', '--update-env-vars=DATABASE_POOL_MAX=5,CACHE_NAMESPACE=commerce-production' + (enableRazorpayLive ? `,RAZORPAY_KEY_ID=${env.RAZORPAY_KEY_ID}` : ''),
      '--format=value(status.url)']));
  } else if (!flags.includes('--configure-secrets') && !flags.includes('--configure-shipping') && !flags.includes('--configure-razorpay-live')) {
    console.log('Usage: node scripts/deploy-backend.cjs --configure-secrets | --configure-shipping | --configure-razorpay-live | --image <built-image> [--enable-shipping] [--enable-razorpay-live]');
  }
} catch (error) {
  console.error('Deployment step failed:', error.message?.split('\n')[0]);
  process.exitCode = 1;
}
