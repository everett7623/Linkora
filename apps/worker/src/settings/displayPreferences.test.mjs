import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHiddenAdminModules } from './displayPreferences.ts';

test('normalizes instance-level hidden Admin modules to a stable list', () => {
  assert.deepEqual(normalizeHiddenAdminModules('["domains","analytics","domains"]'), {
    value: '["analytics","domains"]',
  });
});

test('rejects invalid and unknown hidden Admin modules', () => {
  assert.match(normalizeHiddenAdminModules('{"domains":true}').error ?? '', /string array/);
  assert.match(normalizeHiddenAdminModules('["settings"]').error ?? '', /unknown module/);
  assert.match(normalizeHiddenAdminModules('invalid').error ?? '', /valid JSON/);
});
