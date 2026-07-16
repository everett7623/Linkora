import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_LOCALE,
  getLocaleDefinition,
  isSupportedLocale,
  resolveLocale,
  supportedLocales,
} from './locales.ts';
import { messages } from './messages.ts';

const PLACEHOLDER_PATTERN = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;

function messageKeys(catalog: object): string[] {
  return Object.keys(catalog).sort();
}

function placeholders(message: string): string[] {
  return [...message.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]).sort();
}

test('registered locales match the shipped message catalogs', () => {
  assert.deepEqual(supportedLocales.map(({ code }) => code).sort(), Object.keys(messages).sort());
  assert.equal(isSupportedLocale(DEFAULT_LOCALE), true);
});

test('stored locale values resolve through the registry with an English fallback', () => {
  assert.equal(resolveLocale('zh-CN'), 'zh-CN');
  assert.equal(resolveLocale('unsupported'), DEFAULT_LOCALE);
  assert.equal(resolveLocale(null), DEFAULT_LOCALE);
  assert.equal(isSupportedLocale('zh'), false);
});

test('locale metadata has native labels and valid document attributes', () => {
  for (const locale of supportedLocales) {
    assert.ok(locale.nativeName.trim());
    assert.ok(locale.htmlLang.trim());
    assert.match(locale.htmlLang, /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);
    assert.ok(locale.direction === 'ltr' || locale.direction === 'rtl');
    assert.deepEqual(getLocaleDefinition(locale.code), locale);
  }
});

test('every locale preserves English keys, non-empty values, and placeholders', () => {
  const english = messages.en as Record<string, string>;
  const englishKeys = messageKeys(english);

  for (const [locale, catalogValue] of Object.entries(messages)) {
    const catalog = catalogValue as Record<string, string>;
    assert.deepEqual(
      messageKeys(catalog),
      englishKeys,
      `${locale} message keys differ from English`
    );

    for (const key of englishKeys) {
      assert.ok(catalog[key].trim(), `${locale}.${key} is empty`);
      assert.deepEqual(
        placeholders(catalog[key]),
        placeholders(english[key]),
        `${locale}.${key} placeholders differ from English`
      );
    }
  }
});
