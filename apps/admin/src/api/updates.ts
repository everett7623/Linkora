import {
  isNewerVersion,
  normalizeVersion,
  readVersionCheckCache,
  serializeVersionCheckCache,
} from '../utils/versionCheck.ts';
import {
  readBrowserSetting,
  writeBrowserSetting,
  type StorageLike,
} from '../utils/browserStorage.ts';

const GITHUB_PACKAGE_URL =
  'https://api.github.com/repos/everett7623/Linketry/contents/package.json?ref=main';
export const GITHUB_REPOSITORY_URL = 'https://github.com/everett7623/Linketry';
const VERSION_CHECK_TIMEOUT_MS = 8_000;
let activeGitHubRequest: Promise<string> | null = null;

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface GitHubPackageMetadata {
  name?: unknown;
  version?: unknown;
}

interface CheckForUpdatesOptions {
  currentVersion: string;
  now?: number;
  storage?: StorageLike;
  fetcher?: Fetcher;
}

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  repositoryUrl: string;
}

async function requestLatestVersion(
  fetcher: Fetcher = globalThis.fetch,
  timeoutMs = VERSION_CHECK_TIMEOUT_MS
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(GITHUB_PACKAGE_URL, {
      cache: 'no-cache',
      headers: { Accept: 'application/vnd.github.raw+json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`GitHub version check failed with HTTP ${response.status}.`);

    const metadata = (await response.json()) as GitHubPackageMetadata;
    const version =
      typeof metadata.version === 'string' ? normalizeVersion(metadata.version) : null;
    if (metadata.name !== 'linketry' || !version) {
      throw new Error('GitHub returned invalid Linketry package metadata.');
    }
    return version;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function fetchLatestVersion(
  fetcher: Fetcher = globalThis.fetch,
  timeoutMs = VERSION_CHECK_TIMEOUT_MS
): Promise<string> {
  if (fetcher !== globalThis.fetch || timeoutMs !== VERSION_CHECK_TIMEOUT_MS) {
    return requestLatestVersion(fetcher, timeoutMs);
  }
  if (!activeGitHubRequest) {
    activeGitHubRequest = requestLatestVersion(fetcher, timeoutMs).finally(() => {
      activeGitHubRequest = null;
    });
  }
  return activeGitHubRequest;
}

export async function checkForUpdates(options: CheckForUpdatesOptions): Promise<UpdateCheckResult> {
  const currentVersion = options.currentVersion;
  const now = options.now ?? Date.now();
  const storage = options.storage ?? window.localStorage;
  let latestVersion: string | null = null;

  try {
    latestVersion =
      readVersionCheckCache(readBrowserSetting('updateCheck', storage), now)?.latestVersion ?? null;
  } catch {
    // Storage restrictions must not prevent the live check.
  }

  if (!latestVersion) {
    latestVersion = await fetchLatestVersion(options.fetcher);
    try {
      writeBrowserSetting(
        'updateCheck',
        serializeVersionCheckCache({ latestVersion, checkedAt: now }),
        storage
      );
    } catch {
      // A successful check remains usable even when browser storage is unavailable.
    }
  }

  return {
    currentVersion,
    latestVersion,
    updateAvailable: isNewerVersion(latestVersion, currentVersion),
    repositoryUrl: GITHUB_REPOSITORY_URL,
  };
}
