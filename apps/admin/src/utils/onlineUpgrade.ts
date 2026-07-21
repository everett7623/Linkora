import type { OnlineUpgradeRun } from '../api/onlineUpgrade.ts';

export type OnlineUpgradePhase = 'queued' | 'running' | 'finalizing';
export type OnlineUpgradeOutcome =
  'success' | 'failed' | 'timeout' | 'verification_failed' | 'cancelled';

export interface OnlineUpgradeWaitResult {
  outcome: OnlineUpgradeOutcome;
  conclusion?: string | null;
}

interface WaitOptions {
  targetVersion: string;
  runId: number | null;
  readRun: (runId: number) => Promise<OnlineUpgradeRun>;
  readRuntimeVersion: () => Promise<string>;
  readAdminReady: () => Promise<boolean>;
  onPhase?: (phase: OnlineUpgradePhase) => void;
  shouldContinue?: () => boolean;
  sleep?: (milliseconds: number) => Promise<void>;
  runPollIntervalMs?: number;
  versionPollIntervalMs?: number;
  maxRunPolls?: number;
  maxVersionPolls?: number;
  maxRuntimeOnlyPolls?: number;
}

const ACTIVE_QUEUED_STATUSES = new Set(['queued', 'requested', 'waiting', 'pending']);

export async function waitForOnlineUpgrade(options: WaitOptions): Promise<OnlineUpgradeWaitResult> {
  const shouldContinue = options.shouldContinue ?? (() => true);
  const sleep = options.sleep ?? delay;
  const runInterval = options.runPollIntervalMs ?? 2_000;
  const versionInterval = options.versionPollIntervalMs ?? 1_000;
  const maxRunPolls = options.maxRunPolls ?? 300;
  const maxVersionPolls = options.maxVersionPolls ?? 90;
  const maxRuntimeOnlyPolls = options.maxRuntimeOnlyPolls ?? 600;

  if (options.runId === null) {
    options.onPhase?.('running');
    return pollReleaseReadiness(
      options,
      maxRuntimeOnlyPolls,
      versionInterval,
      sleep,
      shouldContinue,
      'timeout',
      false
    );
  }

  let consecutiveErrors = 0;
  for (let attempt = 0; attempt < maxRunPolls; attempt += 1) {
    if (!shouldContinue()) return { outcome: 'cancelled' };
    try {
      const run = await options.readRun(options.runId);
      consecutiveErrors = 0;
      if (run.status === 'completed') {
        if (run.conclusion !== 'success') {
          return { outcome: 'failed', conclusion: run.conclusion };
        }
        options.onPhase?.('finalizing');
        return pollReleaseReadiness(
          options,
          maxVersionPolls,
          versionInterval,
          sleep,
          shouldContinue,
          'verification_failed',
          true
        );
      }
      options.onPhase?.(ACTIVE_QUEUED_STATUSES.has(run.status) ? 'queued' : 'running');
    } catch {
      consecutiveErrors += 1;
      if (consecutiveErrors >= 5) return { outcome: 'failed' };
    }
    await sleep(runInterval);
  }
  return { outcome: 'timeout' };
}

async function pollReleaseReadiness(
  options: WaitOptions,
  attempts: number,
  interval: number,
  sleep: (milliseconds: number) => Promise<void>,
  shouldContinue: () => boolean,
  exhaustedOutcome: Extract<OnlineUpgradeOutcome, 'timeout' | 'verification_failed'>,
  finalizing: boolean
): Promise<OnlineUpgradeWaitResult> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (!shouldContinue()) return { outcome: 'cancelled' };
    const [runtimeResult, adminResult] = await Promise.allSettled([
      options.readRuntimeVersion(),
      options.readAdminReady(),
    ]);
    const runtimeReady =
      runtimeResult.status === 'fulfilled' && runtimeResult.value === options.targetVersion;
    const adminReady = adminResult.status === 'fulfilled' && adminResult.value;
    if (runtimeReady && adminReady) return { outcome: 'success' };
    if (!finalizing && (runtimeReady || adminReady)) {
      finalizing = true;
      options.onPhase?.('finalizing');
    }
    await sleep(interval);
  }
  return { outcome: exhaustedOutcome };
}

function delay(milliseconds: number): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
  }

  return new Promise((resolve) => {
    const finish = () => {
      globalThis.clearTimeout(timeoutId);
      window.removeEventListener('focus', finish);
      window.removeEventListener('online', finish);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resolve();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') finish();
    };
    const timeoutId = globalThis.setTimeout(finish, milliseconds);
    window.addEventListener('focus', finish);
    window.addEventListener('online', finish);
    document.addEventListener('visibilitychange', onVisibilityChange);
  });
}
