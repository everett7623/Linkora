import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteCachedLink, getCachedLink } from './index.ts';

test('reads the Linketry cache key', async () => {
  const calls = [];
  const entry = { id: 'link_1', slug: 'demo', long_url: 'https://example.com' };
  const env = {
    KV: {
      async get(key) {
        calls.push(key);
        return key.startsWith('linketry:') ? entry : null;
      },
    },
  };

  assert.equal(await getCachedLink(env, 'go.example.com', 'demo'), entry);
  assert.deepEqual(calls, ['linketry:slug:go.example.com:demo']);
});

test('deletes the Linketry cache key after a link mutation', async () => {
  const deleted = [];
  const env = {
    KV: {
      async delete(key) {
        deleted.push(key);
      },
    },
  };

  await deleteCachedLink(env, 'go.example.com', 'demo');

  assert.deepEqual(deleted, ['linketry:slug:go.example.com:demo']);
});
