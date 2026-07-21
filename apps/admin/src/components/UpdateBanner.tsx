import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { UpdateCheckResult } from '../api/updates';
import {
  fetchRuntimeVersion,
  getOnlineUpgradeCapability,
  getOnlineUpgradeRun,
  startOnlineUpgrade,
  type OnlineUpgradeCapability,
} from '../api/onlineUpgrade';
import { isAdminReleaseReady } from '../api/adminRelease.ts';
import { useLocale } from '../contexts/LocaleContext';
import { useUpgradeFeedback } from '../hooks/useUpgradeFeedback.ts';
import { SUCCESS_RELOAD_DELAY_MS } from '../hooks/useUpgradeReload';
import { waitForOnlineUpgrade, type OnlineUpgradePhase } from '../utils/onlineUpgrade';
import { UpgradeConfirmDialog } from './UpgradeConfirmDialog';
import { UpgradeRefreshNotice } from './UpgradeRefreshNotice.tsx';
import { UpdateBannerActions } from './UpdateBannerActions';
import { useToast } from './ui/Toast';

type BannerPhase = 'idle' | 'starting' | OnlineUpgradePhase | 'success' | 'failed';

export function UpdateBanner({
  update,
  onDismiss,
}: {
  update: UpdateCheckResult | null;
  onDismiss: () => void;
}) {
  const { t } = useLocale();
  const toast = useToast();
  const [capability, setCapability] = useState<OnlineUpgradeCapability | null | undefined>();
  const [phase, setPhase] = useState<BannerPhase>('idle');
  const [runUrl, setRunUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const activeRef = useRef(true);
  const upgradeFeedback = useUpgradeFeedback();

  useEffect(() => {
    setPhase('idle');
    setRunUrl(null);
    setError(null);
    setConfirmOpen(false);
  }, [update?.latestVersion]);

  useEffect(() => {
    if (!update) return;
    let active = true;
    setCapability(undefined);
    getOnlineUpgradeCapability()
      .then((result) => {
        if (active) setCapability(result);
      })
      .catch(() => {
        if (active) setCapability(null);
      });
    return () => {
      active = false;
    };
  }, [update]);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  if (upgradeFeedback.feedback) {
    return (
      <UpgradeRefreshNotice
        targetVersion={upgradeFeedback.feedback.targetVersion}
        completed={upgradeFeedback.completed}
        autoRefreshing={upgradeFeedback.autoRefreshing}
        onDismiss={upgradeFeedback.dismiss}
        onReload={upgradeFeedback.reloadNow}
      />
    );
  }

  if (!update) return null;

  const automaticCapability =
    capability?.enabled &&
    capability.repositoryUrl === update.repositoryUrl &&
    capability.branch === update.branch
      ? capability
      : capability === undefined
        ? undefined
        : null;

  const dismiss = () => {
    if (phase !== 'idle' && phase !== 'failed') return;
    onDismiss();
  };

  const startUpgrade = async () => {
    if (!automaticCapability?.enabled || (phase !== 'idle' && phase !== 'failed')) return;
    setConfirmOpen(false);
    setPhase('starting');
    setError(null);
    setRunUrl(null);

    try {
      const dispatch = await startOnlineUpgrade();
      if (!activeRef.current) return;
      setRunUrl(dispatch.runUrl);
      const result = await waitForOnlineUpgrade({
        targetVersion: update.latestVersion,
        runId: dispatch.runId,
        readRun: getOnlineUpgradeRun,
        readRuntimeVersion: fetchRuntimeVersion,
        readAdminReady: () => isAdminReleaseReady(update.latestVersion),
        onPhase: (nextPhase) => {
          if (!activeRef.current) return;
          setPhase(nextPhase);
        },
        shouldContinue: () => activeRef.current,
      });
      if (!activeRef.current || result.outcome === 'cancelled') return;
      if (result.outcome === 'success') {
        upgradeFeedback.rememberSuccessfulDeployment(update.latestVersion);
        setPhase('success');
        toast.success(t('upgradeSucceeded'));
        upgradeFeedback.scheduleReload(SUCCESS_RELOAD_DELAY_MS);
        return;
      }
      setPhase('failed');
      const failureMessage =
        result.outcome === 'timeout'
          ? t('upgradeTimeout')
          : result.outcome === 'verification_failed'
            ? t('upgradeVerificationFailed')
            : t('upgradeFailed', { conclusion: result.conclusion ?? 'unknown' });
      setError(failureMessage);
      if (result.outcome === 'verification_failed') toast.warning(failureMessage);
      else toast.error(failureMessage);
    } catch (upgradeError) {
      if (!activeRef.current) return;
      setPhase('failed');
      const failureMessage =
        upgradeError instanceof Error ? upgradeError.message : t('upgradeFailedGeneric');
      setError(failureMessage);
      toast.error(failureMessage);
    }
  };

  const busy = !['idle', 'failed'].includes(phase);
  const progressMessage =
    error ?? (phase === 'idle' || phase === 'failed' ? null : t(phaseMessageKey(phase)));

  return (
    <>
      <div className="mx-auto mt-4 w-full max-w-[1600px] px-6" role="status" aria-live="polite">
        <div className="relative flex flex-col gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 pr-10 text-sm text-slate-200 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-100">
              {t('updateAvailableTitle', { version: update.latestVersion })}
            </p>
            <p className="mt-0.5 text-slate-400">
              {t(
                automaticCapability?.enabled
                  ? 'updateAvailableAutomaticDescription'
                  : 'updateAvailableDescription',
                { currentVersion: update.currentVersion }
              )}
            </p>
            {progressMessage && (
              <p className={error ? 'mt-1 text-red-300' : 'mt-1 text-brand-200'}>
                {progressMessage}
              </p>
            )}
          </div>
          <UpdateBannerActions
            capability={automaticCapability}
            changelogUrl={update.changelogUrl}
            upgradeWorkflowUrl={update.upgradeWorkflowUrl}
            runUrl={runUrl}
            busy={busy}
            onUpgrade={() => setConfirmOpen(true)}
          />
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('dismissUpdate')}
            title={t('dismissUpdate')}
            disabled={busy}
            className="absolute right-3 top-3 shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <UpgradeConfirmDialog
        open={confirmOpen}
        version={update.latestVersion}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void startUpgrade()}
      />
    </>
  );
}

function phaseMessageKey(phase: Exclude<BannerPhase, 'idle' | 'failed'>) {
  const keys = {
    starting: 'upgradeStarting',
    queued: 'upgradeQueued',
    running: 'upgradeRunning',
    finalizing: 'upgradeFinalizing',
    success: 'upgradeSucceeded',
  } as const;
  return keys[phase];
}
