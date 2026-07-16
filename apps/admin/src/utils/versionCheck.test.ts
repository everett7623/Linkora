import assert from 'node:assert/strict';
import test from 'node:test';
import { checkForUpdates, fetchLatestVersion } from '../api/updates.ts';
import type { StorageLike } from './browserStorage.ts';
import {
  isNewerVersion,
  normalizeVersion,
  readVersionCheckCache,
  serializeVersionCheckCache,
} from './versionCheck.ts';

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('semantic version comparison detects only newer valid versions', () => {
  assert.equal(isNewerVersion('0.20.0', '0.19.0'), true);
  assert.equal(isNewerVersion('1.0.0', '0.99.9'), true);
  assert.equal(isNewerVersion('0.19.0', '0.19.0'), false);
  assert.equal(isNewerVersion('0.18.9', '0.19.0'), false);
  assert.equal(isNewerVersion('1.0.0', '1.0.0-rc.1'), true);
  assert.equal(isNewerVersion('1.0.0-rc.2', '1.0.0-rc.1'), true);
  assert.equal(isNewerVersion('latest', '0.19.0'), false);
  assert.equal(normalizeVersion('v2.3.4'), '2.3.4');
});

test('version check cache accepts fresh data and rejects stale or malformed data', () => {
  const now = 10_000;
  const serialized = serializeVersionCheckCache({ latestVersion: 'v0.19.0', checkedAt: now });
  assert.deepEqual(readVersionCheckCache(serialized, now + 1_000, 2_000), {
    latestVersion: '0.19.0',
    checkedAt: now,
  });
  assert.equal(readVersionCheckCache(serialized, now + 2_001, 2_000), null);
  assert.equal(readVersionCheckCache(serialized, now - 1, 2_000), null);
  assert.equal(readVersionCheckCache('{"latestVersion":"latest"}', now), null);
});

test('GitHub package metadata is validated and fetched without an Admin token', async () => {
  let authorization: string | null = 'unexpected';
  const latestVersion = await fetchLatestVersion(async (_input, init) => {
    authorization = new Headers(init?.headers).get('Authorization');
    return Response.json({ name: 'linketry', version: '0.19.0' });
  });

  assert.equal(latestVersion, '0.19.0');
  assert.equal(authorization, null);
  await assert.rejects(
    fetchLatestVersion(async () => Response.json({ name: 'other', version: 'latest' })),
    /invalid Linketry package metadata/
  );
});

test('successful update checks are cached and newer versions remain detectable', async () => {
  const storage = memoryStorage();
  let fetchCount = 0;
  const first = await checkForUpdates({
    currentVersion: '0.19.0',
    now: 20_000,
    storage,
    fetcher: async () => {
      fetchCount += 1;
      return Response.json({ name: 'linketry', version: '0.20.0' });
    },
  });
  const cached = await checkForUpdates({
    currentVersion: '0.19.0',
    now: 21_000,
    storage,
    fetcher: async () => {
      throw new Error('cache was not used');
    },
  });

  assert.equal(first.updateAvailable, true);
  assert.equal(first.latestVersion, '0.20.0');
  assert.deepEqual(cached, first);
  assert.equal(fetchCount, 1);
});
