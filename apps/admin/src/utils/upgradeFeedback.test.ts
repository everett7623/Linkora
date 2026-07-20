import assert from 'node:assert/strict';
import test from 'node:test';
import {
  UPGRADE_FEEDBACK_STORAGE_KEY,
  UPGRADE_FEEDBACK_TTL_MS,
  clearUpgradeFeedback,
  markFollowUpRefreshScheduled,
  readUpgradeFeedback,
  rememberSuccessfulDeployment,
} from './upgradeFeedback.ts';

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
