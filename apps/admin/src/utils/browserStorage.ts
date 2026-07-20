export type BrowserSetting =
  | 'adminMode'
  | 'analyticsAutoRefresh'
  | 'analyticsRefreshInterval'
  | 'apiBase'
  | 'demoAccess'
  | 'dismissedUpdateVersion'
  | 'linkView'
  | 'lastLoadedVersion'
  | 'locale'
  | 'sidebarCollapsed'
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
  analyticsAutoRefresh: 'linketry_analytics_auto_refresh',
  analyticsRefreshInterval: 'linketry_analytics_refresh_interval',
  apiBase: 'linketry_api_base',
  demoAccess: 'linketry_demo_access',
  dismissedUpdateVersion: 'linketry_dismissed_update_version',
  linkView: 'linketry_link_view',
  lastLoadedVersion: 'linketry_last_loaded_version',
  locale: 'linketry.locale',
  sidebarCollapsed: 'linketry_sidebar_collapsed',
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
