export interface UtmTemplateValues { source: string; medium: string; campaign: string; term: string; content: string; }
export function normalizeUtmValues(value: unknown): UtmTemplateValues {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const clean = (key: string) => typeof input[key] === 'string' ? input[key].trim().slice(0, 200) : '';
  return { source: clean('source'), medium: clean('medium'), campaign: clean('campaign'), term: clean('term'), content: clean('content') };
}
export function isUtmTemplate(value: unknown): value is { id:string; name:string; values:UtmTemplateValues; created_at:string } {
  if (!value || typeof value !== 'object') return false; const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.name === 'string' && !!item.values && typeof item.values === 'object' && typeof item.created_at === 'string';
}
