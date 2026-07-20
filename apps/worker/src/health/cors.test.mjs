import assert from 'node:assert/strict';
import test from 'node:test';
import { Hono } from 'hono';
import { healthCors } from './cors.ts';

const origin = 'https://admin.example.com';
const app = new Hono();
app.use('/health', healthCors);
app.get('/health', (context) =>
  context.json({ success: true, data: { status: 'ok', version: '0.27.7' } })
);

test('health exposes its public runtime version to a cross-origin Admin', async () => {
  const response = await app.request('/health', { headers: { Origin: origin } });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.deepEqual(await response.json(), {
    success: true,
    data: { status: 'ok', version: '0.27.7' },
  });
});

test('health answers the browser CORS preflight without exposing private headers', async () => {
  const response = await app.request('/health', {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'GET',
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.match(response.headers.get('Access-Control-Allow-Methods') ?? '', /GET/);
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
});
