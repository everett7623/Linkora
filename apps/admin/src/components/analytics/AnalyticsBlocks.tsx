import React from 'react';
import { Link } from 'react-router-dom';
import type { Visit } from '@linketry/shared';
import { useLocale } from '../../contexts/LocaleContext';
import { globalDistributionColor } from '../../utils/analyticsPalette';

export function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  const { locale } = useLocale();
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <div className="rounded-lg bg-brand-500/10 p-2 text-brand-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-100">
        {typeof value === 'number' ? value.toLocaleString(locale) : value}
      </div>
    </div>
  );
}

export function BarList({
  title,
  items,
  valueLabel,
  palette = 'brand',
}: {
  title: string;
  items: Array<{ label: string; value: number; to?: string }>;
  valueLabel?: string;
  palette?: 'brand' | 'global';
}) {
  const { locale, t } = useLocale();
  const displayValueLabel = valueLabel ?? t('clicksValue');
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-300">{title}</h2>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{t('noData')}</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.label}-${item.value}`} className="space-y-1">
              <div className="flex min-w-0 justify-between gap-3 text-xs">
                {item.to ? (
                  <Link
                    to={item.to}
                    className="min-w-0 truncate text-brand-400 hover:text-brand-300"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="min-w-0 truncate text-slate-400">{item.label}</span>
                )}
                <span className="shrink-0 text-slate-500">
                  {item.value.toLocaleString(locale)} {displayValueLabel}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  data-testid="analytics-bar-fill"
                  className={`h-full rounded-full ${
                    palette === 'global' ? globalDistributionColor(index) : 'bg-brand-500'
                  }`}
                  style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function DailyBars({ items }: { items: Array<{ date: string; clicks: number }> }) {
  const { locale, t } = useLocale();
  const max = Math.max(...items.map((item) => item.clicks), 1);
  const dateFormatter = new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric' });
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-300">{t('dailyClicks')}</h2>
      <div className="flex h-44 items-end gap-1">
        {items.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
            {t('noVisitsRange')}
          </div>
        ) : (
          items.map((item) => (
            <div key={item.date} className="flex min-w-4 flex-1 flex-col items-center gap-2">
              <div
                title={`${dateFormatter.format(new Date(item.date))}: ${item.clicks.toLocaleString(
                  locale
                )} ${t('clicksValue')}`}
                className="w-full rounded-t bg-brand-500"
                style={{ height: `${Math.max(4, (item.clicks / max) * 100)}%` }}
              />
              <span className="hidden text-[10px] text-slate-600 md:inline">
                {dateFormatter.format(new Date(item.date))}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function RecentVisits({ visits }: { visits: Visit[] }) {
  const { locale, t } = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-300">{t('recentVisits')}</h2>
      <div className="divide-y divide-slate-800">
        {visits.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">{t('noRecentVisits')}</p>
        ) : (
          visits.map((visit) => (
            <div key={visit.id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_1fr_1fr_auto]">
              <span className="font-mono text-brand-400">/{visit.slug}</span>
              <span className="truncate text-slate-400">{visit.referer ?? t('direct')}</span>
              <span className="text-slate-500">
                {visit.country ?? t('unknown')} / {visit.browser ?? t('other')} /{' '}
                {visit.os ?? t('other')} / {visit.device_type ?? t('unknown')}
              </span>
              <span className="text-xs text-slate-600">
                {dateFormatter.format(new Date(visit.created_at))}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
