import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsCsv } from '../export/analyticsCsv.ts';

test('analytics CSV keeps the human-click basis and currency-separated conversion value', () => {
  const csv = analyticsCsv({
    days: 30,
    timezoneOffsetMinutes: 480,
    rangeStart: '2026-06-22T16:00:00.000Z',
    rangeEnd: '2026-07-22T16:00:00.000Z',
    totalClicks: 84,
    botClicks: 4,
    uniqueVisitors: 27,
    uniqueLinks: 5,
    eligibleClicks: 80,
    conversionsTotal: 4,
    conversionRate: 5,
    conversionAttributionAvailable: true,
    daily: [],
    previousPeriod: {
      rangeStart: '2026-05-23T16:00:00.000Z',
      rangeEnd: '2026-06-22T16:00:00.000Z',
      totalClicks: 64,
      humanClicks: 62,
      botClicks: 2,
      uniqueVisitors: 23,
      daily: [{ date: '2026-06-21', clicks: 2, humanClicks: 2, botClicks: 0, uniqueVisitors: 2 }],
    },
    hourlyHeatmap: [{ weekday: 1, hour: 9, clicks: 3, humanClicks: 2, botClicks: 1 }],
    topLinks: [],
    topCountries: [],
    geography: { countries: [{ country: 'US', clicks: 50 }], mappedClicks: 80, unknownClicks: 4 },
    topReferrers: [],
    topBrowsers: [],
    topDevices: [],
    topOperatingSystems: [],
    topUtmSources: [],
    topUtmMediums: [],
    topUtmCampaigns: [],
    topUtmTerms: [],
    topUtmContents: [],
    topTargets: [],
    topConversionEvents: [
      { event_name: 'signup', currency: 'USD', conversions: 4, value_total: 54 },
    ],
    conversionValues: [{ currency: 'USD', conversions: 4, value_total: 54 }],
    recentVisits: [],
  });

  assert.match(csv, /summary,eligible_human_clicks,80,/);
  assert.match(csv, /summary,timezone_offset_minutes,480,/);
  assert.match(csv, /country_distribution,US,50,clicks/);
  assert.match(csv, /previous_period,total_clicks,64,/);
  assert.match(csv, /previous_daily_total,2026-06-21,2,clicks/);
  assert.match(csv, /activity_heatmap,1:09,3,human=2;bot=1/);
  assert.match(csv, /conversion_events,signup,4,USD:54/);
  assert.match(csv, /conversion_values,USD,54,4 events/);
});
