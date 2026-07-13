import assert from 'node:assert/strict';
import test from 'node:test';
import { isSavedView, normalizeSavedViewFilters } from './savedViewPolicy.ts';

test('saved analytics views whitelist and normalize filters', () => {
  assert.deepEqual(normalizeSavedViewFilters({ days: 13, slug: ' demo ', secret: 'no', country: '' }), { days: 30, slug: 'demo' });
  assert.equal(isSavedView({ id: '1', name: 'Campaign', filters: { days: 7 }, created_at: 'now' }), true);
  assert.equal(isSavedView({ id: '1', filters: {} }), false);
});
