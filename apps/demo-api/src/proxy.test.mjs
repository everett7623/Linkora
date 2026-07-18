import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { isDemoApiPath, onRequest } from './proxy.mjs';

function createContext(request, fetchImpl) {
  return {
    request,
    env: fetchImpl ? { DEMO_API: { fetch: fetchImpl } } : {},
  };
}

test('only health and Admin API paths are eligible for proxying', () => {
  assert.equal(isDemoApiPath('/health'), true);
  assert.equal(isDemoApiPath('/api'), true);
  assert.equal(isDemoApiPath('/api/v1/overview'), true);
  assert.equal(isDemoApiPath('/favicon.svg'), false);
  assert.equal(isDemoApiPath('/health/details'), false);
});

test('Pages routes invoke the Function only for the eligible proxy paths', async () => {
  const routes = JSON.parse(
    await readFile(new URL('../public/_routes.json', import.meta.url), 'utf8')
  );

  assert.deepEqual(routes, {
    version: 1,
    include: ['/health', '/api', '/api/*'],
    exclude: [],
  });
});

test('forwards the original request and returns the upstream response unchanged', async () => {
  const request = new Request('https://demoapi.linketry.com/api/v1/links?page=2', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'example' }),
  });
  let forwarded;
  const upstream = new Response(JSON.stringify({ success: true, data: [] }), {
    status: 202,
    headers: { 'Content-Type': 'application/json', 'X-Linketry-Upstream': 'worker' },
  });

  const response = await onRequest(
    createContext(request, async (received) => {
      forwarded = received;
      return upstream;
    })
  );

  assert.equal(forwarded, request);
  assert.equal(response, upstream);
  assert.equal(response.status, 202);
  assert.equal(response.headers.get('X-Linketry-Upstream'), 'worker');
});

test('fails closed when the Service Binding is missing', async () => {
  const response = await onRequest(
    createContext(new Request('https://demoapi.linketry.com/health'))
  );
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.error.code, 'DEMO_API_UNAVAILABLE');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('does not expose a thrown upstream error', async () => {
  const response = await onRequest(
    createContext(new Request('https://demoapi.linketry.com/health'), async () => {
      throw new Error('secret upstream detail');
    })
  );
  const body = await response.text();

  assert.equal(response.status, 502);
  assert.doesNotMatch(body, /secret upstream detail/);
});

test('rejects non-API paths even if the Function is invoked directly', async () => {
  let called = false;
  const response = await onRequest(
    createContext(new Request('https://demoapi.linketry.com/private'), async () => {
      called = true;
      return new Response('unexpected');
    })
  );

  assert.equal(response.status, 404);
  assert.equal(called, false);
});
