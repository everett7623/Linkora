import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { messages, type Locale, type MessageKey } from '../i18n/messages';
import { formatMessage, type MessageVariables } from '../i18n/formatMessage';
import { DEFAULT_LOCALE, getLocaleDefinition, resolveLocale } from '../i18n/locales';
import { readBrowserSetting, writeBrowserSetting } from '../utils/browserStorage';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, variables?: MessageVariables) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function initialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return resolveLocale(readBrowserSetting('locale'));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(initialLocale);
  useEffect(() => {
    const definition = getLocaleDefinition(locale);
    document.documentElement.lang = definition.htmlLang;
    document.documentElement.dir = definition.direction;
  }, [locale]);
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale(next) {
        writeBrowserSetting('locale', next);
        updateLocale(next);
      },
      t(key, variables = {}) {
        return formatMessage(messages[locale][key] as string, variables);
      },
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
