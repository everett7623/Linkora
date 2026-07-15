import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { listBackups, type BackupsList } from '../api/backups';
import { listDomains } from '../api/domains';
import { getOverview } from '../api/links';
import { getSettings } from '../api/settings';
import { getAdminApiOrigin, getDeploymentCapabilities } from '../api/system';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import type { DeploymentCapabilities, Domain, Link as LinkType } from '@linketry/shared';
import { useAdminMode } from '../contexts/AdminModeContext';
import { SetupQuickLinks } from '../components/setup/SetupQuickLinks';
import { SetupCheckList, SetupSummary, type SetupCheck } from '../components/setup/SetupStatus';
import { AdvancedCapabilitiesPanel } from '../components/setup/AdvancedCapabilitiesPanel';
import { FirstRunWizard } from '../components/setup/FirstRunWizard';
import { useLocale } from '../contexts/LocaleContext';

interface SetupState {
  settings: Record<string, string>;
  domains: Domain[];
  backups: BackupsList | null;
  overview: {
    totalLinks: number;
    totalClicks: number;
    todayClicks: number;
    recentLinks: LinkType[];
    topLinks: LinkType[];
  } | null;
  capabilities: DeploymentCapabilities | null;
}

const emptyState: SetupState = {
  settings: {},
  domains: [],
  backups: null,
  overview: null,
  capabilities: null,
};

export function Setup() {
  const { error } = useToast();
  const { isAdvanced } = useAdminMode();
  const { locale, t } = useLocale();
  const [data, setData] = useState<SetupState>(emptyState);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, domains, backups, overview, capabilities] = await Promise.all([
        getSettings(),
        listDomains(),
        listBackups(),
        getOverview(),
        getDeploymentCapabilities(),
      ]);
      setData({ settings, domains, backups, overview, capabilities });
    } catch (e) {
      error(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const apiOrigin = getAdminApiOrigin();
  const defaultDomain = data.settings.default_domain ?? '';
  const activeDomains = data.domains.filter((domain) => domain.status === 'active');
  const defaultCatalogDomain = data.domains.find((domain) => domain.is_default === 1);

  const checks = useMemo<SetupCheck[]>(() => {
    const defaultDomainKnown = !!defaultDomain.trim();
    const catalogHasDefault = !!defaultCatalogDomain;
    const defaultDomainRegistered =
      !defaultDomainKnown ||
      data.domains.some((domain) => domain.domain === defaultDomain && domain.status === 'active');
    const apiReady = !!data.overview;

    const coreChecks: SetupCheck[] = [
      {
        title: t('workerApi'),
        detail: t(apiReady ? 'apiResponding' : 'apiNotResponding'),
        status: apiReady ? 'ok' : 'fail',
      },
      {
        title: t('adminApiOrigin'),
        detail: apiOrigin,
        status:
          apiOrigin.startsWith('https://') || apiOrigin.startsWith('http://localhost')
            ? 'ok'
            : 'warn',
      },
      {
        title: t('defaultShortDomain'),
        detail: defaultDomainKnown ? defaultDomain : t('noDefaultDomain'),
        status: defaultDomainKnown ? (defaultDomainRegistered ? 'ok' : 'warn') : 'warn',
        actionLabel: t('openSettings'),
        actionTo: '/settings',
      },
      {
        title: t('firstLink'),
        detail:
          data.overview && data.overview.totalLinks > 0
            ? t('linksCreated', { count: data.overview.totalLinks.toLocaleString(locale) })
            : t('noLinks'),
        status: data.overview && data.overview.totalLinks > 0 ? 'ok' : 'warn',
        actionLabel: t(data.overview && data.overview.totalLinks > 0 ? 'openLinks' : 'createLink'),
        actionTo: data.overview && data.overview.totalLinks > 0 ? '/links' : '/links/create',
      },
    ];
    if (!isAdvanced) return coreChecks;
    return [
      ...coreChecks,
      {
        title: t('domainCatalog'),
        detail:
          activeDomains.length > 0
            ? t('activeDomains', { count: activeDomains.length.toLocaleString(locale) })
            : t('noActiveDomains'),
        status: activeDomains.length > 0 && catalogHasDefault ? 'ok' : 'warn',
        actionLabel: t('openDomains'),
        actionTo: '/domains',
      },
      {
        title: t('r2Backups'),
        detail: data.backups?.r2Configured
          ? t('backupRecords', { count: data.backups.total.toLocaleString(locale) })
          : t('r2Unavailable'),
        status: data.backups?.r2Configured ? 'ok' : 'warn',
        actionLabel: t('openBackups'),
        actionTo: '/backups',
      },
    ];
  }, [
    activeDomains.length,
    apiOrigin,
    data,
    defaultCatalogDomain,
    defaultDomain,
    isAdvanced,
    locale,
    t,
  ]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('setup')}</h1>
          <p className="mt-0.5 text-sm text-slate-400">{t('instanceStatus')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={<RefreshCw size={15} />}
            onClick={load}
            loading={loading}
          >
            {t('refresh')}
          </Button>
          <a
            href="https://github.com/everett7623/Linketry/blob/main/docs/SELF_HOSTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition-colors hover:bg-slate-600"
          >
            <ExternalLink size={15} /> {t('selfHosting')}
          </a>
        </div>
      </div>

      <FirstRunWizard
        apiReady={Boolean(data.overview)}
        defaultDomain={defaultDomain}
        totalLinks={data.overview?.totalLinks ?? 0}
        isAdvanced={isAdvanced}
        apiOrigin={apiOrigin}
      />

      <SetupSummary checks={checks} apiOrigin={apiOrigin} />

      <SetupCheckList checks={checks} />

      {isAdvanced && data.capabilities && (
        <AdvancedCapabilitiesPanel capabilities={data.capabilities} />
      )}

      <SetupQuickLinks
        isAdvanced={isAdvanced}
        defaultDomain={defaultDomain}
        activeDomainCount={activeDomains.length}
        totalLinks={data.overview?.totalLinks ?? 0}
        r2Configured={data.backups?.r2Configured ?? false}
      />
    </div>
  );
}
