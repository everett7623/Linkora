import assert from 'node:assert/strict';
import test from 'node:test';
import { isSupportedBackupPayload } from './backupFormat.ts';

test('accepts the Linketry backup marker', () => {
  assert.equal(isSupportedBackupPayload({ name: 'Linketry Backup', links: [] }), true);
});

test('rejects unrelated or malformed backup payloads', () => {
  assert.equal(isSupportedBackupPayload({ name: 'Linketry Backup' }), false);
  assert.equal(isSupportedBackupPayload({ name: 'Other Backup', links: [] }), false);
  assert.equal(isSupportedBackupPayload(null), false);
});
