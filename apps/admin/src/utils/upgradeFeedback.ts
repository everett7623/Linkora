import {
  isNewerVersion,
  normalizeVersion,
  readVersionCheckCache,
} from './versionCheck.ts';
import {
  readBrowserSetting,
  writeBrowserSetting,
  type StorageLike,
} from './browserStorage.ts';

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

function browserLocalStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function browserNavigationWasReload(): boolean {
  if (typeof window === 'undefined') return false;
  return window.performance.getEntriesByType('navigation')[0]?.toJSON().type === 'reload';
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

export function readOrInferUpgradeFeedback(
  currentVersion: string,
  sessionStorage: SessionStorage | null = browserSessionStorage(),
  persistentStorage: StorageLike | null = browserLocalStorage(),
  now = Date.now(),
  navigationWasReload = browserNavigationWasReload()
): UpgradeFeedback | null {
  const explicit = readUpgradeFeedback(sessionStorage, now);
  const normalizedCurrent = normalizeVersion(currentVersion);
  if (!normalizedCurrent || !persistentStorage) return explicit;

  let previousVersion: string | null;
  let cachedTarget: string | null;
  try {
    const storedPrevious = readBrowserSetting('lastLoadedVersion', persistentStorage);
    previousVersion = storedPrevious ? normalizeVersion(storedPrevious) : null;
    cachedTarget = readVersionCheckCache(
      readBrowserSetting('updateCheck', persistentStorage),
      now
    )?.latestVersion ?? null;
    writeBrowserSetting('lastLoadedVersion', normalizedCurrent, persistentStorage);
  } catch {
    return explicit;
  }

  if (explicit) return explicit;
  const loadedNewerBuild = previousVersion
    ? isNewerVersion(normalizedCurrent, previousVersion)
    : navigationWasReload && cachedTarget === normalizedCurrent;
  if (!loadedNewerBuild) return null;

  const inferred = {
    targetVersion: normalizedCurrent,
    createdAt: now,
    followUpRefreshScheduled: true,
  };
  if (sessionStorage) storeFeedback(sessionStorage, inferred);
  return inferred;
}

export function rememberSuccessfulDeployment(
  targetVersion: string,
  storage: SessionStorage | null = browserSessionStorage(),
  now = Date.now()
): UpgradeFeedback | null {
  const normalized = normalizeVersion(targetVersion);
  if (!normalized) return null;
  const feedback = {
    targetVersion: normalized,
    createdAt: now,
    followUpRefreshScheduled: false,
  };
  if (storage) storeFeedback(storage, feedback);
  return feedback;
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
