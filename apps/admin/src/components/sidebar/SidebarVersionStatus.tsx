import { CircleArrowUp, RefreshCw, Tag } from 'lucide-react';
import { clsx } from 'clsx';
import { LINKETRY_VERSION } from '@linketry/shared';
import { useLocale } from '../../contexts/LocaleContext';
import { useUpdateCheckContext } from '../../contexts/UpdateCheckContext';
import { useToast } from '../ui/Toast';

export function SidebarVersionStatus({ collapsed }: { collapsed: boolean }) {
  const { t } = useLocale();
  const { success, warning } = useToast();
  const updateCheck = useUpdateCheckContext();
  const latestVersion = updateCheck.result?.updateAvailable
    ? updateCheck.result.latestVersion
    : null;
  const accessibleLabel = updateCheck.checking
    ? t('checkingForUpdates')
    : latestVersion
      ? t('updateAvailableTitle', { version: latestVersion })
      : t('checkForUpdates');

  const handleCheck = async () => {
    try {
      const result = await updateCheck.checkNow({ forceRefresh: true, revealDismissed: true });
      if (result.updateAvailable) {
        warning(t('updateAvailableTitle', { version: result.latestVersion }));
      } else {
        success(t('updateCheckCurrent', { version: result.currentVersion }));
      }
    } catch {
      warning(t('updateCheckFailed'));
    }
  };

  return (
    <button
      type="button"
      data-testid="sidebar-version"
      onClick={() => void handleCheck()}
      disabled={updateCheck.checking}
      className={clsx(
        'relative flex w-full items-center rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-wait',
        collapsed ? 'h-10 justify-center px-1' : 'min-h-12 gap-3 px-3 py-2',
        latestVersion
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-400/60 hover:bg-amber-500/15'
          : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100'
      )}
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center">
        {updateCheck.checking ? (
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : latestVersion ? (
          <CircleArrowUp className="h-[18px] w-[18px]" aria-hidden="true" />
        ) : (
          <Tag className="h-4 w-4" aria-hidden="true" />
        )}
        {latestVersion && (
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
        )}
      </span>

      {!collapsed && (
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-mono text-xs font-semibold leading-4 text-slate-200">
            v{LINKETRY_VERSION}
          </span>
          <span
            className={clsx(
              'truncate text-[10px] leading-4',
              latestVersion ? 'text-amber-300' : 'text-slate-500'
            )}
          >
            {updateCheck.checking
              ? t('checkingForUpdates')
              : latestVersion
                ? t('sidebarUpdateAvailable', { version: latestVersion })
                : updateCheck.checkError
                  ? t('updateStatusUnavailable')
                  : t('upToDate')}
          </span>
        </span>
      )}
    </button>
  );
}
