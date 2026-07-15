import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isModuleVisible,
  normalizeDisplayDensity,
  parseHiddenModules,
  serializeHiddenModules,
} from './displayPreferences.ts';

test('display density safely defaults to comfortable', () => {
  assert.equal(normalizeDisplayDensity(null), 'comfortable');
  assert.equal(normalizeDisplayDensity('unexpected'), 'comfortable');
  assert.equal(normalizeDisplayDensity('compact'), 'compact');
});

test('hidden modules accept only known optional navigation modules', () => {
  assert.deepEqual(parseHiddenModules('["domains","settings","domains","analytics"]'), [
    'analytics',
    'domains',
  ]);
  assert.deepEqual(parseHiddenModules('{"domains":true}'), []);
  assert.deepEqual(parseHiddenModules('invalid json'), []);
});

test('hidden module serialization is stable and core routes stay visible', () => {
  assert.equal(serializeHiddenModules(['domains', 'analytics']), '["analytics","domains"]');
  assert.equal(isModuleVisible('analytics', ['analytics']), false);
  assert.equal(isModuleVisible(undefined, ['analytics']), true);
});
