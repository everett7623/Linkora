import type { Link } from '@linketry/shared';

export function hasMaxClicks(link: Link): boolean {
  return link.max_clicks !== null && link.max_clicks !== undefined;
}

export function isLinkExpiredByTime(link: Link, now = Date.now()): boolean {
  if (!link.expires_at) return false;
  const timestamp = Date.parse(link.expires_at);
  return !Number.isNaN(timestamp) && timestamp < now;
}

export function isLinkExpiredByClicks(link: Link): boolean {
  return hasMaxClicks(link) && link.clicks >= Number(link.max_clicks);
}

export function getEffectiveLinkStatus(link: Link, now = Date.now()): Link['status'] {
  if (link.status === 'active' && (isLinkExpiredByTime(link, now) || isLinkExpiredByClicks(link))) {
    return 'expired';
  }
  return link.status;
}

export function parseLinkTags(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}
