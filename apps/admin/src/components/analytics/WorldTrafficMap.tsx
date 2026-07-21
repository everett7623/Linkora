import React, { useMemo, useState } from 'react';
import type { AnalyticsSummary } from '../../api/analytics';
import { WORLD_MAP_REGIONS, WORLD_MAP_VIEW_BOX } from '../../assets/worldMapRegions';
import { useLocale } from '../../contexts/LocaleContext';
import { worldTrafficColor } from '../../utils/analyticsPalette';

export function WorldTrafficMap({ summary }: { summary: AnalyticsSummary | null }) {
  const { locale, t } = useLocale();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const countries =
    summary?.geography?.countries ??
    summary?.topCountries?.filter((item) => item.country.length === 2) ??
    [];
  const clicksByCountry = useMemo(
    () => new Map(countries.map((item) => [item.country.toUpperCase(), item.clicks])),
    [countries]
  );
  const displayNames = useMemo(() => new Intl.DisplayNames([locale], { type: 'region' }), [locale]);
  const topCountries = countries.slice(0, 8);
  const max = Math.max(...countries.map((item) => item.clicks), 1);
  const legacyUnknown =
    summary?.topCountries?.find((item) => item.country === 'Unknown')?.clicks ?? 0;
  const unknownClicks = summary?.geography?.unknownClicks ?? legacyUnknown;
  const selected =
    selectedCode && clicksByCountry.has(selectedCode)
      ? selectedCode
      : (topCountries[0]?.country.toUpperCase() ?? null);

  const countryName = (code: string) => {
    try {
      return displayNames.of(code) ?? code;
    } catch {
      return code;
    }
  };
  const selectCountry = (code: string) => {
    if (clicksByCountry.has(code)) setSelectedCode(code);
  };

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
      data-testid="world-traffic-map"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{t('geographyTitle')}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('geographySubtitle')}</p>
        </div>
        {selected && (
          <div className="text-right">
            <div className="text-xs text-slate-500">{countryName(selected)}</div>
            <div className="text-lg font-semibold text-slate-100">
              {(clicksByCountry.get(selected) ?? 0).toLocaleString(locale)}
              <span className="ml-1 text-xs font-normal text-slate-500">{t('clicksValue')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <div className="min-w-0 px-3 py-5 sm:px-5">
          <div className="aspect-[3/1] min-h-56 w-full">
            <svg
              className="h-full w-full"
              viewBox={WORLD_MAP_VIEW_BOX}
              role="group"
              aria-label={t('geographyTitle')}
            >
              <title>{t('geographyTitle')}</title>
              {WORLD_MAP_REGIONS.map((region) => {
                const clicks = clicksByCountry.get(region.code) ?? 0;
                const active = selected === region.code;
                const label = `${countryName(region.code)}: ${clicks.toLocaleString(locale)} ${t('clicksValue')}`;
                return (
                  <path
                    key={region.code}
                    d={region.path}
                    fill={worldTrafficColor(clicks, max)}
                    stroke={active ? 'rgb(226 232 240)' : 'rgb(51 65 85)'}
                    strokeWidth={active ? 1.5 : 0.7}
                    vectorEffect="non-scaling-stroke"
                    className={
                      clicks > 0
                        ? 'cursor-pointer outline-none transition-opacity hover:opacity-80 focus:opacity-80'
                        : ''
                    }
                    tabIndex={clicks > 0 ? 0 : undefined}
                    role={clicks > 0 ? 'button' : undefined}
                    aria-label={clicks > 0 ? label : undefined}
                    onMouseEnter={() => selectCountry(region.code)}
                    onFocus={() => selectCountry(region.code)}
                    onClick={() => selectCountry(region.code)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectCountry(region.code);
                      }
                    }}
                  >
                    <title>{label}</title>
                  </path>
                );
              })}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
            <div className="flex items-center gap-3" role="img" aria-label={t('trafficIntensity')}>
              {Array.from({ length: 10 }, (_, index) => (index + 1) / 10).map((ratio) => (
                <span
                  key={ratio}
                  data-testid="traffic-intensity-swatch"
                  className="h-2.5 w-6 rounded-sm"
                  style={{ backgroundColor: worldTrafficColor(max * ratio, max) }}
                />
              ))}
            </div>
            <span>
              {t('unmappedVisits')}: {unknownClicks.toLocaleString(locale)}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-800 p-5 lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase text-slate-400">{t('topRegions')}</h3>
            <span className="text-xs text-slate-600">
              {countries.length.toLocaleString(locale)}
            </span>
          </div>
          <div className="space-y-3">
            {topCountries.length === 0 ? (
              <p className="text-sm text-slate-500">{t('noData')}</p>
            ) : (
              topCountries.map((item) => {
                const code = item.country.toUpperCase();
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => selectCountry(code)}
                    className={`block w-full rounded-md px-2 py-1.5 text-left transition-colors ${selected === code ? 'bg-slate-800' : 'hover:bg-slate-800/60'}`}
                  >
                    <span className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-slate-300">{countryName(code)}</span>
                      <span className="shrink-0 text-slate-500">
                        {item.clicks.toLocaleString(locale)}
                      </span>
                    </span>
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-slate-800">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.max(4, (item.clicks / max) * 100)}%`,
                          backgroundColor: worldTrafficColor(item.clicks, max),
                        }}
                      />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
