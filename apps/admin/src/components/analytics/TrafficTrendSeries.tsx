import {
  CHART_PLOT,
  areaPath,
  plotHeight,
  plotWidth,
  smoothPath,
  type ChartPoint,
} from './trafficTrendGeometry';

export type TrendMode = 'line' | 'area' | 'bar';

export function TrafficTrendSeries({
  mode,
  points,
  previousPoints,
  selectedIndex,
}: {
  mode: TrendMode;
  points: ChartPoint[];
  previousPoints: ChartPoint[];
  selectedIndex: number;
}) {
  const barWidth = Math.max(1, Math.min(18, plotWidth() / Math.max(points.length, 1) - 2));
  const selected = points[Math.min(selectedIndex, points.length - 1)];
  return (
    <g>
      {previousPoints.length > 0 && (
        <path
          d={smoothPath(previousPoints, 'clicksY')}
          fill="none"
          stroke="rgb(148 163 184)"
          strokeWidth="2"
          strokeDasharray="7 6"
          opacity="0.7"
        />
      )}
      {mode === 'area' && <path d={areaPath(points)} fill="rgb(59 130 246)" fillOpacity="0.16" />}
      {mode === 'bar' &&
        points.map((point) => (
          <g key={point.date}>
            <rect
              x={point.x - barWidth / 2}
              y={point.humanY}
              width={barWidth}
              height={CHART_PLOT.top + plotHeight() - point.humanY}
              fill="rgb(52 211 153)"
              opacity="0.8"
            />
            <rect
              x={point.x - barWidth / 2}
              y={point.clicksY}
              width={barWidth}
              height={Math.max(0, point.humanY - point.clicksY)}
              fill="rgb(251 191 36)"
              opacity="0.9"
            />
          </g>
        ))}
      {mode !== 'bar' && (
        <>
          <path
            d={smoothPath(points, 'clicksY')}
            fill="none"
            stroke="rgb(96 165 250)"
            strokeWidth="3"
          />
          <path
            d={smoothPath(points, 'humanY')}
            fill="none"
            stroke="rgb(52 211 153)"
            strokeWidth="2"
          />
          <path
            d={smoothPath(points, 'botY')}
            fill="none"
            stroke="rgb(251 191 36)"
            strokeWidth="2"
          />
        </>
      )}
      <path
        d={smoothPath(points, 'uniqueY')}
        fill="none"
        stroke="rgb(34 211 238)"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
      {selected && (
        <>
          <line
            x1={selected.x}
            x2={selected.x}
            y1={CHART_PLOT.top}
            y2={CHART_PLOT.top + plotHeight()}
            stroke="rgb(148 163 184)"
            strokeDasharray="3 4"
          />
          <circle
            cx={selected.x}
            cy={selected.clicksY}
            r="4"
            fill="rgb(96 165 250)"
            stroke="rgb(15 23 42)"
            strokeWidth="2"
          />
        </>
      )}
    </g>
  );
}
