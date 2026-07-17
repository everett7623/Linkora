export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#f8fafc',
  dark: '#0f172a',
};

export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference !== 'system') return preference;
  return systemPrefersDark ? 'dark' : 'light';
}
