import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { verifyDemoLiveParity } from './demo-live-smoke.mjs';

const version = '0.29.0';
const adminOrigin = 'https://demo.linketry.com';
const apiOrigin = 'https://linketry-demo-worker.example.workers.dev';
const darkLogo = readFileSync(new URL('../apps/admin/public/favicon.svg', import.meta.url));
const lightLogo = readFileSync(new URL('../apps/admin/public/favicon-light.svg', import.meta.url));

function response(body, init = {}) {
  return new Response(
    typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      ...init,
    }
  );
}

function createFetch({ advertisedVersion = version, writeStatus = 403 } = {}) {
  return async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.origin === adminOrigin && url.pathname === '/') {
      return response(
        `<meta name="linketry-version" content="${advertisedVersion}"><link href="/favicon.svg"><link href="/favicon-light.svg">`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    if (url.origin === adminOrigin && url.pathname === '/favicon.svg') return response(darkLogo);
    if (url.origin === adminOrigin && url.pathname === '/favicon-light.svg')
      return response(lightLogo);
    if (url.pathname === '/health') {
      return response({ success: true, data: { status: 'ok', version } });
    }
    if (init.method === 'POST') {
      return response({ success: false, error: 'read-only' }, { status: writeStatus });
    }
    return response({ success: true, data: {} });
  };
}

test('Admin and project site use identical canonical dark and light brand assets', () => {
  assert.deepEqual(
    readFileSync(new URL('../apps/admin/public/favicon.svg', import.meta.url)),
    readFileSync(new URL('../apps/site/public/favicon.svg', import.meta.url))
  );
  assert.deepEqual(
    readFileSync(new URL('../apps/admin/public/favicon-light.svg', import.meta.url)),
    readFileSync(new URL('../apps/site/public/favicon-light.svg', import.meta.url))
  );

  const index = readFileSync(new URL('../apps/admin/index.html', import.meta.url), 'utf8');
  assert.match(index, new RegExp(`href="/favicon\\.svg\\?v=${version.replaceAll('.', '\\.')}"`));
  assert.match(
    index,
    new RegExp(`href="/favicon-light\\.svg\\?v=${version.replaceAll('.', '\\.')}"`)
  );
  assert.match(index, /preference = stored === 'light' \|\| stored === 'dark' \? stored : 'dark'/);
});

test('Demo and production Admin share the complete route inventory', () => {
  const app = readFileSync(new URL('../apps/admin/src/App.tsx', import.meta.url), 'utf8');
  const paths = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(paths, [
    '/login',
    '/',
    'overview',
    'setup',
    'links',
    'links/create',
    'links/bulk-create',
    'links/:id/edit',
    'analytics',
    'analytics/links/:id',
    'domains',
    'redirect-rules',
    'groups',
    'health-checks',
    'operations',
    'tags',
    'import-export',
    'backups',
    'api-tokens',
    'audit-logs',
    'settings',
    '*',
  ]);
  assert.doesNotMatch(app, /IS_PUBLIC_DEMO/);

  const groupsRoute = readFileSync(
    new URL('../apps/worker/src/routes/groups.ts', import.meta.url),
    'utf8'
  );
  assert.match(
    groupsRoute,
    /if \(!isPublicReadOnlyDemo\(c\.env\)\) await syncGroupTagsFromLinks\(c\.env\)/
  );
});

test('live parity verification accepts the current version, brand, reads, and write boundary', async () => {
  const report = await verifyDemoLiveParity({
    adminUrl: adminOrigin,
    apiUrl: apiOrigin,
    version,
    fetchImpl: createFetch(),
    readFileImpl: readFile,
  });
  assert.equal(report.version, version);
  assert.equal(report.readChecks, 18);
});

test('live parity verification accepts equivalent SVG line endings', async () => {
  const readFileWithCrLf = async (url) => {
    const content = await readFile(url, 'utf8');
    return Buffer.from(content.replace(/\r?\n/g, '\r\n'));
  };
  const report = await verifyDemoLiveParity({
    adminUrl: adminOrigin,
    apiUrl: apiOrigin,
    version,
    fetchImpl: createFetch(),
    readFileImpl: readFileWithCrLf,
  });
  assert.equal(report.version, version);
});

test('live parity verification rejects stale Admin versions and a missing write boundary', async () => {
  await assert.rejects(
    verifyDemoLiveParity({
      adminUrl: adminOrigin,
      apiUrl: apiOrigin,
      version,
      fetchImpl: createFetch({ advertisedVersion: '0.25.1' }),
      readFileImpl: readFile,
    }),
    /does not advertise/
  );
  await assert.rejects(
    verifyDemoLiveParity({
      adminUrl: adminOrigin,
      apiUrl: apiOrigin,
      version,
      fetchImpl: createFetch({ writeStatus: 404 }),
      readFileImpl: readFile,
    }),
    /expected 403/
  );
});
