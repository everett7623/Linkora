import assert from 'node:assert/strict';
import test from 'node:test';
import { collectInitialAssets, verifyAdminLive, waitForAdminLive } from './admin-live-smoke.mjs';

const adminUrl = 'https://admin.example.com';
const version = '0.28.5';
const html = `
  <meta name="linketry-version" content="${version}">
  <script type="module" crossorigin src="/assets/index-release.js"></script>
  <link rel="stylesheet" href="/assets/index-release.css">
`;

function response(body, contentType) {
  return new Response(body, { headers: { 'Content-Type': contentType } });
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
    { path: '/assets/index-release.js', kind: 'script' },
    { path: '/assets/index-release.css', kind: 'style' },
  ]);
});

test('accepts the current Admin HTML only when initial assets have executable MIME types', async () => {
  const report = await verifyAdminLive({ adminUrl, version, fetchImpl: healthyFetch });
  assert.equal(report.adminOrigin, adminUrl);
  assert.deepEqual(report.assets, ['/assets/index-release.js', '/assets/index-release.css']);

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
