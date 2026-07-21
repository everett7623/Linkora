import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Download,
  Edit3,
  Link2,
  MousePointerClick,
  Users,
  Copy,
  Share2,
  Trash2,
} from 'lucide-react';
import {
  downloadAnalyticsReport,
  getLinkAnalytics,
  getPublicStatsConfig,
  createPublicStatsShare,
  disablePublicStatsShare,
  type PublicStatsConfig,
  type LinkAnalyticsResponse,
} from '../api/analytics';
import { BarList, DailyBars, Metric, RecentVisits } from '../components/analytics/AnalyticsBlocks';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';
import { getApiBase } from '../api/client';
import { AnalyticsRefreshControl } from '../components/analytics/AnalyticsRefreshControl';
import { ConversionInsights } from '../components/analytics/ConversionInsights';
import { useAnalyticsRefresh } from '../hooks/useAnalyticsRefresh';

export function LinkAnalytics() {
  const { id = '' } = useParams();
  const { success, error } = useToast();
  const { t } = useLocale();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<LinkAnalyticsResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [share, setShare] = useState<PublicStatsConfig>({ enabled: false });
  const [shareDays, setShareDays] = useState(30);
  const [showCountries, setShowCountries] = useState(false);
  const [showReferrers, setShowReferrers] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);

  const loadAnalytics = useCallback(() => getLinkAnalytics(id, { days }), [days, id]);
  const handleAnalyticsError = useCallback(() => error(t('linkAnalyticsLoadFailed')), [error, t]);
  const refresh = useAnalyticsRefresh({
    load: loadAnalytics,
    onData: setData,
    onError: handleAnalyticsError,
  });

  useEffect(() => {
    if (!id) return;
    getPublicStatsConfig(id)
      .then((config) => {
        setShare(config);
        setShareDays(config.days ?? 30);
        setShowCountries(config.show_countries ?? false);
        setShowReferrers(config.show_referrers ?? false);
      })
      .catch(() => error(t('publicStatsLoadFailed')));
  }, [id]);

  const createShare = async () => {
    setSharing(true);
    try {
      const config = await createPublicStatsShare(id, {
        days: shareDays,
        show_countries: showCountries,
        show_referrers: showReferrers,
      });
      setShare(config);
      const url = `${getApiBase() || window.location.origin}/stats/${config.token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      success(t('publicStatsCreated'));
    } catch {
      error(t('publicStatsCreateFailed'));
    } finally {
      setSharing(false);
    }
  };

  const disableShare = async () => {
    setSharing(true);
    try {
      await disablePublicStatsShare(id);
      setShare({ enabled: false });
      setShareUrl('');
      success(t('publicStatsDisabled'));
    } catch {
      error(t('publicStatsDisableFailed'));
    } finally {
      setSharing(false);
    }
  };

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

  if (refresh.initialLoading) {
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
          <AnalyticsRefreshControl
            enabled={refresh.autoRefresh}
            intervalSeconds={refresh.intervalSeconds}
            refreshing={refresh.refreshing}
            lastUpdated={refresh.lastUpdated}
            onEnabledChange={refresh.setAutoRefresh}
            onIntervalChange={refresh.setIntervalSeconds}
            onRefresh={refresh.refreshNow}
          />
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

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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
        <Metric label={t('botRate')} value={`${botRate}%`} icon={<Bot size={16} />} />
        <Metric
          label={t('status')}
          value={link?.status ?? t('unknown')}
          icon={<Link2 size={16} />}
        />
      </div>

      <ConversionInsights summary={summary} />

      <DailyBars items={summary?.daily ?? []} />

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Share2 size={16} />
              {t('publicStatsShare')}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{t('publicStatsPrivacyHint')}</p>
          </div>
          {share.enabled && <span className="text-xs text-emerald-400">{t('enabled')}</span>}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Select value={String(shareDays)} onChange={(e) => setShareDays(Number(e.target.value))}>
            <option value="7">{t('last7')}</option>
            <option value="30">{t('last30')}</option>
            <option value="90">{t('last90')}</option>
            <option value="365">{t('last365')}</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showCountries}
              onChange={(e) => setShowCountries(e.target.checked)}
            />
            {t('shareCountries')}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showReferrers}
              onChange={(e) => setShowReferrers(e.target.checked)}
            />
            {t('shareReferrers')}
          </label>
        </div>
        {shareUrl && (
          <div className="mt-4 flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="min-w-0 flex-1 border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300"
            />
            <Button
              variant="secondary"
              icon={<Copy size={15} />}
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              {t('copyAction')}
            </Button>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button loading={sharing} icon={<Share2 size={15} />} onClick={createShare}>
            {share.enabled ? t('rotateShareLink') : t('createShareLink')}
          </Button>
          {share.enabled && (
            <Button
              loading={sharing}
              variant="danger"
              icon={<Trash2 size={15} />}
              onClick={disableShare}
            >
              {t('disableShare')}
            </Button>
          )}
        </div>
        {share.enabled && !shareUrl && (
          <p className="mt-3 text-xs text-yellow-300">{t('shareTokenHidden')}</p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarList
          title={t('redirectTargets')}
          items={(summary?.topTargets ?? []).map((item) => ({
            label: item.target_url,
            value: item.clicks,
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
          title={t('globalAccessDistribution')}
          palette="global"
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
