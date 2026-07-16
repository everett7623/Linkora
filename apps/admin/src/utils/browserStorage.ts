export type BrowserSetting =
  | 'adminMode'
  | 'apiBase'
  | 'dismissedUpdateVersion'
  | 'linkView'
  | 'locale'
  | 'sidebarDensity'
  | 'tableDensity'
  | 'theme'
  | 'token'
  | 'updateCheck';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEYS: Record<BrowserSetting, string> = {
  adminMode: 'linketry_admin_mode',
  apiBase: 'linketry_api_base',
  dismissedUpdateVersion: 'linketry_dismissed_update_version',
  linkView: 'linketry_link_view',
  locale: 'linketry.locale',
  sidebarDensity: 'linketry_sidebar_density',
  tableDensity: 'linketry_table_density',
  theme: 'linketry_theme',
  token: 'linketry_token',
  updateCheck: 'linketry_update_check',
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
