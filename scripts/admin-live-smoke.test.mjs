import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { collectInitialAssets, verifyAdminLive, waitForAdminLive } from './admin-live-smoke.mjs';

const adminUrl = 'https://admin.example.com';
const version = '0.29.9';
const html = `
  <meta name="linketry-version" content="${version}">
  <script type="module" crossorigin src="/assets/index-AbCd1234.js"></script>
  <link rel="stylesheet" href="/assets/index-EfGh5678.css">
`;

function response(body, contentType, cacheControl = 'public, max-age=0, must-revalidate') {
  return new Response(body, {
    headers: { 'Content-Type': contentType, 'Cache-Control': cacheControl },
  });
}

function healthyFetch(input) {
  const url = new URL(String(input));
  if (url.pathname === '/') return Promise.resolve(response(html, 'text/html; charset=utf-8'));
  if (url.pathname.endsWith('.js')) {
    return Promise.resolve(response('export {};', 'application/javascript'));
  }
  if (url.pathname.endsWith('.css')) return Promise.resolve(response('body{}', 'text/css'));
  return Promise.resolve(new Response('missing', { status: 404 }));
}

test('collects only initial Vite module and stylesheet assets', () => {
  assert.deepEqual(collectInitialAssets(html), [
    { path: '/assets/index-AbCd1234.js', kind: 'script' },
    { path: '/assets/index-EfGh5678.css', kind: 'style' },
  ]);
});

test('accepts the current Admin HTML only when initial assets have executable MIME types', async () => {
  const report = await verifyAdminLive({ adminUrl, version, fetchImpl: healthyFetch });
  assert.equal(report.adminOrigin, adminUrl);
  assert.deepEqual(report.assets, ['/assets/index-AbCd1234.js', '/assets/index-EfGh5678.css']);

  await assert.rejects(
    verifyAdminLive({
      adminUrl,
      version,
      fetchImpl: async (input) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith('.js')) return response(html, 'text/html; charset=utf-8');
        return healthyFetch(input);
      },
    }),
    /returned text\/html.*instead of script/
  );
});

test('requires canonical content-hashed paths and permits their long-term caching', async () => {
  const requests = [];
  await verifyAdminLive({
    adminUrl,
    version,
    fetchImpl: async (input, init) => {
      requests.push({ url: new URL(String(input)), headers: new Headers(init?.headers) });
      return healthyFetch(input);
    },
  });

  const htmlRequest = requests.find((request) => request.url.pathname === '/');
  const assetRequests = requests.filter((request) => request.url.pathname.startsWith('/assets/'));
  assert.equal(htmlRequest?.headers.get('Cache-Control'), 'no-cache');
  assert.equal(assetRequests.length, 2);
  assert.ok(assetRequests.every((request) => !request.url.search));
  assert.ok(assetRequests.every((request) => !request.headers.has('Cache-Control')));

  await verifyAdminLive({
    adminUrl,
    version,
    fetchImpl: async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('.js')) {
        return response('export {};', 'application/javascript', 'public, max-age=31536000');
      }
      if (url.pathname.endsWith('.css')) {
        return response('body{}', 'text/css', 'public, max-age=31536000, immutable');
      }
      return healthyFetch(input);
    },
  });

  await assert.rejects(
    verifyAdminLive({
      adminUrl,
      version,
      fetchImpl: async (input) => {
        const url = new URL(String(input));
        if (url.pathname === '/') {
          return response(
            html.replace('/assets/index-AbCd1234.js', '/assets/index-AbCd1234.js?v=0.29.9'),
            'text/html'
          );
        }
        return healthyFetch(input);
      },
    }),
    /canonical Vite content-hashed path/
  );

  await assert.rejects(
    verifyAdminLive({
      adminUrl,
      version,
      fetchImpl: async (input) => {
        const url = new URL(String(input));
        if (url.pathname === '/') {
          return response(
            html.replace('/assets/index-AbCd1234.js', '/assets/index-release.js'),
            'text/html'
          );
        }
        return healthyFetch(input);
      },
    }),
    /canonical Vite content-hashed path/
  );
});

test('Admin Pages security headers require revalidation without immutable caching', () => {
  const headers = readFileSync(new URL('../apps/admin/public/_headers', import.meta.url), 'utf8');
  assert.match(headers, /Content-Security-Policy:.*script-src 'self'/);
  assert.match(headers, /\/assets\/\*[\s\S]*Cache-Control: public, max-age=0, must-revalidate/);
  assert.doesNotMatch(headers, /immutable/i);
});

test('readiness polling waits through a transient Pages asset fallback', async () => {
  let scriptRequests = 0;
  const report = await waitForAdminLive(
    {
      adminUrl,
      version,
      fetchImpl: async (input) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith('.js') && scriptRequests++ === 0) {
          return response(html, 'text/html; charset=utf-8');
        }
        return healthyFetch(input);
      },
    },
    2,
    0
  );

  assert.equal(scriptRequests, 2);
  assert.equal(report.version, version);
});
