import React from 'react';
import { Gauge, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminMode, type AdminMode } from '../../contexts/AdminModeContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { MessageKey } from '../../i18n/messages';

const OPTIONS: Array<{
  mode: AdminMode;
  title: MessageKey;
  description: MessageKey;
  icon: React.ReactNode;
}> = [
  {
    mode: 'simple',
    title: 'simpleMode',
    description: 'simpleModeHelp',
    icon: <Gauge size={18} />,
  },
  {
    mode: 'advanced',
    title: 'advancedMode',
    description: 'advancedModeHelp',
    icon: <Sparkles size={18} />,
  },
];

export function AdminModePanel() {
  const { mode, setMode } = useAdminMode();
  const { t } = useLocale();

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t('interfaceMode')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{t('modeHelp')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = option.mode === mode;
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => setMode(option.mode)}
              className={clsx(
                'rounded-lg border p-4 text-left transition-colors',
                selected
                  ? 'border-brand-500 bg-brand-500/10 text-slate-100'
                  : 'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
              )}
              aria-pressed={selected}
            >
              <div className="flex items-center gap-2 font-medium">
                {option.icon}
                {t(option.title)}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{t(option.description)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
