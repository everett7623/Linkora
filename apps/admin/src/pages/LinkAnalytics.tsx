import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Bot,
  Download,
  Edit3,
  Link2,
  MousePointerClick,
  Target,
  Users,
} from 'lucide-react';
import {
  downloadAnalyticsReport,
  getLinkAnalytics,
  type LinkAnalyticsResponse,
} from '../api/analytics';
import { BarList, DailyBars, Metric, RecentVisits } from '../components/analytics/AnalyticsBlocks';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';

export function LinkAnalytics() {
  const { id = '' } = useParams();
  const { success, error } = useToast();
  const { t } = useLocale();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<LinkAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getLinkAnalytics(id, { days })
      .then(setData)
      .catch(() => error(t('linkAnalyticsLoadFailed')))
      .finally(() => setLoading(false));
  }, [id, days]);

  const exportReport = async () => {
    setDownloading(true);
    try {
      await downloadAnalyticsReport({ days, link_id: id });
      success(t('linkReportDownloaded'));
    } catch {
      error(t('linkReportDownloadFailed'));
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

  const summary = data?.summary;
  const link = data?.link;
  const botRate = summary?.totalClicks
    ? Math.round(((summary.botClicks ?? 0) / summary.totalClicks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <RouterLink
            to="/analytics"
            className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft size={15} />
            {t('analytics')}
          </RouterLink>
          <h1 className="text-2xl font-bold text-slate-100">/{link?.slug ?? t('unknown')}</h1>
          <p className="mt-0.5 max-w-3xl truncate text-sm text-slate-400">{link?.long_url}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select
            value={String(days)}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-40"
          >
            <option value="7">{t('last7')}</option>
            <option value="30">{t('last30')}</option>
            <option value="90">{t('last90')}</option>
            <option value="365">{t('last365')}</option>
          </Select>
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            loading={downloading}
            onClick={exportReport}
          >
            {t('exportCsv')}
          </Button>
          {link && (
            <RouterLink to={`/links/${link.id}/edit`}>
              <Button icon={<Edit3 size={15} />}>{t('editLink')}</Button>
            </RouterLink>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric
          label={t('clicks')}
          value={summary?.totalClicks ?? 0}
          icon={<MousePointerClick size={16} />}
        />
        <Metric
          label={t('uniqueVisitors')}
          value={summary?.uniqueVisitors ?? 0}
          icon={<Users size={16} />}
        />
        <Metric
          label={t('conversions')}
          value={summary?.conversionsTotal ?? 0}
          icon={<Target size={16} />}
        />
        <Metric
          label={t('conversionRate')}
          value={`${summary?.conversionRate ?? 0}%`}
          icon={<Activity size={16} />}
        />
        <Metric label={t('botRate')} value={`${botRate}%`} icon={<Bot size={16} />} />
        <Metric
          label={t('status')}
          value={link?.status ?? t('unknown')}
          icon={<Link2 size={16} />}
        />
      </div>

      <DailyBars items={summary?.daily ?? []} />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarList
          title={t('redirectTargets')}
          items={(summary?.topTargets ?? []).map((item) => ({
            label: item.target_url,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('conversionEvents')}
          valueLabel={t('eventsValue')}
          items={(summary?.topConversionEvents ?? []).map((item) => ({
            label: item.event_name,
            value: item.conversions,
          }))}
        />
        <BarList
          title={t('topReferrers')}
          items={(summary?.topReferrers ?? []).map((item) => ({
            label: item.referer,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('countries')}
          items={(summary?.topCountries ?? []).map((item) => ({
            label: item.country,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('devices')}
          items={(summary?.topDevices ?? []).map((item) => ({
            label: item.device_type,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('browsers')}
          items={(summary?.topBrowsers ?? []).map((item) => ({
            label: item.browser,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmSources')}
          items={(summary?.topUtmSources ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmMediums')}
          items={(summary?.topUtmMediums ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmCampaigns')}
          items={(summary?.topUtmCampaigns ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmTerms')}
          items={(summary?.topUtmTerms ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
        <BarList
          title={t('utmContents')}
          items={(summary?.topUtmContents ?? []).map((item) => ({
            label: item.value,
            value: item.clicks,
          }))}
        />
      </div>

      <RecentVisits visits={summary?.recentVisits ?? []} />
    </div>
  );
}
