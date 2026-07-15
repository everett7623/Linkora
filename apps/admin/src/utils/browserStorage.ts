export type BrowserSetting =
  'adminMode' | 'apiBase' | 'locale' | 'sidebarDensity' | 'tableDensity' | 'theme' | 'token';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEYS: Record<BrowserSetting, string> = {
  adminMode: 'linketry_admin_mode',
  apiBase: 'linketry_api_base',
  locale: 'linketry.locale',
  sidebarDensity: 'linketry_sidebar_density',
  tableDensity: 'linketry_table_density',
  theme: 'linketry_theme',
  token: 'linketry_token',
};

export function readBrowserSetting(
  setting: BrowserSetting,
  storage: StorageLike = window.localStorage
): string | null {
  return storage.getItem(STORAGE_KEYS[setting]);
}

export function writeBrowserSetting(
  setting: BrowserSetting,
  value: string,
  storage: StorageLike = window.localStorage
): void {
  storage.setItem(STORAGE_KEYS[setting], value);
}

export function removeBrowserSetting(
  setting: BrowserSetting,
  storage: StorageLike = window.localStorage
): void {
  storage.removeItem(STORAGE_KEYS[setting]);
}
