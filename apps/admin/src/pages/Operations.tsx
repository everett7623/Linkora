import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Archive, Database, RefreshCw, Server, Waypoints } from 'lucide-react';
import type { DeploymentCapabilities, LinkHealthBatchResult } from '@linkora/shared';
import { listBackups, type BackupsList } from '../api/backups';
import {
  getHealthAlertStatus,
  getHealthCheckHistory,
  runHealthCheckBatch,
  type HealthAlertStatus,
  type HealthCheckHistory,
} from '../api/healthChecks';
import { getSettings } from '../api/settings';
import { getDeploymentCapabilities } from '../api/system';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';

interface OperationsState {
  settings: Record<string, string>;
  backups: BackupsList | null;
  capabilities: DeploymentCapabilities | null;
  alerts: HealthAlertStatus | null;
  history: HealthCheckHistory | null;
}

const EMPTY_STATE: OperationsState = {
  settings: {},
  backups: null,
  capabilities: null,
  alerts: null,
  history: null,
};

export function Operations() {
  const { error } = useToast();
  const { locale, t } = useLocale();
  const [state, setState] = useState<OperationsState>(EMPTY_STATE);
  const [health, setHealth] = useState<LinkHealthBatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, backups, capabilities, alerts, history] = await Promise.all([
        getSettings(),
        listBackups(),
        getDeploymentCapabilities(),
        getHealthAlertStatus(),
        getHealthCheckHistory(),
      ]);
      setState({ settings, backups, capabilities, alerts, history });
    } catch (e) {
      error(String(e));
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    load();
  }, [load]);

  const latestBackup = state.backups?.items.find((backup) => backup.status === 'completed');
  const backupAgeHours = latestBackup
    ? Math.max(0, (Date.now() - new Date(latestBackup.created_at).getTime()) / 3_600_000)
    : null;
  const backupFresh = backupAgeHours !== null && backupAgeHours <= 26;
  const monitoringEnabled = state.settings.health_monitoring_enabled === 'true';
  const monitoringLimit = Number(state.settings.health_monitoring_limit ?? 20);
  const failedTargets = useMemo(
    () => health?.items.filter((item) => item.status !== 'healthy') ?? [],
    [health]
  );

  const runChecks = async () => {
    setChecking(true);
    try {
      setHealth(await runHealthCheckBatch({ limit: monitoringLimit }));
    } catch (e) {
      error(String(e));
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('operationsDashboard')}</h1>
          <p className="mt-0.5 text-sm text-slate-400">{t('operationsSubtitle')}</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={load}>
          {t('refresh')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusMetric
          icon={<Archive size={17} />}
          label={t('backupFreshness')}
          value={
            latestBackup
              ? t(backupFresh ? 'backupFresh' : 'backupStale', {
                  date: dateFormatter.format(new Date(latestBackup.created_at)),
                })
              : t('noCompletedBackup')
          }
          healthy={backupFresh}
        />
        <StatusMetric
          icon={<Activity size={17} />}
          label={t('scheduledMonitoring')}
          value={
            monitoringEnabled
              ? t('monitoringEnabledCount', { count: monitoringLimit.toLocaleString(locale) })
              : t('monitoringDisabled')
          }
          healthy={monitoringEnabled}
        />
        <StatusMetric
          icon={<Waypoints size={17} />}
          label={t('visitQueue')}
          value={state.capabilities?.advanced.visitQueue ? t('configured') : t('notConfigured')}
          healthy={Boolean(state.capabilities?.advanced.visitQueue)}
        />
        <StatusMetric
          icon={<Server size={17} />}
          label={t('deploymentHealth')}
          value={state.capabilities ? t('workerResponding') : t('unavailable')}
          healthy={Boolean(state.capabilities)}
        />
      </div>

      <section className="space-y-4 border-t border-slate-800 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{t('activeHealthAlerts')}</h2>
            <p className="mt-1 text-xs text-slate-500">{t('activeHealthAlertsHint')}</p>
          </div>
          {state.alerts?.last_alert_at && (
            <span className="text-xs text-slate-500">
              {t('lastAlertAt', {
                date: dateFormatter.format(new Date(state.alerts.last_alert_at)),
              })}
            </span>
          )}
        </div>

        {!state.alerts || state.alerts.items.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-emerald-300">
            <Database size={17} />
            {t('noActiveHealthAlerts')}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {state.alerts.items.map((item) => (
              <div key={item.link_id} className="border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-slate-200">
                      {item.slug ? `/${item.slug}` : item.link_id}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-600">
                      {item.domain ?? item.fallback_url ?? item.link_id}
                    </p>
                  </div>
                  <Badge variant={item.alerted ? 'red' : 'yellow'}>
                    {item.alerted ? t('alertedStatus') : t('pendingStatus')}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  {t('consecutiveFailuresCount', {
                    count: item.consecutive_failures.toLocaleString(locale),
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-slate-800 pt-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{t('scheduledHealthHistory')}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('scheduledHealthHistoryHint')}</p>
        </div>
        {!state.history || state.history.items.length === 0 ? (
          <p className="text-sm text-slate-500">{t('noScheduledHealthHistory')}</p>
        ) : (
          <div className="overflow-x-auto border-t border-slate-800">
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase text-slate-500">
                <th className="px-3 py-3 text-left">{t('target')}</th>
                <th className="px-3 py-3 text-left">{t('status')}</th>
                <th className="px-3 py-3 text-right">{t('http')}</th>
                <th className="px-3 py-3 text-right">{t('failureCount')}</th>
                <th className="px-3 py-3 text-right">{t('checkedAt')}</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-800">
                {state.history.items.slice(0, 20).map((item, index) => (
                  <tr key={`${item.link_id}-${item.checked_at}-${index}`}>
                    <td className="max-w-xs px-3 py-3">
                      <p className="truncate font-mono text-slate-300">{item.slug ? `/${item.slug}` : item.link_id}</p>
                      <p className="truncate text-xs text-slate-600">{item.domain ?? item.link_id}</p>
                    </td>
                    <td className="px-3 py-3"><Badge variant={item.status === 'healthy' ? 'green' : item.status === 'warning' ? 'yellow' : 'red'}>{t(`${item.status}Status`)}</Badge></td>
                    <td className="px-3 py-3 text-right text-slate-400">{item.http_status ?? '-'}</td>
                    <td className="px-3 py-3 text-right text-slate-400">{item.consecutive_failures.toLocaleString(locale)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-slate-500">{dateFormatter.format(new Date(item.checked_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4 border-y border-slate-800 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{t('targetHealthSnapshot')}</h2>
            <p className="mt-1 text-xs text-slate-500">{t('targetHealthSnapshotHint')}</p>
          </div>
          <Button icon={<Activity size={15} />} onClick={runChecks} loading={checking}>
            {t('checkNow')}
          </Button>
        </div>

        {!health ? (
          <p className="text-sm text-slate-500">{t('noHealthSnapshot')}</p>
        ) : failedTargets.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-emerald-300">
            <Database size={17} />
            {t('allCheckedTargetsHealthy', { count: health.total.toLocaleString(locale) })}
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="px-3 py-3 text-left">{t('target')}</th>
                  <th className="px-3 py-3 text-left">{t('status')}</th>
                  <th className="px-3 py-3 text-right">{t('http')}</th>
                  <th className="px-3 py-3 text-left">{t('fallbackUrlOptional')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {failedTargets.map((item) => (
                  <tr key={item.link_id ?? item.url}>
                    <td className="max-w-md px-3 py-3">
                      <p className="truncate text-slate-300">{item.slug ? `/${item.slug}` : item.url}</p>
                      <p className="truncate text-xs text-slate-600">{item.error ?? item.url}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={item.status === 'warning' ? 'yellow' : 'red'}>
                        {t(item.status === 'warning' ? 'warningStatus' : 'brokenStatus')}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-400">{item.http_status ?? '-'}</td>
                    <td className="max-w-xs px-3 py-3">
                      <p className="truncate text-xs text-slate-500">{item.fallback_url ?? '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusMetric({
  icon,
  label,
  value,
  healthy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  healthy: boolean;
}) {
  return (
    <div className="border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{label}</span>
        <span className={healthy ? 'text-emerald-400' : 'text-yellow-400'}>{icon}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
