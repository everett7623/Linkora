import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForOnlineUpgrade } from './onlineUpgrade.ts';

const sleep = async () => {};
const run = (status: string, conclusion: string | null = null) => ({
  runId: 42,
  runUrl: 'https://github.com/owner/repo/actions/runs/42',
  status,
  conclusion,
  headSha: 'a'.repeat(40),
});

test('upgrade polling waits for a successful workflow and matching runtime version', async () => {
  const phases: string[] = [];
  const runs = [run('queued'), run('in_progress'), run('completed', 'success')];
  const versions = ['0.25.9', '0.25.10'];
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: 42,
    readRun: async () => runs.shift()!,
    readRuntimeVersion: async () => versions.shift()!,
    readAdminReady: async () => true,
    onPhase: (phase) => phases.push(phase),
    sleep,
  });

  assert.deepEqual(result, { outcome: 'success' });
  assert.deepEqual(phases, ['queued', 'running', 'finalizing']);
});

test('upgrade polling reports a failed workflow without claiming a new version', async () => {
  let runtimeChecks = 0;
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: 42,
    readRun: async () => run('completed', 'failure'),
    readRuntimeVersion: async () => {
      runtimeChecks += 1;
      return '0.25.10';
    },
    readAdminReady: async () => true,
    sleep,
  });

  assert.deepEqual(result, { outcome: 'failed', conclusion: 'failure' });
  assert.equal(runtimeChecks, 0);
});

test('upgrade polling separates successful deployment from runtime verification failure', async () => {
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: 42,
    readRun: async () => run('completed', 'success'),
    readRuntimeVersion: async () => '0.25.4',
    readAdminReady: async () => true,
    sleep,
    maxVersionPolls: 2,
  });
  assert.deepEqual(result, { outcome: 'verification_failed' });
});

test('upgrade polling reports runtime check errors as verification failures', async () => {
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: 42,
    readRun: async () => run('completed', 'success'),
    readRuntimeVersion: async () => {
      throw new TypeError('Failed to fetch');
    },
    readAdminReady: async () => true,
    sleep,
    maxVersionPolls: 2,
  });
  assert.deepEqual(result, { outcome: 'verification_failed' });
});

test('upgrade polling without a run ID does not claim the deployment succeeded', async () => {
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: null,
    readRun: async () => run('queued'),
    readRuntimeVersion: async () => '0.25.4',
    readAdminReady: async () => true,
    sleep,
    maxRunPolls: 2,
  });
  assert.deepEqual(result, { outcome: 'timeout' });
});

test('upgrade polling can be cancelled without leaving a background timer', async () => {
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: null,
    readRun: async () => run('queued'),
    readRuntimeVersion: async () => '0.25.4',
    readAdminReady: async () => false,
    shouldContinue: () => false,
    sleep,
  });
  assert.deepEqual(result, { outcome: 'cancelled' });
});

test('upgrade polling without a run ID waits for both Worker and Admin readiness', async () => {
  const phases: string[] = [];
  const adminReadiness = [false, true];
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: null,
    readRun: async () => run('queued'),
    readRuntimeVersion: async () => '0.25.10',
    readAdminReady: async () => adminReadiness.shift() ?? true,
    onPhase: (phase) => phases.push(phase),
    sleep,
    maxRunPolls: 2,
  });

  assert.deepEqual(result, { outcome: 'success' });
  assert.deepEqual(phases, ['running', 'finalizing']);
});

test('upgrade polling does not complete when only the Admin release is ready', async () => {
  const runtimeVersions = ['0.25.9', '0.25.10'];
  const result = await waitForOnlineUpgrade({
    targetVersion: '0.25.10',
    runId: null,
    readRun: async () => run('queued'),
    readRuntimeVersion: async () => runtimeVersions.shift() ?? '0.25.10',
    readAdminReady: async () => true,
    sleep,
    maxRunPolls: 2,
  });

  assert.deepEqual(result, { outcome: 'success' });
});
