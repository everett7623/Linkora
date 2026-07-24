import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import type { OnlineUpgradeCapability } from '../api/onlineUpgrade';
import { useLocale } from '../contexts/LocaleContext';

interface UpdateBannerActionsProps {
  capability: OnlineUpgradeCapability | null | undefined;
  changelogUrl: string;
  upgradeWorkflowUrl: string;
  runUrl: string | null;
  busy: boolean;
  onUpgrade: () => void;
}

const linkClass =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100';
const upgradeClass =
  'inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-2.5 py-1 font-medium text-white hover:bg-brand-500';

export function UpdateBannerActions({
  capability,
  changelogUrl,
  upgradeWorkflowUrl,
  runUrl,
  busy,
  onUpgrade,
}: UpdateBannerActionsProps) {
  const { t } = useLocale();

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-start gap-1 sm:justify-end">
      <a href={changelogUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {t('viewChanges')}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      {runUrl && (
        <a href={runUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {t('viewDeployment')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
      {capability?.enabled ? (
        <button
          type="button"
          data-testid="upgrade-action"
          onClick={onUpgrade}
          disabled={busy}
          className={`${upgradeClass} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
          {busy ? t('upgradingOnline') : t('upgradeOnline')}
        </button>
      ) : capability === undefined ? (
        <button type="button" disabled className={`${upgradeClass} opacity-60`}>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          {t('checkingUpgrade')}
        </button>
      ) : (
        <a
          data-testid="upgrade-action"
          href={upgradeWorkflowUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={upgradeClass}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {t('openDeployment')}
        </a>
      )}
    </div>
  );
}
