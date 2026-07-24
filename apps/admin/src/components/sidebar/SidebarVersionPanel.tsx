import type { ReactNode } from 'react';
import { CircleAlert, CircleArrowUp, CheckCircle2, ExternalLink, RefreshCw, X } from 'lucide-react';
import { clsx } from 'clsx';
import { LINKETRY_VERSION } from '@linketry/shared';
import type { UpdateCheckResult } from '../../api/updates';
import { useLocale } from '../../contexts/LocaleContext';

interface SidebarVersionPanelProps {
  mobile: boolean;
  checking: boolean;
  checkError: string | null;
  result: UpdateCheckResult | null;
  onCheck: () => void;
  onClose: () => void;
  onUpgrade: () => void;
}

export function SidebarVersionPanel({
  mobile,
  checking,
  checkError,
  result,
  onCheck,
  onClose,
  onUpgrade,
}: SidebarVersionPanelProps) {
  const { t } = useLocale();
  const latestVersion = result?.updateAvailable ? result.latestVersion : null;

  return (
    <div
      id="sidebar-version-panel"
      data-testid="sidebar-version-panel"
      role="dialog"
      aria-label={t('releaseStatus')}
      className={clsx(
        'z-50 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl shadow-slate-950/40',
        mobile
          ? 'fixed left-4 top-4 w-[min(20rem,calc(100vw-2rem))]'
          : 'absolute left-[calc(100%+0.75rem)] top-0 w-[min(20rem,calc(100vw-2rem))]'
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <span className="text-sm font-semibold">{t('releaseStatus')}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCheck}
            disabled={checking}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:cursor-wait disabled:opacity-60"
            aria-label={t('checkForUpdates')}
            title={t('checkForUpdates')}
          >
            <RefreshCw className={clsx('h-4 w-4', checking && 'animate-spin')} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label={t('closeVersionPanel')}
            title={t('closeVersionPanel')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="px-4 py-5 text-center">
        <p className="font-mono text-3xl font-semibold text-slate-100">v{LINKETRY_VERSION}</p>
        <p className="mt-1 text-xs text-slate-500">{t('installedVersion')}</p>
      </div>
      <div className="px-4 pb-4">
        {checking ? (
          <StatusBox
            tone="neutral"
            icon={<RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />}
          >
            {t('checkingForUpdates')}
          </StatusBox>
        ) : latestVersion && result ? (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
            <div className="flex items-start gap-2.5">
              <CircleArrowUp
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-100">{t('updateAvailable')}</p>
                <p className="mt-0.5 text-xs text-amber-200/80">v{latestVersion}</p>
              </div>
            </div>
            <button
              type="button"
              data-testid="sidebar-upgrade-action"
              onClick={onUpgrade}
              className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              <CircleArrowUp className="h-4 w-4" aria-hidden="true" />
              {t('upgradeOnline')}
            </button>
            <a
              href={result.changelogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              {t('viewChanges')}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        ) : checkError ? (
          <StatusBox tone="danger" icon={<CircleAlert className="h-4 w-4" aria-hidden="true" />}>
            {t('updateStatusUnavailable')}
          </StatusBox>
        ) : (
          <StatusBox tone="success" icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}>
            {t('upToDate')}
          </StatusBox>
        )}
      </div>
    </div>
  );
}

function StatusBox({
  tone,
  icon,
  children,
}: {
  tone: 'neutral' | 'success' | 'danger';
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2.5 rounded-lg border px-3 py-3 text-sm',
        tone === 'success' && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
        tone === 'danger' && 'border-red-400/30 bg-red-400/10 text-red-200',
        tone === 'neutral' && 'border-slate-700 bg-slate-800/60 text-slate-300'
      )}
      role="status"
      aria-live="polite"
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}
