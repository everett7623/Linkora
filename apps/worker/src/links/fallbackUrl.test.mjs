import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeFallbackUrl } from './fallbackUrl.ts';

test('fallback URL accepts and normalizes http and https URLs', () => {
  assert.deepEqual(normalizeFallbackUrl(' https://example.com/fallback '), {
    value: 'https://example.com/fallback',
  });
  assert.deepEqual(normalizeFallbackUrl('http://example.com'), {
    value: 'http://example.com/',
  });
});

test('fallback URL supports clearing and rejects unsafe or invalid values', () => {
  assert.deepEqual(normalizeFallbackUrl(''), { value: null });
  assert.deepEqual(normalizeFallbackUrl(null), { value: null });
  assert.match(normalizeFallbackUrl('javascript:alert(1)').error ?? '', /http or https/);
  assert.match(normalizeFallbackUrl('not-a-url').error ?? '', /valid URL/);
  assert.match(normalizeFallbackUrl(42).error ?? '', /string/);
});
