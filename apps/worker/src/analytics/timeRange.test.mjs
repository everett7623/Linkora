import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAnalyticsRange,
  createPreviousAnalyticsRange,
  fillDailyAnalytics,
  localDateSql,
  localHourSql,
  localWeekdaySql,
  parseTimezoneOffset,
} from './timeRange.ts';

test('analytics range uses an explicit browser-local day boundary', () => {
  const now = new Date('2026-07-21T00:30:00.000Z');
  const asia = createAnalyticsRange(1, 480, now);
  const america = createAnalyticsRange(1, -420, now);

  assert.equal(asia.start, '2026-07-20T16:00:00.000Z');
  assert.equal(asia.end, '2026-07-21T16:00:00.000Z');
  assert.deepEqual(asia.dates, ['2026-07-21']);
  assert.equal(america.start, '2026-07-20T07:00:00.000Z');
  assert.deepEqual(america.dates, ['2026-07-20']);
});

test('previous analytics range is equal-length and immediately adjacent', () => {
  const current = createAnalyticsRange(3, 480, new Date('2026-07-21T04:00:00.000Z'));
  const previous = createPreviousAnalyticsRange(current);

  assert.equal(previous.end, current.start);
  assert.equal(Date.parse(previous.end) - Date.parse(previous.start), 3 * 24 * 60 * 60 * 1000);
  assert.deepEqual(previous.dates, ['2026-07-16', '2026-07-17', '2026-07-18']);
});

test('analytics range rejects invalid offsets and builds safe SQL modifiers', () => {
  assert.equal(parseTimezoneOffset('480'), 480);
  assert.equal(parseTimezoneOffset('840'), 840);
  assert.equal(parseTimezoneOffset('841'), 0);
  assert.equal(parseTimezoneOffset('1.5'), 0);
  assert.equal(parseTimezoneOffset('x'), 0);
  assert.equal(localDateSql('v.created_at', -420), "date(v.created_at, '-420 minutes')");
  assert.equal(
    localHourSql('v.created_at', 480),
    "CAST(strftime('%H', v.created_at, '+480 minutes') AS INTEGER)"
  );
  assert.equal(localWeekdaySql('v.created_at', 0), "CAST(strftime('%w', v.created_at) AS INTEGER)");
  assert.equal(createAnalyticsRange(Number.NaN, 0).days, 30);
});

test('daily analytics fills missing local dates with explicit zeroes', () => {
  const range = createAnalyticsRange(3, 480, new Date('2026-07-21T04:00:00.000Z'));
  const daily = fillDailyAnalytics(
    [{ date: '2026-07-20', clicks: 4, humanClicks: 3, botClicks: 1, uniqueVisitors: 2 }],
    range
  );

  assert.deepEqual(daily, [
    { date: '2026-07-19', clicks: 0, humanClicks: 0, botClicks: 0, uniqueVisitors: 0 },
    { date: '2026-07-20', clicks: 4, humanClicks: 3, botClicks: 1, uniqueVisitors: 2 },
    { date: '2026-07-21', clicks: 0, humanClicks: 0, botClicks: 0, uniqueVisitors: 0 },
  ]);
});
