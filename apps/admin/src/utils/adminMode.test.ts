import assert from 'node:assert/strict';
import test from 'node:test';
import { isFeatureVisible, normalizeAdminMode, resolveInitialAdminMode } from './adminMode.ts';
import { normalizeApiBase } from './apiBase.ts';
import { stripAdvancedLinkFilters } from './linkFilters.ts';
import { enabledAdvancedCapabilityCount } from './capabilities.ts';
import { getSetupWizardState } from './setupWizard.ts';
import { messages } from '../i18n/messages.ts';
import { formatMessage } from '../i18n/formatMessage.ts';

test('Simple mode is the safe default', () => {
  assert.equal(normalizeAdminMode(null), 'simple');
  assert.equal(normalizeAdminMode('unexpected'), 'simple');
  assert.equal(normalizeAdminMode('advanced'), 'advanced');
});

test('Public Demo starts in Advanced mode without overriding an explicit choice', () => {
  assert.equal(resolveInitialAdminMode(null, true), 'advanced');
  assert.equal(resolveInitialAdminMode('unexpected', true), 'advanced');
  assert.equal(resolveInitialAdminMode('simple', true), 'simple');
  assert.equal(resolveInitialAdminMode('advanced', false), 'advanced');
  assert.equal(resolveInitialAdminMode(null, false), 'simple');
});

test('Advanced features are hidden only in Simple mode', () => {
  assert.equal(isFeatureVisible('simple', true), false);
  assert.equal(isFeatureVisible('simple', false), true);
  assert.equal(isFeatureVisible('advanced', true), true);
});

test('API origins are normalized without paths or trailing slashes', () => {
  assert.equal(normalizeApiBase('go.example.com/'), 'https://go.example.com');
  assert.equal(normalizeApiBase('https://go.example.com/api'), 'https://go.example.com');
  assert.equal(normalizeApiBase('javascript:alert(1)'), '');
  assert.equal(normalizeApiBase(''), '');
});

test('Switching to Simple mode removes hidden advanced filters', () => {
  const filtered = stripAdvancedLinkFilters(
    new URLSearchParams('keyword=docs&domain=s.example.com&page=3')
  );
  assert.equal(filtered?.toString(), 'keyword=docs');
  assert.equal(stripAdvancedLinkFilters(new URLSearchParams('keyword=docs')), null);
});

test('Advanced capability summary counts only optional enabled features', () => {
  assert.equal(
    enabledAdvancedCapabilityCount({
      profile: 'advanced',
      core: { d1: true, kv: true },
      advanced: { r2Backups: true, visitQueue: false, configuredDomains: 2, multipleDomains: true },
    }),
    2
  );
});

test('Quick deployment requires API, one default domain, and one link', () => {
  assert.deepEqual(getSetupWizardState(true, 's.example.com', 1), {
    apiReady: true,
    domainReady: true,
    linkReady: true,
    completed: 3,
    ready: true,
  });
  assert.equal(getSetupWizardState(true, '  ', 0).completed, 1);
  assert.equal(getSetupWizardState(true, 's.example.com', Number.NaN).ready, false);
});

test('English and Chinese message catalogs have identical keys', () => {
  assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages['zh-CN']).sort());
  assert.equal(messages.en.signIn, 'Sign In');
});

test('Message interpolation replaces repeated variables without changing unknown placeholders', () => {
  assert.equal(formatMessage('{count} of {count}', { count: 3 }), '3 of 3');
  assert.equal(
    formatMessage('Hello {name} {missing}', { name: 'Linketry' }),
    'Hello Linketry {missing}'
  );
});
