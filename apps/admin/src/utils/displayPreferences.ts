export type DisplayDensity = 'comfortable' | 'compact';

export const OPTIONAL_MODULES = [
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

export type OptionalModule = (typeof OPTIONAL_MODULES)[number];

const OPTIONAL_MODULE_SET = new Set<string>(OPTIONAL_MODULES);

export function normalizeDisplayDensity(value: string | null | undefined): DisplayDensity {
  return value === 'compact' ? 'compact' : 'comfortable';
}

export function parseHiddenModules(value: string | null | undefined): OptionalModule[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return OPTIONAL_MODULES.filter((module) => parsed.includes(module));
  } catch {
    return [];
  }
}

export function serializeHiddenModules(modules: readonly OptionalModule[]): string {
  const selected = new Set(modules);
  return JSON.stringify(OPTIONAL_MODULES.filter((module) => selected.has(module)));
}

export function isOptionalModule(value: string | undefined): value is OptionalModule {
  return value !== undefined && OPTIONAL_MODULE_SET.has(value);
}

export function isModuleVisible(
  module: OptionalModule | undefined,
  hiddenModules: readonly OptionalModule[]
): boolean {
  return module === undefined || !hiddenModules.includes(module);
}
