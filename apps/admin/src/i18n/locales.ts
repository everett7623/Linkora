import type { Locale } from './messages';

export interface LocaleDefinition {
  code: Locale;
  nativeName: string;
  htmlLang: string;
  direction: 'ltr' | 'rtl';
}

export const DEFAULT_LOCALE = 'en' satisfies Locale;

const localeDefinitions = {
  en: {
    code: 'en',
    nativeName: 'English',
    htmlLang: 'en',
    direction: 'ltr',
  },
  'zh-CN': {
    code: 'zh-CN',
    nativeName: '简体中文',
    htmlLang: 'zh-CN',
    direction: 'ltr',
  },
} satisfies Record<Locale, LocaleDefinition>;

export const supportedLocales: readonly LocaleDefinition[] = Object.values(localeDefinitions);

export function isSupportedLocale(value: string | null): value is Locale {
  return value !== null && Object.prototype.hasOwnProperty.call(localeDefinitions, value);
}

export function resolveLocale(value: string | null): Locale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function getLocaleDefinition(locale: Locale): LocaleDefinition {
  return localeDefinitions[locale];
}
