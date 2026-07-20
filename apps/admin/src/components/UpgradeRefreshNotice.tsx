import React from 'react';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { LINKETRY_VERSION } from '@linketry/shared';
import { useLocale } from '../contexts/LocaleContext.tsx';

export function UpgradeRefreshNotice({
  targetVersion,
  completed,
  autoRefreshing,
  onDismiss,
  onReload,
}: {
  targetVersion: string;
  completed: boolean;
  autoRefreshing: boolean;
  onDismiss: () => void;
  onReload: () => void;
}) {
  const { t } = useLocale();
  const Icon = completed ? CheckCircle2 : RefreshCw;

  return (
    <div className="mx-auto mt-4 w-full max-w-[1600px] px-6" role="status" aria-live="polite">
      <div className="relative flex flex-col gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 pr-10 text-sm text-slate-200 sm:flex-row sm:items-center">
        <Icon
          className={`h-5 w-5 shrink-0 ${completed ? 'text-emerald-400' : 'text-brand-300'}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-100">
            {t(completed ? 'upgradeCompletedTitle' : 'upgradePropagationTitle', {
              version: targetVersion,
            })}
          </p>
          <p className="mt-0.5 text-slate-400">
            {completed
              ? t('upgradeCompletedDescription')
              : t(autoRefreshing ? 'upgradePropagationRefreshing' : 'upgradePropagationManual', {
                  currentVersion: LINKETRY_VERSION,
                })}
          </p>
        </div>
        {!completed && (
          <button
            type="button"
            onClick={onReload}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-500"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('refreshNow')}
          </button>
        )}
        {(completed || !autoRefreshing) && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t('dismissUpgradeResult')}
            title={t('dismissUpgradeResult')}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
