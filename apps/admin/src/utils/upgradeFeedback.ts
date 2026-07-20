import { normalizeVersion } from './versionCheck.ts';

export const UPGRADE_FEEDBACK_STORAGE_KEY = 'linketry.upgrade-feedback';
export const UPGRADE_FEEDBACK_TTL_MS = 30 * 60 * 1000;

export interface UpgradeFeedback {
  targetVersion: string;
  createdAt: number;
  followUpRefreshScheduled: boolean;
}

type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function browserSessionStorage(): SessionStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function removeStoredFeedback(storage: SessionStorage): void {
  try {
    storage.removeItem(UPGRADE_FEEDBACK_STORAGE_KEY);
  } catch {
    // Storage is optional; upgrade deployment and page loading must still continue.
  }
}

function storeFeedback(storage: SessionStorage, feedback: UpgradeFeedback): boolean {
  try {
    storage.setItem(UPGRADE_FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
    return true;
  } catch {
    return false;
  }
}

export function readUpgradeFeedback(
  storage: SessionStorage | null = browserSessionStorage(),
  now = Date.now()
): UpgradeFeedback | null {
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(UPGRADE_FEEDBACK_STORAGE_KEY) ?? 'null') as Partial<UpgradeFeedback> | null;
    const targetVersion =
      typeof parsed?.targetVersion === 'string' ? normalizeVersion(parsed.targetVersion) : null;
    const createdAt = parsed?.createdAt;
    const age = typeof createdAt === 'number' ? now - createdAt : Number.NaN;
    if (
      !targetVersion ||
      typeof createdAt !== 'number' ||
      !Number.isFinite(createdAt) ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > UPGRADE_FEEDBACK_TTL_MS ||
      typeof parsed?.followUpRefreshScheduled !== 'boolean'
    ) {
      removeStoredFeedback(storage);
      return null;
    }
    return { targetVersion, createdAt, followUpRefreshScheduled: parsed.followUpRefreshScheduled };
  } catch {
    removeStoredFeedback(storage);
    return null;
  }
}

export function rememberSuccessfulDeployment(
  targetVersion: string,
  storage: SessionStorage | null = browserSessionStorage(),
  now = Date.now()
): UpgradeFeedback | null {
  const normalized = normalizeVersion(targetVersion);
  if (!storage || !normalized) return null;
  const feedback = {
    targetVersion: normalized,
    createdAt: now,
    followUpRefreshScheduled: false,
  };
  return storeFeedback(storage, feedback) ? feedback : null;
}

export function markFollowUpRefreshScheduled(
  feedback: UpgradeFeedback,
  storage: SessionStorage | null = browserSessionStorage()
): UpgradeFeedback {
  const updated = { ...feedback, followUpRefreshScheduled: true };
  if (storage) storeFeedback(storage, updated);
  return updated;
}

export function clearUpgradeFeedback(
  storage: SessionStorage | null = browserSessionStorage()
): void {
  if (storage) removeStoredFeedback(storage);
}
