export const OPTIONAL_ADMIN_MODULES = [
  'bulk-create',
  'analytics',
  'domains',
  'groups',
  'redirect-rules',
  'health-checks',
  'operations',
  'backups',
  'api-tokens',
  'audit-logs',
] as const;

export function normalizeHiddenAdminModules(value: string): { value: string; error?: string } {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
      return { value: '[]', error: 'admin_hidden_modules must be a JSON string array' };
    }
    const knownModules = new Set<string>(OPTIONAL_ADMIN_MODULES);
    if (parsed.some((item) => !knownModules.has(item))) {
      return { value: '[]', error: 'admin_hidden_modules contains an unknown module' };
    }
    const selected = new Set(parsed);
    return {
      value: JSON.stringify(OPTIONAL_ADMIN_MODULES.filter((module) => selected.has(module))),
    };
  } catch {
    return { value: '[]', error: 'admin_hidden_modules must be valid JSON' };
  }
}
