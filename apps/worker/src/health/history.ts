import type { LinkHealthCheckResult, LinkHealthStatus } from '@linkora/shared';

export const MAX_HEALTH_HISTORY_ITEMS = 200;

export interface HealthHistoryItem {
  link_id: string;
  status: LinkHealthStatus;
  http_status: number | null;
  checked_at: string;
  response_time_ms: number;
  consecutive_failures: number;
}

export function parseHealthHistory(value?: string): HealthHistoryItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHealthHistoryItem).slice(0, MAX_HEALTH_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function appendHealthHistory(
  previous: HealthHistoryItem[],
  results: LinkHealthCheckResult[],
  failures: Record<string, number>
): HealthHistoryItem[] {
  const additions = results.flatMap((result) =>
    result.link_id
      ? [{
          link_id: result.link_id,
          status: result.status,
          http_status: result.http_status ?? null,
          checked_at: result.checked_at,
          response_time_ms: result.response_time_ms,
          consecutive_failures: failures[result.link_id] ?? 0,
        }]
      : []
  );
  return [...additions.reverse(), ...previous].slice(0, MAX_HEALTH_HISTORY_ITEMS);
}

function isHealthHistoryItem(value: unknown): value is HealthHistoryItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<HealthHistoryItem>;
  return (
    typeof item.link_id === 'string' &&
    (item.status === 'healthy' || item.status === 'warning' || item.status === 'broken') &&
    (item.http_status === null || typeof item.http_status === 'number') &&
    typeof item.checked_at === 'string' &&
    typeof item.response_time_ms === 'number' &&
    typeof item.consecutive_failures === 'number'
  );
}
