import React, { createContext, useContext, useMemo, useState } from 'react';
import { messages, type Locale, type MessageKey } from '../i18n/messages';
import { formatMessage, type MessageVariables } from '../i18n/formatMessage';

const STORAGE_KEY = 'linkora.locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, variables?: MessageVariables) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function initialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  return window.localStorage.getItem(STORAGE_KEY) === 'zh-CN' ? 'zh-CN' : 'en';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(initialLocale);
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale(next) {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
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
