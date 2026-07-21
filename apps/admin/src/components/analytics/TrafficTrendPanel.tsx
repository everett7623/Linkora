import { useMemo, useState, type ReactNode } from 'react';
import { AreaChart as AreaChartIcon, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import type { AnalyticsSummary } from '../../api/analytics';
import { useLocale } from '../../contexts/LocaleContext';
import { TrafficTrendChart, type TrendMode } from './TrafficTrendChart';

export function TrafficTrendPanel({ summary }: { summary: AnalyticsSummary | null }) {
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<TrendMode>('line');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const items = summary?.daily ?? [];
  const previousItems = summary?.previousPeriod?.daily ?? [];
  const selected =
    items[Math.min(selectedIndex < 0 ? items.length - 1 : selectedIndex, items.length - 1)];
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }),
    [locale]
  );

  return (
    <section
      className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5"
      data-testid="traffic-trend-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{t('trafficTrend')}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {t('trafficTrendTimezone', {
              offset: formatOffset(summary?.timezoneOffsetMinutes ?? 0),
            })}
          </p>
          <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-block w-5 border-t border-dashed border-slate-400" />
            {t('previousSeries')}
          </p>
        </div>
        <div
          className="flex h-9 items-center rounded-lg border border-slate-700 bg-slate-950 p-1"
          role="group"
          aria-label={t('chartType')}
        >
          <ModeButton
            active={mode === 'line'}
            label={t('lineChart')}
            onClick={() => setMode('line')}
            icon={<LineChartIcon size={15} />}
          />
          <ModeButton
            active={mode === 'area'}
            label={t('areaChart')}
            onClick={() => setMode('area')}
            icon={<AreaChartIcon size={15} />}
          />
          <ModeButton
            active={mode === 'bar'}
            label={t('stackedBars')}
            onClick={() => setMode('bar')}
            icon={<BarChart3 size={15} />}
          />
        </div>
      </div>

      <div className="mt-4 min-h-12 border-y border-slate-800 py-2 text-xs text-slate-400">
        {selected ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <strong className="text-slate-200">
              {dateFormatter.format(new Date(`${selected.date}T00:00:00Z`))}
            </strong>
            <SeriesValue
              color="bg-blue-400"
              label={t('totalSeries')}
              value={selected.clicks}
              locale={locale}
            />
            <SeriesValue
              color="bg-emerald-400"
              label={t('humanSeries')}
              value={selected.humanClicks}
              locale={locale}
            />
            <SeriesValue
              color="bg-cyan-400"
              label={t('uniqueSeries')}
              value={selected.uniqueVisitors}
              locale={locale}
            />
            <SeriesValue
              color="bg-amber-400"
              label={t('botSeries')}
              value={selected.botClicks}
              locale={locale}
            />
          </div>
        ) : (
          <span>{t('noVisitsRange')}</span>
        )}
      </div>

      <TrafficTrendChart
        items={items}
        previousItems={previousItems}
        mode={mode}
        selectedIndex={selectedIndex}
        locale={locale}
        label={t('trafficTrend')}
        formatter={dateFormatter}
        onSelectIndex={setSelectedIndex}
      />
    </section>
  );
}

function ModeButton({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-7 w-8 items-center justify-center rounded-md transition-colors ${active ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-200'}`}
    >
      {icon}
    </button>
  );
}

function SeriesValue({
  color,
  label,
  value,
  locale,
}: {
  color: string;
  label: string;
  value: number;
  locale: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-sm ${color}`} />
      {label} <b className="font-semibold text-slate-200">{value.toLocaleString(locale)}</b>
    </span>
  );
}

function formatOffset(offset: number) {
  const sign = offset >= 0 ? '+' : '-';
  const absolute = Math.abs(offset);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
}
