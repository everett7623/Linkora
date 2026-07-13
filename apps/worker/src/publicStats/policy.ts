export function normalizePublicStatsDays(value: number): number {
  return [7, 30, 90, 365].includes(value) ? value : 30;
}

export function isPublicStatsShare(value: unknown): value is {
  link_id: string; token_hash: string; days: number; show_countries: boolean;
  show_referrers: boolean; created_at: string;
} {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.link_id === 'string' && typeof item.token_hash === 'string' &&
    typeof item.days === 'number' && typeof item.show_countries === 'boolean' &&
    typeof item.show_referrers === 'boolean' && typeof item.created_at === 'string';
}

