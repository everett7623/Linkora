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

test('stores the theme preference under the canonical Linketry key', () => {
  const storage = memoryStorage();
  writeBrowserSetting('theme', 'system', storage);
  assert.equal(storage.getItem('linketry_theme'), 'system');
});
