import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_THEME_PREFERENCE, normalizeThemePreference, resolveTheme } from './theme.ts';

test('new sessions default to the dark product presentation', () => {
  assert.equal(DEFAULT_THEME_PREFERENCE, 'dark');
});

test('theme preference safely defaults to the operating system', () => {
  assert.equal(normalizeThemePreference(null), 'system');
  assert.equal(normalizeThemePreference('unexpected'), 'system');
  assert.equal(normalizeThemePreference('light'), 'light');
  assert.equal(normalizeThemePreference('dark'), 'dark');
});

test('system theme resolves from the current color scheme', () => {
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});
