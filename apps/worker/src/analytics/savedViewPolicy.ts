const ALLOWED_FILTERS = new Set(['days','link_id','slug','domain','tag','campaign','project','country','device','browser','referer','utm_source','utm_medium','utm_campaign','utm_term','utm_content']);

export function normalizeSavedViewFilters(value: unknown): Record<string, string | number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { days: 30 };
  const filters: Record<string, string | number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!ALLOWED_FILTERS.has(key)) continue;
    if (key === 'days') {
      const days = Number(raw);
      filters.days = [7, 30, 90, 365].includes(days) ? days : 30;
    } else if (typeof raw === 'string' && raw.trim()) filters[key] = raw.trim().slice(0, 200);
  }
  filters.days ??= 30;
  return filters;
}

export function isSavedView(value: unknown): value is { id: string; name: string; filters: Record<string, string | number>; created_at: string } {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.name === 'string' &&
    !!item.filters && typeof item.filters === 'object' && typeof item.created_at === 'string';
}
