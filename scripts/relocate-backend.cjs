#!/usr/bin/env node
// Preserve the deployed service's configuration and secret references when
// creating the Singapore service. The source remains available for rollback.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const project = 'project-919e6199-4ea0-4c25-bb6';
const service = 'crabtile-shop-backend';
const region = 'asia-southeast1';
const image = process.argv[process.argv.indexOf('--image') + 1];
if (!process.argv.includes('--image') || !['asia-south1', region].some(r => image?.startsWith(`${r}-docker.pkg.dev/${project}/`))) {
  throw new Error('Provide --image <built image from this project>');
}
const gc = args => execFileSync('gcloud', [...args, '--project', project, '--quiet'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const source = JSON.parse(gc(['run', 'services', 'describe', service, '--region=asia-south1', '--format=json']));
const template = source.spec.template;
delete template.metadata.name;
delete template.metadata.labels;
template.metadata.annotations = {
  'autoscaling.knative.dev/maxScale': '10',
  'run.googleapis.com/cpu-throttling': 'true',
  'run.googleapis.com/execution-environment': 'gen2',
  'run.googleapis.com/startup-cpu-boost': 'true',
};
template.spec.containers[0].image = image;
const config = { apiVersion: 'serving.knative.dev/v1', kind: 'Service',
  metadata: { name: service, annotations: { 'run.googleapis.com/ingress': 'all', 'run.googleapis.com/scalingMode': 'automatic' } },
  spec: { template, traffic: [{ latestRevision: true, percent: 100 }] } };
const dir = path.resolve('.local-backups/performance-20261008');fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'singapore-service.json');fs.writeFileSync(file, JSON.stringify(config), { mode: 0o600 });
gc(['run', 'services', 'replace', file, '--region', region, '--format=value(status.url)']);
// Preserve the existing public commerce API access model.
gc(['run', 'services', 'add-iam-policy-binding', service, '--region', region, '--member=allUsers', '--role=roles/run.invoker']);
console.log(gc(['run', 'services', 'describe', service, '--region', region, '--format=value(status.url)']));
