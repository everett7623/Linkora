import assert from 'node:assert/strict';
import test from 'node:test';
import { readBrowserSetting, removeBrowserSetting, writeBrowserSetting } from './browserStorage.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

test('reads the canonical Linketry setting', () => {
  const storage = memoryStorage({
    linketry_api_base: 'https://new.example.com',
  });

  assert.equal(readBrowserSetting('apiBase', storage), 'https://new.example.com');
});

test('writes and removes canonical settings on logout', () => {
  const storage = memoryStorage();
  writeBrowserSetting('token', 'current-token', storage);
  assert.equal(storage.getItem('linketry_token'), 'current-token');

  removeBrowserSetting('token', storage);
  assert.equal(storage.getItem('linketry_token'), null);
});

test('stores sidebar and table density independently in the current browser', () => {
  const storage = memoryStorage();
  writeBrowserSetting('sidebarDensity', 'compact', storage);
  writeBrowserSetting('tableDensity', 'comfortable', storage);

  assert.equal(storage.getItem('linketry_sidebar_density'), 'compact');
  assert.equal(storage.getItem('linketry_table_density'), 'comfortable');
});

test('stores analytics auto-refresh preferences in the current browser', () => {
  const storage = memoryStorage();
  writeBrowserSetting('analyticsAutoRefresh', 'true', storage);
  writeBrowserSetting('analyticsRefreshInterval', '10', storage);

  assert.equal(storage.getItem('linketry_analytics_auto_refresh'), 'true');
  assert.equal(storage.getItem('linketry_analytics_refresh_interval'), '10');
});

test('stores sidebar collapse and Demo access independently', () => {
  const storage = memoryStorage();
  writeBrowserSetting('sidebarCollapsed', 'true', storage);
  writeBrowserSetting('demoAccess', 'granted', storage);

  assert.equal(storage.getItem('linketry_sidebar_collapsed'), 'true');
  assert.equal(storage.getItem('linketry_demo_access'), 'granted');
});

test('stores the selected Links view only in the current browser', () => {
  const storage = memoryStorage();
  writeBrowserSetting('linkView', 'cards', storage);

  assert.equal(storage.getItem('linketry_link_view'), 'cards');
});

test('stores the theme preference under the canonical Linketry key', () => {
  const storage = memoryStorage();
  writeBrowserSetting('theme', 'system', storage);
  assert.equal(storage.getItem('linketry_theme'), 'system');
});

test('stores update checks and dismissed versions separately', () => {
  const storage = memoryStorage();
  writeBrowserSetting('updateCheck', '{"latestVersion":"0.19.0","checkedAt":1}', storage);
  writeBrowserSetting('dismissedUpdateVersion', '0.19.0', storage);

  assert.equal(
    storage.getItem('linketry_update_check'),
    '{"latestVersion":"0.19.0","checkedAt":1}'
  );
  assert.equal(storage.getItem('linketry_dismissed_update_version'), '0.19.0');
});

test('stores the last loaded build separately from update discovery', () => {
  const storage = memoryStorage();
  writeBrowserSetting('lastLoadedVersion', '0.27.6', storage);
  writeBrowserSetting('updateCheck', '{"latestVersion":"0.27.7","checkedAt":1}', storage);

  assert.equal(storage.getItem('linketry_last_loaded_version'), '0.27.6');
  assert.equal(
    storage.getItem('linketry_update_check'),
    '{"latestVersion":"0.27.7","checkedAt":1}'
  );
});
