import React from 'react';
import { Link } from 'react-router-dom';
import { Archive, Globe2, Link2, Settings } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';

interface SetupQuickLinksProps {
  isAdvanced: boolean;
  defaultDomain: string;
  activeDomainCount: number;
  totalLinks: number;
  r2Configured: boolean;
}

const cardClass =
  'rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700';

export function SetupQuickLinks({
  isAdvanced,
  defaultDomain,
  activeDomainCount,
  totalLinks,
  r2Configured,
}: SetupQuickLinksProps) {
  const { locale, t } = useLocale();
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Link to="/settings" className={cardClass}>
        <Settings size={18} className="text-brand-400" />
        <div className="mt-3 text-sm font-medium text-slate-100">{t('settings')}</div>
        <div className="mt-1 text-xs text-slate-500">
          {defaultDomain || t('noDefaultDomainShort')}
        </div>
      </Link>
      {isAdvanced && (
        <Link to="/domains" className={cardClass}>
          <Globe2 size={18} className="text-emerald-400" />
          <div className="mt-3 text-sm font-medium text-slate-100">{t('domains')}</div>
          <div className="mt-1 text-xs text-slate-500">
            {t('active', { count: activeDomainCount.toLocaleString(locale) })}
          </div>
        </Link>
      )}
      <Link to="/links/create" className={cardClass}>
        <Link2 size={18} className="text-yellow-400" />
        <div className="mt-3 text-sm font-medium text-slate-100">{t('createLink')}</div>
        <div className="mt-1 text-xs text-slate-500">
          {t('total', { count: totalLinks.toLocaleString(locale) })}
        </div>
      </Link>
      {isAdvanced && (
        <Link to="/backups" className={cardClass}>
          <Archive size={18} className="text-purple-400" />
          <div className="mt-3 text-sm font-medium text-slate-100">{t('backups')}</div>
          <div className="mt-1 text-xs text-slate-500">
            {r2Configured ? t('r2Ready') : t('r2Unavailable')}
          </div>
        </Link>
      )}
    </div>
  );
}
