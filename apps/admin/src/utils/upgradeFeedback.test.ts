import assert from 'node:assert/strict';
import test from 'node:test';
import {
  UPGRADE_FEEDBACK_STORAGE_KEY,
  UPGRADE_FEEDBACK_TTL_MS,
  clearUpgradeFeedback,
  markFollowUpRefreshScheduled,
  readOrInferUpgradeFeedback,
  readUpgradeFeedback,
  rememberSuccessfulDeployment,
} from './upgradeFeedback.ts';
import { serializeVersionCheckCache } from './versionCheck.ts';

function memoryStorage(initialValue: string | null = null) {
  const values = new Map<string, string>();
  if (initialValue !== null) values.set(UPGRADE_FEEDBACK_STORAGE_KEY, initialValue);
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

test('stores a normalized deployment target for the current tab', () => {
  const storage = memoryStorage();
  const feedback = rememberSuccessfulDeployment('v1.2.3', storage, 1000);

  assert.deepEqual(feedback, {
    targetVersion: '1.2.3',
    createdAt: 1000,
    followUpRefreshScheduled: false,
  });
  assert.deepEqual(readUpgradeFeedback(storage, 1500), feedback);
});

test('returns immediate feedback when session storage is unavailable', () => {
  assert.deepEqual(rememberSuccessfulDeployment('v1.2.3', null, 1000), {
    targetVersion: '1.2.3',
    createdAt: 1000,
    followUpRefreshScheduled: false,
  });
});

test('marks the single bounded follow-up refresh', () => {
  const storage = memoryStorage();
  const feedback = rememberSuccessfulDeployment('1.2.3', storage, 1000);
  assert.ok(feedback);

  const updated = markFollowUpRefreshScheduled(feedback, storage);

  assert.equal(updated.followUpRefreshScheduled, true);
  assert.deepEqual(readUpgradeFeedback(storage, 1500), updated);
});

test('discards malformed and expired feedback', () => {
  const malformed = memoryStorage('{"targetVersion":"not-a-version"}');
  assert.equal(readUpgradeFeedback(malformed, 1000), null);
  assert.equal(malformed.getItem(UPGRADE_FEEDBACK_STORAGE_KEY), null);

  const expired = memoryStorage();
  rememberSuccessfulDeployment('1.2.3', expired, 1000);
  assert.equal(readUpgradeFeedback(expired, 1001 + UPGRADE_FEEDBACK_TTL_MS), null);
});

test('clears upgrade feedback after dismissal', () => {
  const storage = memoryStorage();
  rememberSuccessfulDeployment('1.2.3', storage, 1000);

  clearUpgradeFeedback(storage);

  assert.equal(readUpgradeFeedback(storage, 1500), null);
});

test('infers completion when a newer Admin build replaces the loaded version', () => {
  const session = memoryStorage();
  const persistent = memoryStorage();
  persistent.setItem('linketry_last_loaded_version', '1.2.2');

  const feedback = readOrInferUpgradeFeedback('1.2.3', session, persistent, 1000);

  assert.deepEqual(feedback, {
    targetVersion: '1.2.3',
    createdAt: 1000,
    followUpRefreshScheduled: true,
  });
  assert.equal(persistent.getItem('linketry_last_loaded_version'), '1.2.3');
  assert.deepEqual(readUpgradeFeedback(session, 1500), feedback);
});

test('bridges an older source build through its fresh update cache', () => {
  const session = memoryStorage();
  const persistent = memoryStorage();
  persistent.setItem(
    'linketry_update_check',
    serializeVersionCheckCache({ latestVersion: '1.2.3', checkedAt: 1000 })
  );

  const feedback = readOrInferUpgradeFeedback('1.2.3', session, persistent, 1500, true);

  assert.equal(feedback?.targetVersion, '1.2.3');
  assert.equal(feedback?.followUpRefreshScheduled, true);
});

test('does not infer completion on a fresh or unchanged build', () => {
  const session = memoryStorage();
  const persistent = memoryStorage();

  assert.equal(readOrInferUpgradeFeedback('1.2.3', session, persistent, 1000), null);
  persistent.setItem(
    'linketry_update_check',
    serializeVersionCheckCache({ latestVersion: '1.2.3', checkedAt: 1000 })
  );
  assert.equal(readOrInferUpgradeFeedback('1.2.3', session, persistent, 1500), null);
});
