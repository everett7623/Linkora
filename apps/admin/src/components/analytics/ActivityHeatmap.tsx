import { useMemo } from 'react';
import type { AnalyticsSummary } from '../../api/analytics';
import { useLocale } from '../../contexts/LocaleContext';

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function ActivityHeatmap({ summary }: { summary: AnalyticsSummary | null }) {
  const { locale, t } = useLocale();
  const points = summary?.hourlyHeatmap ?? [];
  const max = Math.max(...points.map((point) => point.clicks), 0);
  const peak = points.reduce<(typeof points)[number] | null>(
    (best, point) => (!best || point.clicks > best.clicks ? point : best),
    null
  );
  const weekdays = useMemo(() => weekdayLabels(locale), [locale]);
  const hours = useMemo(() => hourLabels(locale), [locale]);
  const byBucket = new Map(points.map((point) => [`${point.weekday}:${point.hour}`, point]));

  return (
    <section
      className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5"
      data-testid="activity-heatmap"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{t('activityHeatmap')}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('activityHeatmapSubtitle')}</p>
        </div>
        {peak && peak.clicks > 0 && (
          <p className="text-xs text-slate-400">
            {t('peakActivity', {
              day: weekdays[peak.weekday],
              hour: hours[peak.hour],
              count: peak.clicks.toLocaleString(locale),
            })}
          </p>
        )}
      </div>
      {points.length === 0 ? (
        <p className="mt-5 border-t border-slate-800 py-6 text-sm text-slate-500">
          {t('noVisitsRange')}
        </p>
      ) : (
        <>
          <div
            className="mt-5 overflow-x-auto pb-1"
            tabIndex={0}
            role="region"
            aria-label={t('activityHeatmap')}
          >
            <HeatmapGrid
              byBucket={byBucket}
              weekdays={weekdays}
              hours={hours}
              max={max}
              locale={locale}
            />
          </div>
          <HeatmapLegend />
        </>
      )}
    </section>
  );
}

function HeatmapGrid({
  byBucket,
  weekdays,
  hours,
  max,
  locale,
}: {
  byBucket: Map<string, AnalyticsSummary['hourlyHeatmap'][number]>;
  weekdays: string[];
  hours: string[];
  max: number;
  locale: string;
}) {
  const { t } = useLocale();
  return (
    <div className="grid min-w-[760px] grid-cols-[40px_repeat(24,minmax(20px,1fr))] gap-1">
      <span />
      {Array.from({ length: 24 }, (_, hour) => (
        <span key={hour} className="text-center text-[9px] text-slate-600">
          {hour % 3 === 0 ? String(hour).padStart(2, '0') : ''}
        </span>
      ))}
      {WEEKDAY_ORDER.flatMap((weekday) => [
        <span key={`label-${weekday}`} className="flex h-6 items-center text-[10px] text-slate-500">
          {weekdays[weekday]}
        </span>,
        ...Array.from({ length: 24 }, (_, hour) => {
          const point = byBucket.get(`${weekday}:${hour}`) ?? emptyPoint(weekday, hour);
          const label = t('visitsAtTime', {
            day: weekdays[weekday],
            hour: hours[hour],
            count: point.clicks.toLocaleString(locale),
            human: point.humanClicks.toLocaleString(locale),
            bots: point.botClicks.toLocaleString(locale),
          });
          return (
            <span
              key={`${weekday}-${hour}`}
              role="img"
              aria-label={label}
              title={label}
              className="h-6 rounded-sm border border-slate-800"
              style={{ backgroundColor: heatColor(point.clicks, max) }}
            />
          );
        }),
      ])}
    </div>
  );
}

function HeatmapLegend() {
  const { t } = useLocale();
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-500">
      <span>{t('lessTraffic')}</span>
      {[0.08, 0.24, 0.45, 0.7, 1].map((intensity) => (
        <span
          key={intensity}
          className="h-3 w-5 rounded-sm border border-slate-800"
          style={{ backgroundColor: `rgba(45, 212, 191, ${intensity})` }}
        />
      ))}
      <span>{t('moreTraffic')}</span>
    </div>
  );
}

function weekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, weekday) =>
    formatter.format(new Date(Date.UTC(2026, 6, 19 + weekday)))
  );
}

function hourLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' });
  return Array.from({ length: 24 }, (_, hour) =>
    formatter.format(new Date(Date.UTC(2026, 0, 1, hour)))
  );
}

function heatColor(value: number, max: number): string {
  if (value === 0 || max === 0) return 'rgb(15 23 42)';
  return `rgba(45, 212, 191, ${0.16 + (value / max) * 0.84})`;
}

function emptyPoint(weekday: number, hour: number) {
  return { weekday, hour, clicks: 0, humanClicks: 0, botClicks: 0 };
}
