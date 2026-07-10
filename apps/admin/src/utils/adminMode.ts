export type AdminMode = 'simple' | 'advanced';

export function normalizeAdminMode(value: string | null | undefined): AdminMode {
  return value === 'advanced' ? 'advanced' : 'simple';
}

export function isFeatureVisible(mode: AdminMode, advanced = false): boolean {
  return mode === 'advanced' || !advanced;
}
