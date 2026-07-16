import React, { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { LINKETRY_VERSION } from '@linketry/shared';
import { checkForUpdates, type UpdateCheckResult } from '../api/updates';
import { useLocale } from '../contexts/LocaleContext';
import { readBrowserSetting, writeBrowserSetting } from '../utils/browserStorage';

export function UpdateBanner() {
  const { t } = useLocale();
  const [update, setUpdate] = useState<UpdateCheckResult | null>(null);

  useEffect(() => {
    let active = true;
    checkForUpdates({ currentVersion: LINKETRY_VERSION })
      .then((result) => {
        if (!active || !result.updateAvailable) return;
        let dismissedVersion: string | null = null;
        try {
          dismissedVersion = readBrowserSetting('dismissedUpdateVersion');
        } catch {
          // The notice can still be shown when browser storage is unavailable.
        }
        if (dismissedVersion !== result.latestVersion) setUpdate(result);
      })
      .catch(() => {
        // Update checks are optional and must never block the Admin shell.
      });
    return () => {
      active = false;
    };
  }, []);

  if (!update) return null;

  const dismiss = () => {
    setUpdate(null);
    try {
      writeBrowserSetting('dismissedUpdateVersion', update.latestVersion);
    } catch {
      // Dismiss for the current render even when persistence is unavailable.
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-7xl px-6" role="status" aria-live="polite">
      <div className="flex items-start gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-slate-200">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-100">
            {t('updateAvailableTitle', { version: update.latestVersion })}
          </p>
          <p className="mt-0.5 text-slate-400">
            {t('updateAvailableDescription', { currentVersion: update.currentVersion })}
          </p>
        </div>
        <a
          href={update.repositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-medium text-brand-400 hover:bg-brand-500/10 hover:text-brand-300"
        >
          {t('viewUpdate')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('dismissUpdate')}
          title={t('dismissUpdate')}
          className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
