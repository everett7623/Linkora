import assert from 'node:assert/strict';
import test from 'node:test';
import { ensurePagesDomain } from './cloudflare-pages-domain.mjs';

const baseOptions = {
  accountId: 'a'.repeat(32),
  projectName: 'linketry-demo-api',
  domain: 'demoapi.linketry.com',
  apiToken: 'token-must-never-appear',
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('returns an existing Pages custom domain without mutation', async () => {
  const calls = [];
  const result = await ensurePagesDomain({
    ...baseOptions,
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({
        success: true,
        result: { name: baseOptions.domain, status: 'active' },
      });
    },
  });

  assert.deepEqual(result, { created: false, domain: baseOptions.domain, status: 'active' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${baseOptions.apiToken}`);
});

test('creates a Pages custom domain only after an exact 404 lookup', async () => {
  const calls = [];
  const result = await ensurePagesDomain({
    ...baseOptions,
    fetchImpl: async (url, init = {}) => {
      calls.push({ url, init });
      if (calls.length === 1) return jsonResponse({ success: false }, 404);
      return jsonResponse({
        success: true,
        result: { name: baseOptions.domain, status: 'pending' },
      });
    },
  });

  assert.deepEqual(result, { created: true, domain: baseOptions.domain, status: 'pending' });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].init.body), { name: baseOptions.domain });
});

test('does not mutate after an authorization failure', async () => {
  let calls = 0;
  await assert.rejects(
    ensurePagesDomain({
      ...baseOptions,
      fetchImpl: async () => {
        calls += 1;
        return jsonResponse({ errors: [{ message: 'permission denied' }] }, 403);
      },
    }),
    /HTTP 403: permission denied/
  );
  assert.equal(calls, 1);
});

test('rejects unsafe identifiers before making a request', async () => {
  let called = false;
  await assert.rejects(
    ensurePagesDomain({
      ...baseOptions,
      domain: 'https://demoapi.linketry.com/path',
      fetchImpl: async () => {
        called = true;
        return jsonResponse({});
      },
    }),
    /Invalid Pages custom domain/
  );
  assert.equal(called, false);
});

test('never includes the API token in an API failure', async () => {
  await assert.rejects(
    ensurePagesDomain({
      ...baseOptions,
      fetchImpl: async () => new Response('not-json', { status: 500 }),
    }),
    (error) => {
      assert.doesNotMatch(error.message, /token-must-never-appear/);
      return true;
    }
  );
});
