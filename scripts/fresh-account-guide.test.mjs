import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const guideUrl = new URL('../docs/FRESH_ACCOUNT_REHEARSAL.md', import.meta.url);
const readmeUrl = new URL('../README.md', import.meta.url);
const selfHostingUrl = new URL('../docs/SELF_HOSTING.md', import.meta.url);

test('fresh-account guide keeps credential, repository, DNS, and R2 boundaries explicit', async () => {
  const guide = await readFile(guideUrl, 'utf8');
  const ghMutations = guide
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^gh (?:secret|variable) set\b/.test(line));

  assert.ok(ghMutations.length >= 1);
  assert.ok(ghMutations.every((line) => line.includes('--repo $repo')));
  assert.match(guide, /never the Global API Key/i);
  assert.match(guide, /Workers Routes Edit/);
  assert.match(guide, /deploy:configure/);
  assert.match(guide, /--apply --confirm <phrase-from-dry-run>/);
  assert.match(guide, /Prepare Worker secrets/);
  assert.match(guide, /linketry-demo-admin\.pages\.dev/);
  assert.match(guide, /linketry-demo-api\.pages\.dev/);
  assert.match(guide, /DNS only/);
  assert.match(guide, /LINKETRY_DEMO_R2_BUCKET/);
  assert.match(guide, /LINKETRY_DEMO_R2_PREVIEW_BUCKET/);
  assert.match(guide, /does not mean the Cloudflare R2 service itself is disabled/);
});

test('beginner deployment docs keep one automated basic path', async () => {
  const [readme, selfHosting] = await Promise.all([
    readFile(readmeUrl, 'utf8'),
    readFile(selfHostingUrl, 'utf8'),
  ]);

  assert.match(readme, /deploy:bootstrap/);
  assert.match(readme, /deploy:configure/);
  assert.match(readme, /Prepare Worker secrets/);
  assert.doesNotMatch(readme, /LINKETRY_APPROVED_RELEASE=0\.15\.0/);
  assert.match(selfHosting, /Workers Routes Edit/);
  assert.match(selfHosting, /Configure GitHub And Deploy \(Recommended\)/);
  assert.match(selfHosting, /Advanced Manual Deployment/);
  assert.match(selfHosting, /wrangler deploy --secrets-file|deploys Worker secrets alongside/);
  assert.doesNotMatch(selfHosting, /Ensure LINKETRY_ADMIN_TOKEN secret/);
  assert.match(selfHosting, /LINKETRY_WORKER_DOMAINS=go\.example\.com/);
  assert.doesNotMatch(selfHosting, /^LINKETRY_VERSION=/m);
});
