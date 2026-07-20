import { useCallback, useEffect, useState } from 'react';
import { LINKETRY_VERSION } from '@linketry/shared';
import {
  clearUpgradeFeedback,
  markFollowUpRefreshScheduled,
  readOrInferUpgradeFeedback,
  rememberSuccessfulDeployment,
} from '../utils/upgradeFeedback.ts';
import {
  FINALIZING_RELOAD_DELAY_MS,
  useUpgradeReload,
} from './useUpgradeReload.ts';

export function useUpgradeFeedback() {
  const scheduleReload = useUpgradeReload();
  const [feedback, setFeedback] = useState(() =>
    readOrInferUpgradeFeedback(LINKETRY_VERSION)
  );
  const completed = feedback?.targetVersion === LINKETRY_VERSION;
  const autoRefreshing = Boolean(
    feedback && !completed && !feedback.followUpRefreshScheduled
  );

  useEffect(() => {
    if (!feedback || !autoRefreshing) return;
    markFollowUpRefreshScheduled(feedback);
    scheduleReload(FINALIZING_RELOAD_DELAY_MS);
  }, [autoRefreshing, feedback, scheduleReload]);

  const dismiss = useCallback(() => {
    clearUpgradeFeedback();
    setFeedback(null);
  }, []);

  const reloadNow = useCallback(() => {
    if (feedback) markFollowUpRefreshScheduled(feedback);
    window.location.reload();
  }, [feedback]);

  return {
    feedback,
    completed,
    autoRefreshing,
    dismiss,
    reloadNow,
    rememberSuccessfulDeployment,
    scheduleReload,
  };
}
