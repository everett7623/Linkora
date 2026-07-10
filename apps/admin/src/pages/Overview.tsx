import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, MousePointerClick, TrendingUp, Plus, ExternalLink, Copy } from 'lucide-react';
import { getOverview } from '../api/links';
import { getSettings } from '../api/settings';
import { StatusBadge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { buildShortUrl } from '../utils/shortUrl';
import type { Link as LinkType } from '@linkora/shared';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useLocale } from '../contexts/LocaleContext';

dayjs.extend(relativeTime);

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-100">{value.toLocaleString()}</div>
    </div>
  );
}

function LinkRow({ link, defaultDomain }: { link: LinkType; defaultDomain: string }) {
  const { success } = useToast();
  const { locale, t } = useLocale();
  const shortUrl = buildShortUrl(link, defaultDomain);
  const copy = () => {
    navigator.clipboard.writeText(shortUrl);
    success(t('copiedClipboard'));
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-brand-400">/{link.slug}</span>
          <StatusBadge status={link.status} />
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{link.long_url}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-medium text-slate-300">
          {t('clicksCount', { count: link.clicks.toLocaleString(locale) })}
        </div>
        <div className="text-xs text-slate-600">
          {dayjs(link.created_at)
            .locale(locale === 'zh-CN' ? 'zh-cn' : 'en')
            .fromNow()}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={copy}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Copy size={14} />
        </button>
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

export function Overview() {
  const [stats, setStats] = useState<{
    totalLinks: number;
    totalClicks: number;
    todayClicks: number;
    recentLinks: LinkType[];
    topLinks: LinkType[];
  } | null>(null);
  const [defaultDomain, setDefaultDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const { error } = useToast();
  const { t } = useLocale();

  useEffect(() => {
    Promise.all([getOverview(), getSettings()])
      .then(([overview, settings]) => {
        setStats(overview);
        setDefaultDomain(settings.default_domain ?? '');
      })
      .catch(() => error(t('overviewLoadFailed')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('overview')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{t('dashboardSubtitle')}</p>
        </div>
        <Link
          to="/links/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} /> {t('createLink')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('totalLinks')}
          value={stats?.totalLinks ?? 0}
          icon={<Link2 size={16} className="text-brand-400" />}
          color="bg-brand-500/10"
        />
        <StatCard
          label={t('totalClicks')}
          value={stats?.totalClicks ?? 0}
          icon={<MousePointerClick size={16} className="text-emerald-400" />}
          color="bg-emerald-500/10"
        />
        <StatCard
          label={t('todayClicks')}
          value={stats?.todayClicks ?? 0}
          icon={<TrendingUp size={16} className="text-yellow-400" />}
          color="bg-yellow-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">{t('recentlyCreated')}</h2>
            <Link to="/links" className="text-xs text-brand-400 hover:text-brand-300">
              {t('viewAll')}
            </Link>
          </div>
          {stats?.recentLinks.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              {t('noLinksYet')}{' '}
              <Link to="/links/create" className="text-brand-400">
                {t('createOne')}
              </Link>
            </p>
          ) : (
            stats?.recentLinks.map((l) => (
              <LinkRow key={l.id} link={l} defaultDomain={defaultDomain} />
            ))
          )}
        </div>

        {/* Top Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">{t('topLinks')}</h2>
            <Link
              to="/links?sort=clicks_desc"
              className="text-xs text-brand-400 hover:text-brand-300"
            >
              {t('viewAll')}
            </Link>
          </div>
          {stats?.topLinks.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">{t('noClicksYet')}</p>
          ) : (
            stats?.topLinks.map((l) => (
              <LinkRow key={l.id} link={l} defaultDomain={defaultDomain} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
