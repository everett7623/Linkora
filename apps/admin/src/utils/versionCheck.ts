export const UPDATE_CHECK_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface ParsedVersion {
  normalized: string;
  core: [number, number, number];
  prerelease: string[] | null;
}

export interface VersionCheckCache {
  latestVersion: string;
  checkedAt: number;
}

function parseVersion(value: string): ParsedVersion | null {
  const match = value
    .trim()
    .match(/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;

  const core = match.slice(1, 4).map(Number) as [number, number, number];
  if (core.some((part) => !Number.isSafeInteger(part))) return null;

  const prerelease = match[4]?.split('.') ?? null;
  if (prerelease?.some((part) => !part)) return null;
  return {
    normalized: `${core.join('.')}${prerelease ? `-${prerelease.join('.')}` : ''}`,
    core,
    prerelease,
  };
}

export function normalizeVersion(value: string): string | null {
  return parseVersion(value)?.normalized ?? null;
}

function comparePrerelease(left: string[] | null, right: string[] | null): number {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const leftPart = left[index];
    const rightPart = right[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;

    const leftNumber = /^\d+$/.test(leftPart) ? Number(leftPart) : null;
    const rightNumber = /^\d+$/.test(rightPart) ? Number(rightPart) : null;
    if (leftNumber !== null && rightNumber !== null) return leftNumber > rightNumber ? 1 : -1;
    if (leftNumber !== null) return -1;
    if (rightNumber !== null) return 1;
    return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

export function isNewerVersion(candidate: string, current: string): boolean {
  const next = parseVersion(candidate);
  const installed = parseVersion(current);
  if (!next || !installed) return false;

  for (let index = 0; index < next.core.length; index += 1) {
    if (next.core[index] !== installed.core[index]) {
      return next.core[index] > installed.core[index];
    }
  }
  return comparePrerelease(next.prerelease, installed.prerelease) > 0;
}

export function readVersionCheckCache(
  value: string | null,
  now = Date.now(),
  ttlMs = UPDATE_CHECK_CACHE_TTL_MS
): VersionCheckCache | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<VersionCheckCache>;
    const latestVersion =
      typeof parsed.latestVersion === 'string' ? normalizeVersion(parsed.latestVersion) : null;
    const checkedAt = parsed.checkedAt;
    if (!latestVersion || typeof checkedAt !== 'number' || !Number.isFinite(checkedAt)) return null;
    const age = now - checkedAt;
    if (age < 0 || age > ttlMs) return null;
    return { latestVersion, checkedAt };
  } catch {
    return null;
  }
}

export function serializeVersionCheckCache(cache: VersionCheckCache): string {
  return JSON.stringify(cache);
}
