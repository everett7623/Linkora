import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Download,
  Link2,
  MousePointerClick,
  RotateCcw,
  Search,
  Target,
  Users,
} from 'lucide-react';
import {
  downloadAnalyticsReport,
  getAnalytics,
  type AnalyticsFilters,
  type AnalyticsSummary,
} from '../api/analytics';
import { BarList, DailyBars, Metric, RecentVisits } from '../components/analytics/AnalyticsBlocks';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';

const DEFAULT_FILTERS: AnalyticsFilters = { days: 30 };

export function Analytics() {
  const { success, error } = useToast();
  const { t } = useLocale();
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAnalytics(filters)
      .then(setData)
      .catch(() => error(t('analyticsLoadFailed')))
      .finally(() => setLoading(false));
  }, [filters]);

  const hasFilters = useMemo(
    () => Object.entries(filters).some(([key, value]) => key !== 'days' && !!value),
    [filters]
  );
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

  if (loading) {
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
        <Button
          variant="secondary"
          icon={<Download size={15} />}
          loading={downloading}
          onClick={exportReport}
        >
          {t('exportCsv')}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
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
            label="UTM Source"
            value={draft.utm_source ?? ''}
            onChange={(e) => set('utm_source', e.target.value)}
          />
          <Input
            label="UTM Medium"
            value={draft.utm_medium ?? ''}
            onChange={(e) => set('utm_medium', e.target.value)}
          />
          <Input
            label="UTM Campaign"
            value={draft.utm_campaign ?? ''}
            onChange={(e) => set('utm_campaign', e.target.value)}
          />
          <Input
            label="UTM Term"
            value={draft.utm_term ?? ''}
            onChange={(e) => set('utm_term', e.target.value)}
          />
          <Input
            label="UTM Content"
            value={draft.utm_content ?? ''}
            onChange={(e) => set('utm_content', e.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            icon={<RotateCcw size={15} />}
            onClick={reset}
            disabled={!hasFilters && filters.days === 30}
          >
            {t('reset')}
          </Button>
          <Button icon={<Search size={15} />} onClick={apply}>
            {t('applyFilters')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric
          label={t('totalClicks')}
          value={data?.totalClicks ?? 0}
          icon={<MousePointerClick size={16} />}
        />
        <Metric
          label={t('uniqueVisitors')}
          value={data?.uniqueVisitors ?? 0}
          icon={<Users size={16} />}
        />
        <Metric
          label={t('uniqueLinks')}
          value={data?.uniqueLinks ?? 0}
          icon={<Link2 size={16} />}
        />
        <Metric
          label={t('conversions')}
          value={data?.conversionsTotal ?? 0}
          icon={<Target size={16} />}
        />
        <Metric
          label={t('conversionRate')}
          value={`${data?.conversionRate ?? 0}%`}
          icon={<Activity size={16} />}
        />
        <Metric label={t('botRate')} value={`${botRate}%`} icon={<Bot size={16} />} />
      </div>

      <DailyBars items={data?.daily ?? []} />

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
          title={t('conversionEvents')}
          valueLabel={t('eventsValue')}
          items={(data?.topConversionEvents ?? []).map((item) => ({
            label: item.event_name,
            value: item.conversions,
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
          title={t('countries')}
          items={(data?.topCountries ?? []).map((item) => ({
            label: item.country,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('devices')}
          items={(data?.topDevices ?? []).map((item) => ({
            label: item.device_type,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('browsers')}
          items={(data?.topBrowsers ?? []).map((item) => ({
            label: item.browser,
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
