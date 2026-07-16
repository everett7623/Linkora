const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const DEMO_READ_ONLY_ERROR = 'The public Linketry Demo is read-only.';

export function isPublicDemoBuild(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === 'true';
}

export function isReadOnlyRequest(method?: string): boolean {
  return READ_ONLY_METHODS.has((method ?? 'GET').toUpperCase());
}
