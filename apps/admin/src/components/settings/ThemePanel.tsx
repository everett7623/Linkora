import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { useLocale } from '../../contexts/LocaleContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { MessageKey } from '../../i18n/messages';
import type { ThemePreference } from '../../utils/theme';

const THEME_OPTIONS: Array<{
  preference: ThemePreference;
  title: MessageKey;
  description: MessageKey;
  icon: React.ReactNode;
}> = [
  {
    preference: 'system',
    title: 'systemTheme',
    description: 'systemThemeHelp',
    icon: <Monitor size={18} aria-hidden="true" />,
  },
  {
    preference: 'light',
    title: 'lightTheme',
    description: 'lightThemeHelp',
    icon: <Sun size={18} aria-hidden="true" />,
  },
  {
    preference: 'dark',
    title: 'darkTheme',
    description: 'darkThemeHelp',
    icon: <Moon size={18} aria-hidden="true" />,
  },
];

export function ThemePanel() {
  const { preference, setPreference } = useTheme();
  const { t } = useLocale();

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t('theme')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{t('themeHelp')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const selected = option.preference === preference;
          return (
            <button
              key={option.preference}
              type="button"
              onClick={() => setPreference(option.preference)}
              aria-pressed={selected}
              className={clsx(
                'rounded-lg border p-4 text-left transition-colors',
                selected
                  ? 'border-brand-500 bg-brand-500/10 text-slate-100'
                  : 'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                {option.icon}
                {t(option.title)}
              </span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                {t(option.description)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
