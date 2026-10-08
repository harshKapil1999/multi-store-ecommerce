#!/usr/bin/env node
// Clone the live Hosting version, preserving files/configuration, and move only
// the existing commerce API rewrite. Prior releases remain available for rollback.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const project = 'project-919e6199-4ea0-4c25-bb6';
const site = `sites/${project}`;
const base = 'https://firebasehosting.googleapis.com/v1beta1/';
async function main() {
  const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  async function request(path, method = 'GET', body) {
    const response = await fetch(base + path, { method, signal: AbortSignal.timeout(30_000),
      headers: { Authorization: `Bearer ${token}`, 'X-Goog-User-Project': project, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error?.message || `Hosting request failed: ${response.status}`);
    return json;
  }
  const releases = await request(`${site}/releases?pageSize=1`);
  const sourceName = releases.releases?.[0]?.version?.name;
  if (!sourceName) throw new Error('No live Hosting version found');
  const source = await request(sourceName);
  const rewrite = source.config?.rewrites?.find(r => r.run?.serviceId === 'crabtile-shop-backend');
  if (!rewrite) throw new Error('Existing commerce API rewrite not found');
  if (rewrite.run.region === 'asia-southeast1') { console.log('API domain already points to Singapore'); return; }
  const dir = '.local-backups/performance-20261008'; fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/firebase-hosting-before.json`, JSON.stringify(source, null, 2), { mode: 0o600 });
  const config = structuredClone(source.config);
  config.rewrites.find(r => r.run?.serviceId === 'crabtile-shop-backend').run.region = 'asia-southeast1';
  let operation = await request(`${site}/versions:clone`, 'POST', { sourceVersion: sourceName, finalize: false });
  for (let attempt = 0; !operation.done && attempt < 30; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    operation = await request(operation.name);
  }
  if (!operation.done || operation.error) throw new Error('Hosting clone did not complete successfully');
  const versionName = operation.response?.name;
  if (!versionName?.startsWith(`${site}/versions/`)) throw new Error('Unexpected cloned version');
  // fileCount is populated at finalization. Verify actual paths/hashes while
  // this cloned version is still editable, before publishing anything.
  const sourceFiles = await request(`${sourceName}/files?pageSize=1000`);
  const cloneFiles = await request(`${versionName}/files?pageSize=1000`);
  const manifest = files => JSON.stringify((files.files || []).map(f => [f.path, f.hash]).sort((a, b) => a[0].localeCompare(b[0])));
  if (sourceFiles.nextPageToken || cloneFiles.nextPageToken || manifest(sourceFiles) !== manifest(cloneFiles)) {
    throw new Error('Clone file manifest differs or exceeds verification limit; release stopped');
  }
  await request(`${versionName}?updateMask=config,status`, 'PATCH', { name: versionName, config, status: 'FINALIZED' });
  const release = await request(`${site}/releases?versionName=${encodeURIComponent(versionName)}`, 'POST', { message: 'Move commerce API rewrite to Singapore; preserve hosted files' });
  console.log(JSON.stringify({ release: release.name, version: versionName, region: 'asia-southeast1' }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
