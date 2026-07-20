import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const workerPackage = JSON.parse(read('apps/worker/package.json'));
const readme = read('README.md');
const security = read('SECURITY.md');
const support = read('SUPPORT.md');
const productGap = read('docs/PRODUCT_GAP_AUDIT.md');

test('security reports use a private channel and prohibit credential disclosure', () => {
  assert.match(
    security,
    /https:\/\/github\.com\/everett7623\/Linketry\/security\/advisories\/new/
  );
  assert.match(security, /Do not open a public issue/i);
  assert.match(security, /must enable.*Private vulnerability reporting/is);
  assert.match(security, /minimal public issue requesting a private security contact/i);
  assert.match(security, /Do not include the vulnerability/i);
  assert.match(security, /revoke or rotate/i);
  assert.match(security, /Cloudflare API token/);
  assert.match(security, /best-effort targets, not a paid-support SLA/i);
});

test('support policy fixes one pre-1.0 compatibility and rollback contract', () => {
  assert.match(support, /Patch releases \(`0\.x\.y`\).*preserve documented `\/api\/v1` contracts/s);
  assert.match(support, /Minor releases \(`0\.x\.0`\).*Breaking changes/s);
  assert.match(support, /Applied migrations are forward-only/);
  assert.match(support, /If no migration was applied/);
  assert.match(support, /If a migration or data mutation was applied/);
  assert.match(support, /D1 is the source of truth/i);
  assert.match(support, /Deleting KV can force safe cache repopulation/i);
});

test('documented toolchain matches package metadata and public navigation', () => {
  assert.deepEqual(packageJson.engines, { node: '>=24 <25', npm: '>=10' });
  assert.match(workerPackage.devDependencies.wrangler, /^\^4\.111\.0$/);
  assert.match(support, /Node\.js \| 24\.x/);
  assert.match(support, /Wrangler \| 4\.111\.0 or newer within major version 4/);
  assert.match(readme, /\[Security policy\]\(SECURITY\.md\)/);
  assert.match(readme, /\[Support and compatibility\]\(SUPPORT\.md\)/);
  assert.doesNotMatch(`${readme}\n${read('docs/SELF_HOSTING.md')}\n${read('docs/DEVELOPMENT.md')}`, /Node\.js 24 recommended/);
  assert.match(productGap, /Completed In 0\.28\.3/);
  assert.match(productGap, /Private vulnerability reporting activation/);
  assert.doesNotMatch(productGap, /Publish a stable pre-1\.0 compatibility policy/);
});
