import { useMemo, type PointerEvent } from 'react';
import {
  CHART_HEIGHT,
  CHART_PLOT,
  CHART_WIDTH,
  chartPoints,
  plotHeight,
  plotWidth,
  pointX,
  type TrendPoint,
} from './trafficTrendGeometry';
import { TrafficTrendSeries, type TrendMode } from './TrafficTrendSeries';

export type { TrendMode } from './TrafficTrendSeries';

interface TrafficTrendChartProps {
  items: TrendPoint[];
  previousItems: TrendPoint[];
  mode: TrendMode;
  selectedIndex: number;
  locale: string;
  label: string;
  formatter: Intl.DateTimeFormat;
  onSelectIndex: (index: number) => void;
}

export function TrafficTrendChart({
  items,
  previousItems,
  mode,
  selectedIndex,
  locale,
  label,
  formatter,
  onSelectIndex,
}: TrafficTrendChartProps) {
  const max = Math.max(
    ...items.map((item) => item.clicks),
    ...previousItems.map((item) => item.clicks),
    1
  );
  const points = useMemo(() => chartPoints(items, max), [items, max]);
  const previousPoints = useMemo(() => chartPoints(previousItems, max), [previousItems, max]);

  const selectAtPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (items.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const plotX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH - CHART_PLOT.left;
    const ratio = Math.max(0, Math.min(1, plotX / plotWidth()));
    onSelectIndex(Math.round(ratio * (items.length - 1)));
  };

  return (
    <div className="mt-3 aspect-[16/5] min-h-52 w-full">
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={label}
        onPointerMove={selectAtPointer}
        onPointerLeave={() => onSelectIndex(-1)}
      >
        <ChartGrid max={max} locale={locale} />
        {items.length > 0 && (
          <TrafficTrendSeries
            mode={mode}
            points={points}
            previousPoints={previousPoints}
            selectedIndex={selectedIndex < 0 ? items.length - 1 : selectedIndex}
          />
        )}
        <DateTicks items={items} formatter={formatter} />
      </svg>
    </div>
  );
}

function ChartGrid({ max, locale }: { max: number; locale: string }) {
  return (
    <>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = CHART_PLOT.top + (1 - ratio) * plotHeight();
        return (
          <g key={ratio}>
            <line
              x1={CHART_PLOT.left}
              x2={CHART_WIDTH - CHART_PLOT.right}
              y1={y}
              y2={y}
              stroke="rgb(51 65 85)"
              strokeWidth="1"
            />
            <text
              x={CHART_PLOT.left - 8}
              y={y + 4}
              textAnchor="end"
              fill="rgb(100 116 139)"
              fontSize="10"
            >
              {Math.round(max * ratio).toLocaleString(locale)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function DateTicks({ items, formatter }: { items: TrendPoint[]; formatter: Intl.DateTimeFormat }) {
  if (items.length === 0) return null;
  const indexes = [...new Set([0, Math.floor((items.length - 1) / 2), items.length - 1])];
  return (
    <>
      {indexes.map((index) => (
        <text
          key={items[index].date}
          x={pointX(index, items.length)}
          y={CHART_HEIGHT - 8}
          textAnchor={index === 0 ? 'start' : index === items.length - 1 ? 'end' : 'middle'}
          fill="rgb(100 116 139)"
          fontSize="10"
        >
          {formatter.format(new Date(`${items[index].date}T00:00:00Z`))}
        </text>
      ))}
    </>
  );
}
