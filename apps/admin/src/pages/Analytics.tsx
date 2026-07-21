import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  ChevronDown,
  Download,
  Link2,
  MousePointerClick,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Users,
  Save,
  Trash2,
  Clock3,
  Activity,
  UserCheck,
} from 'lucide-react';
import {
  downloadAnalyticsReport,
  getAnalytics,
  type AnalyticsFilters,
  type AnalyticsSummary,
  getSavedAnalyticsViews,
  saveAnalyticsView,
  deleteAnalyticsView,
  type SavedAnalyticsView,
  getAnalyticsReportState,
  saveAnalyticsReportConfig,
  runAnalyticsReport,
  downloadScheduledAnalyticsReport,
  type AnalyticsReportState,
} from '../api/analytics';
import { BarList, Metric, RecentVisits } from '../components/analytics/AnalyticsBlocks';
import { TrafficTrendPanel } from '../components/analytics/TrafficTrendPanel';
import { WorldTrafficMap } from '../components/analytics/WorldTrafficMap';
import { AudienceComposition } from '../components/analytics/AudienceComposition';
import { ActivityHeatmap } from '../components/analytics/ActivityHeatmap';
import { PeriodComparisonPanel } from '../components/analytics/PeriodComparisonPanel';
import { TrafficAnomalyPanel } from '../components/analytics/TrafficAnomalyPanel';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';
import { AnalyticsRefreshControl } from '../components/analytics/AnalyticsRefreshControl';
import { ConversionInsights } from '../components/analytics/ConversionInsights';
import { useAnalyticsRefresh } from '../hooks/useAnalyticsRefresh';

const DEFAULT_FILTERS: AnalyticsFilters = { days: 30 };

