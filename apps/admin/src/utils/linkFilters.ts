const ADVANCED_FILTER_KEYS = [
  'tag',
  'source',
  'domain',
  'createdFrom',
  'createdTo',
  'hasPassword',
  'warning',
  'limits',
] as const;

export function stripAdvancedLinkFilters(current: URLSearchParams): URLSearchParams | null {
  const next = new URLSearchParams(current);
  let changed = false;
  for (const key of ADVANCED_FILTER_KEYS) {
    if (next.has(key)) {
      next.delete(key);
      changed = true;
    }
  }
  if (changed) next.delete('page');
  return changed ? next : null;
}
