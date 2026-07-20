import React from 'react';
import { Coffee, Languages, Moon, Sun } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getLocaleDefinition, supportedLocales } from '../../i18n/locales';
import { EVERETTLABS_SUPPORT_URL } from '../../utils/externalLinks';

const CONTROL_CLASS =
  'flex h-9 min-w-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

export function SidebarUtilityActions({ collapsed = false }: { collapsed?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  const { resolvedTheme, setPreference } = useTheme();
  const currentLocale = getLocaleDefinition(locale);
  const currentIndex = supportedLocales.findIndex((option) => option.code === locale);
  const nextLocale =
    supportedLocales[(currentIndex + 1) % supportedLocales.length] ?? currentLocale;
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const languageLabel = t('switchLanguage', {
    current: currentLocale.nativeName,
    next: nextLocale.nativeName,
  });
  const themeLabel = t('switchTheme', {
    theme: t(nextTheme === 'light' ? 'lightTheme' : 'darkTheme'),
  });

  return (
    <div
      role="group"
      aria-label={t('quickActions')}
      className={collapsed ? 'flex flex-col gap-2' : 'grid grid-cols-3 gap-2'}
    >
      <button
        type="button"
        onClick={() => setLocale(nextLocale.code)}
        className={CONTROL_CLASS}
        aria-label={languageLabel}
        title={languageLabel}
      >
        <Languages size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setPreference(nextTheme)}
        className={CONTROL_CLASS}
        aria-label={themeLabel}
        title={themeLabel}
      >
        {nextTheme === 'light' ? (
          <Sun size={17} aria-hidden="true" />
        ) : (
          <Moon size={17} aria-hidden="true" />
        )}
      </button>
      <a
        href={EVERETTLABS_SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={CONTROL_CLASS}
        aria-label={t('supportEverettlabs')}
        title={t('supportEverettlabs')}
      >
        <Coffee size={17} aria-hidden="true" />
      </a>
    </div>
  );
}