export function Analytics() {
  const { success, error } = useToast();
  const { t } = useLocale();
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [views, setViews] = useState<SavedAnalyticsView[]>([]);
  const [viewName, setViewName] = useState('');
  const [selectedView, setSelectedView] = useState('');
  const [reports, setReports] = useState<AnalyticsReportState | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const loadAnalytics = useCallback(() => getAnalytics(filters), [filters]);
  const handleAnalyticsError = useCallback(() => error(t('analyticsLoadFailed')), [error, t]);
  const refresh = useAnalyticsRefresh({
    load: loadAnalytics,
    onData: setData,
    onError: handleAnalyticsError,
  });

  useEffect(() => {
    getSavedAnalyticsViews()
      .then((result) => setViews(result.items))
      .catch(() => error(t('savedViewsLoadFailed')));
  }, []);
  useEffect(() => {
    getAnalyticsReportState()
      .then(setReports)
      .catch(() => error(t('scheduledReportsLoadFailed')));
  }, []);

  const hasDraftFilters = useMemo(
    () => Object.entries(draft).some(([key, value]) => key !== 'days' && !!value),
    [draft]
  );
  const advancedFilterCount = useMemo(() => countAdvancedFilters(draft), [draft]);
  const botRate = data?.totalClicks
    ? Math.round(((data.botClicks ?? 0) / data.totalClicks) * 100)
    : 0;

  const set = (key: keyof AnalyticsFilters, value: string | number) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const apply = () => setFilters(cleanFilters(draft));
  const reset = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setAdvancedFiltersOpen(false);
  };

  const exportReport = async () => {
    setDownloading(true);
    try {
      await downloadAnalyticsReport(filters);
      success(t('reportDownloaded'));
    } catch {
      error(t('reportDownloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  const saveView = async () => {
    try {
      const view = await saveAnalyticsView(viewName, cleanFilters(draft));
      setViews((items) => [...items, view]);
      setViewName('');
      setSelectedView(view.id);
      success(t('savedViewCreated'));
    } catch (e) {
      error(String(e));
    }
  };
  const applyView = (id: string) => {
    setSelectedView(id);
    const view = views.find((item) => item.id === id);
    if (!view) return;
    const next = cleanFilters(view.filters);
    setDraft(next);
    setFilters(next);
    setAdvancedFiltersOpen(countAdvancedFilters(next) > 0);
  };
  const removeView = async () => {
    if (!selectedView) return;
    try {
      await deleteAnalyticsView(selectedView);
      setViews((items) => items.filter((item) => item.id !== selectedView));
      setSelectedView('');
      success(t('savedViewDeleted'));
    } catch (e) {
      error(String(e));
    }
  };
  const updateReportConfig = async () => {
    if (!reports) return;
    setReportBusy(true);
    try {
      const config = await saveAnalyticsReportConfig(reports.config);
      setReports({ ...reports, config });
      success(t('scheduledReportsSaved'));
    } catch (e) {
      error(String(e));
    } finally {
      setReportBusy(false);
    }
  };
  const runReport = async () => {
    setReportBusy(true);
    try {
      const record = await runAnalyticsReport();
      setReports((state) =>
        state ? { ...state, records: [record, ...state.records].slice(0, 30) } : state
      );
      success(t('scheduledReportCreated'));
    } catch (e) {
      error(String(e));
    } finally {
      setReportBusy(false);
    }
  };

  if (refresh.initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('analytics')}</h1>
          <p className="mt-0.5 text-sm text-slate-400">{t('analyticsSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AnalyticsRefreshControl
            enabled={refresh.autoRefresh}
            intervalSeconds={refresh.intervalSeconds}
            refreshing={refresh.refreshing}
            lastUpdated={refresh.lastUpdated}
            onEnabledChange={refresh.setAutoRefresh}
            onIntervalChange={refresh.setIntervalSeconds}
            onRefresh={refresh.refreshNow}
          />
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            loading={downloading}
            onClick={exportReport}
          >
            {t('exportCsv')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-b border-slate-800 pb-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto]">
          <Select
            aria-label={t('savedViews')}
            value={selectedView}
            onChange={(e) => applyView(e.target.value)}
          >
            <option value="">{t('savedViews')}</option>
            {views.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </Select>
          <Button
            variant="danger"
            icon={<Trash2 size={15} />}
            disabled={!selectedView}
            onClick={removeView}
            className="h-10 w-10 px-0"
            aria-label={t('deleteSavedView')}
            title={t('deleteSavedView')}
          />
          <input
            aria-label={t('savedViewName')}
            placeholder={t('savedViewName')}
            maxLength={50}
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            className="h-10 min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder-slate-500 transition-colors hover:border-slate-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button
            variant="secondary"
            icon={<Save size={15} />}
            disabled={!viewName.trim() || views.length >= 20}
            onClick={saveView}
            className="h-10 w-10 px-0"
            aria-label={t('saveCurrentView')}
            title={t('saveCurrentView')}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-52">
            <Select
              label={t('range')}
              value={String(draft.days ?? 30)}
              onChange={(e) => set('days', Number(e.target.value))}
            >
              <option value="7">{t('last7')}</option>
              <option value="30">{t('last30')}</option>
              <option value="90">{t('last90')}</option>
              <option value="365">{t('last365')}</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button
              data-testid="advanced-analytics-toggle"
              variant="ghost"
              icon={<SlidersHorizontal size={15} />}
              aria-expanded={advancedFiltersOpen}
              onClick={() => setAdvancedFiltersOpen((open) => !open)}
            >
              {t('advancedAnalyticsFilters')}
              {advancedFilterCount > 0 && (
                <span className="rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] text-brand-300">
                  {advancedFilterCount}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform ${advancedFiltersOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </Button>
            <Button
              variant="secondary"
              icon={<RotateCcw size={15} />}
              onClick={reset}
              disabled={!hasDraftFilters && draft.days === 30}
              className="h-9 w-9 px-0"
              aria-label={t('reset')}
              title={t('reset')}
            />
            <Button icon={<Search size={15} />} onClick={apply}>
              {t('applyFilters')}
            </Button>
          </div>
        </div>

        {advancedFiltersOpen && (
          <div
            data-testid="advanced-analytics-filters"
            className="mt-4 grid gap-3 border-t border-slate-800 pt-4 md:grid-cols-3 xl:grid-cols-5"
          >
            <Input
              label={t('slugFilter')}
              value={draft.slug ?? ''}
              onChange={(e) => set('slug', e.target.value)}
            />
            <Input
              label={t('domain')}
              value={draft.domain ?? ''}
              onChange={(e) => set('domain', e.target.value)}
            />
            <Input
              label={t('tag')}
              value={draft.tag ?? ''}
              onChange={(e) => set('tag', e.target.value)}
            />
            <Input
              label={t('campaign')}
              value={draft.campaign ?? ''}
              onChange={(e) => set('campaign', e.target.value)}
            />
            <Input
              label={t('project')}
              value={draft.project ?? ''}
              onChange={(e) => set('project', e.target.value)}
            />
            <Input
              label={t('country')}
              value={draft.country ?? ''}
              onChange={(e) => set('country', e.target.value)}
            />
            <Select
              label={t('device')}
              value={draft.device ?? ''}
              onChange={(e) => set('device', e.target.value)}
            >
              <option value="">{t('allDevices')}</option>
              <option value="desktop">{t('desktop')}</option>
              <option value="mobile">{t('mobile')}</option>
              <option value="tablet">{t('tablet')}</option>
            </Select>
            <Input
              label={t('browser')}
              value={draft.browser ?? ''}
              onChange={(e) => set('browser', e.target.value)}
            />
            <Input
              label={t('referrer')}
              value={draft.referer ?? ''}
              onChange={(e) => set('referer', e.target.value)}
            />
            <Input
              label={t('utmSource')}
              value={draft.utm_source ?? ''}
              onChange={(e) => set('utm_source', e.target.value)}
            />
            <Input
              label={t('utmMedium')}
              value={draft.utm_medium ?? ''}
              onChange={(e) => set('utm_medium', e.target.value)}
            />
            <Input
              label={t('utmCampaign')}
              value={draft.utm_campaign ?? ''}
              onChange={(e) => set('utm_campaign', e.target.value)}
            />
            <Input
              label={t('utmTerm')}
              value={draft.utm_term ?? ''}
              onChange={(e) => set('utm_term', e.target.value)}
            />
            <Input
              label={t('utmContent')}
              value={draft.utm_content ?? ''}
              onChange={(e) => set('utm_content', e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <Metric
          label={t('totalClicks')}
          value={data?.totalClicks ?? 0}
          icon={<MousePointerClick size={16} />}
        />
        <Metric
          label={t('todayClicks')}
          value={data?.daily[data.daily.length - 1]?.clicks ?? 0}
          icon={<Activity size={16} />}
        />
        <Metric
          label={t('uniqueVisitors')}
          value={data?.uniqueVisitors ?? 0}
          icon={<Users size={16} />}
        />
        <Metric
          label={t('humanClicks')}
          value={data?.eligibleClicks ?? 0}
          icon={<UserCheck size={16} />}
        />
        <Metric
          label={t('uniqueLinks')}
          value={data?.uniqueLinks ?? 0}
          icon={<Link2 size={16} />}
        />
        <Metric label={t('botRate')} value={`${botRate}%`} icon={<Bot size={16} />} />
      </div>

      <ConversionInsights summary={data} />

      <PeriodComparisonPanel summary={data} />

      <TrafficTrendPanel summary={data} />

      <ActivityHeatmap summary={data} />

      <WorldTrafficMap summary={data} />

      <AudienceComposition summary={data} />

      {reports && (
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Clock3 size={16} />
                {t('scheduledReports')}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{t('scheduledReportsHint')}</p>
            </div>
            {!reports.r2Configured && (
              <span className="text-xs text-yellow-300">{t('r2NotConfigured')}</span>
            )}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={reports.config.enabled}
                onChange={(e) =>
                  setReports({
                    ...reports,
                    config: { ...reports.config, enabled: e.target.checked },
                  })
                }
              />
              {t('enableDailyReports')}
            </label>
            <Select
              aria-label={`${t('scheduledReports')} - ${t('range')}`}
              value={String(reports.config.days)}
              onChange={(e) =>
                setReports({
                  ...reports,
                  config: { ...reports.config, days: Number(e.target.value) },
                })
              }
            >
              <option value="7">{t('last7')}</option>
              <option value="30">{t('last30')}</option>
              <option value="90">{t('last90')}</option>
              <option value="365">{t('last365')}</option>
            </Select>
            <Select
              aria-label={`${t('scheduledReports')} - ${t('savedViews')}`}
              value={reports.config.saved_view_id ?? ''}
              onChange={(e) =>
                setReports({
                  ...reports,
                  config: { ...reports.config, saved_view_id: e.target.value || null },
                })
              }
            >
              <option value="">{t('allAnalytics')}</option>
              {views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-4 flex gap-2">
            <Button loading={reportBusy} onClick={updateReportConfig}>
              {t('saveSchedule')}
            </Button>
            <Button
              variant="secondary"
              loading={reportBusy}
              disabled={!reports.r2Configured}
              onClick={runReport}
            >
              {t('runReportNow')}
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-800">
                {reports.records.slice(0, 10).map((record) => (
                  <tr key={`${record.key}-${record.created_at}`}>
                    <td className="py-3 text-slate-400">
                      {new Date(record.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 text-slate-400">
                      {record.status === 'completed' ? t('completedStatus') : t('failedStatus')}
                    </td>
                    <td className="py-3 text-right">
                      {record.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Download size={14} />}
                          onClick={() => downloadScheduledAnalyticsReport(record)}
                        >
                          {t('download')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.records.length === 0 && (
              <p className="py-3 text-sm text-slate-500">{t('noScheduledReports')}</p>
            )}
          </div>
        </section>
      )}

      <TrafficAnomalyPanel />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarList
          title={t('topLinksTitle')}
          items={(data?.topLinks ?? []).map((item) => ({
            label: `/${item.slug}${item.title ? ` - ${item.title}` : ''}`,
            value: item.clicks,
            to: item.id ? `/analytics/links/${item.id}` : undefined,
          }))}
        />
        <BarList
          title={t('redirectTargets')}
          items={(data?.topTargets ?? []).map((item) => ({
            label: item.target_url,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('topReferrers')}
          items={(data?.topReferrers ?? []).map((item) => ({
            label: item.referer,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmSources')}
          items={(data?.topUtmSources ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmMediums')}
          items={(data?.topUtmMediums ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmCampaigns')}
          items={(data?.topUtmCampaigns ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmTerms')}
          items={(data?.topUtmTerms ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmContents')}
          items={(data?.topUtmContents ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('operatingSystems')}
          items={(data?.topOperatingSystems ?? []).map((item) => ({
            label: item.os,
            value: item.clicks,
          }))}
        />
      </div>

      <RecentVisits visits={data?.recentVisits ?? []} />
    </div>
  );
}

function cleanFilters(filters: AnalyticsFilters): AnalyticsFilters {
  const next: AnalyticsFilters = {};
  for (const [key, value] of Object.entries(filters) as Array<
    [keyof AnalyticsFilters, string | number | undefined]
  >) {
    if (value !== undefined && String(value).trim() !== '') next[key] = value as never;
  }
  return next;
}

function countAdvancedFilters(filters: AnalyticsFilters): number {
  return Object.entries(filters).filter(
    ([key, value]) =>
      key !== 'days' && value !== undefined && value !== null && String(value).trim()
  ).length;
}
