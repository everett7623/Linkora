import { ArrowDownRight, ArrowUpRight, Minus, Sparkles, type LucideIcon } from 'lucide-react';
import type { AnalyticsSummary } from '../../api/analytics';
import { useLocale } from '../../contexts/LocaleContext';

export function PeriodComparisonPanel({ summary }: { summary: AnalyticsSummary | null }) {
  const { locale, t } = useLocale();
  const previous = summary?.previousPeriod;
  const currentBotRate = rate(summary?.botClicks ?? 0, summary?.totalClicks ?? 0);
  const previousBotRate = rate(previous?.botClicks ?? 0, previous?.totalClicks ?? 0);
  const items = [
    {
      label: t('totalClicks'),
      current: summary?.totalClicks ?? 0,
      previous: previous?.totalClicks ?? 0,
      suffix: '',
    },
    {
      label: t('humanClicks'),
      current: summary?.eligibleClicks ?? 0,
      previous: previous?.humanClicks ?? 0,
      suffix: '',
    },
    {
      label: t('uniqueVisitors'),
      current: summary?.uniqueVisitors ?? 0,
      previous: previous?.uniqueVisitors ?? 0,
      suffix: '',
    },
    {
      label: t('botRate'),
      current: currentBotRate,
      previous: previousBotRate,
      suffix: '%',
      inverse: true,
    },
  ];

  return (
    <section
      className="rounded-xl border border-slate-800 bg-slate-900 p-5"
      data-testid="period-comparison"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{t('periodComparison')}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('periodComparisonSubtitle')}</p>
        </div>
        <div className="flex gap-4 text-[11px] text-slate-500">
          <span>{t('currentPeriod')}</span>
          <span>{t('previousPeriod')}</span>
        </div>
      </div>
      <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <ComparisonMetric key={item.label} {...item} locale={locale} />
        ))}
      </div>
    </section>
  );
}

function ComparisonMetric({
  label,
  current,
  previous,
  suffix,
  locale,
  inverse = false,
}: {
  label: string;
  current: number;
  previous: number;
  suffix: string;
  locale: string;
  inverse?: boolean;
}) {
  const { t } = useLocale();
  const delta = comparisonDelta(current, previous, inverse);
  const Icon = delta.icon;
  return (
    <div className="min-w-0 border-l-2 border-slate-700 pl-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 flex min-w-0 items-baseline gap-2">
        <strong className="text-xl font-semibold text-slate-100">
          {current.toLocaleString(locale)}
          {suffix}
        </strong>
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${delta.color}`}>
          <Icon size={13} aria-hidden="true" />
          {delta.percent === null ? t('newTraffic') : `${Math.abs(delta.percent)}%`}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {t('previousPeriod')}: {previous.toLocaleString(locale)}
        {suffix}
      </div>
    </div>
  );
}

function comparisonDelta(
  current: number,
  previous: number,
  inverse: boolean
): { percent: number | null; icon: LucideIcon; color: string } {
  if (previous === 0 && current > 0) {
    return {
      percent: null,
      icon: inverse ? ArrowUpRight : Sparkles,
      color: inverse ? 'text-rose-300' : 'text-cyan-300',
    };
  }
  const percent = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);
  if (percent > 0) {
    return {
      percent,
      icon: ArrowUpRight,
      color: inverse ? 'text-rose-300' : 'text-emerald-300',
    };
  }
  if (percent < 0) {
    return {
      percent,
      icon: ArrowDownRight,
      color: inverse ? 'text-emerald-300' : 'text-rose-300',
    };
  }
  return { percent, icon: Minus, color: 'text-slate-400' };
}

function rate(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
