import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname } from 'node:path';
import { registerHooks } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !extname(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { createAnalyticsRange } = await import('../analytics/timeRange.ts');
const { getAnalyticsSummary } = await import('./analytics.ts');
const { getOverviewStats } = await import('./index.ts');

test('overview and analytics share the browser-local today boundary', async () => {
  const database = new DatabaseSync(':memory:');
  applyMigrations(database);
  const env = { DB: d1(database) };
  const today = createAnalyticsRange(1, 480);
  const currentVisit = new Date(Date.parse(today.start) + 60_000).toISOString();
  const previousVisit = new Date(Date.parse(today.start) - 60_000).toISOString();
  const comparisonVisit = new Date(
    Date.parse(today.start) - 24 * 60 * 60 * 1000 - 60_000
  ).toISOString();

  database
    .prepare(
      `INSERT INTO links (id, slug, long_url, title, status, redirect_type, clicks, created_at, updated_at, archived)
     VALUES ('link-1', 'demo', 'https://example.com', 'Demo', 'active', 302, 2, ?, ?, 0)`
    )
    .run(previousVisit, currentVisit);
  const insertVisit = database.prepare(
    `INSERT INTO visits (id, link_id, slug, country, browser, os, device_type, ip_hash, is_bot, created_at)
     VALUES (?, 'link-1', 'demo', ?, 'Chrome', 'Windows', 'desktop', ?, ?, ?)`
  );
  insertVisit.run('visit-current', 'US', 'visitor-1', 0, currentVisit);
  insertVisit.run('visit-previous', 'XX', 'visitor-2', 1, previousVisit);
  insertVisit.run('visit-comparison', 'US', 'visitor-3', 0, comparisonVisit);

  const overview = await getOverviewStats(env, 480);
  const summary = await getAnalyticsSummary(env, { days: 2, timezoneOffsetMinutes: 480 });

  assert.equal(overview.todayClicks, 1);
  assert.equal(summary.timezoneOffsetMinutes, 480);
  assert.equal(summary.daily.length, 2);
  assert.deepEqual(summary.daily[1], {
    date: today.dates[0],
    clicks: 1,
    humanClicks: 1,
    botClicks: 0,
    uniqueVisitors: 1,
  });
  assert.equal(summary.totalClicks, 2);
  assert.equal(summary.previousPeriod.totalClicks, 1);
  assert.equal(summary.previousPeriod.humanClicks, 1);
  assert.equal(summary.previousPeriod.daily.length, 2);
  assert.equal(
    summary.previousPeriod.daily.reduce((total, item) => total + item.clicks, 0),
    1
  );
  assert.equal(summary.hourlyHeatmap.length, 168);
  assert.equal(
    summary.hourlyHeatmap.reduce((total, item) => total + item.clicks, 0),
    2
  );
  assert.equal(
    summary.hourlyHeatmap.find((item) => item.weekday === 2 && item.hour === 0)?.clicks,
    1
  );
  assert.equal(
    summary.hourlyHeatmap.find((item) => item.weekday === 1 && item.hour === 23)?.clicks,
    1
  );
  assert.deepEqual(summary.geography, {
    countries: [{ country: 'US', clicks: 1 }],
    mappedClicks: 1,
    unknownClicks: 1,
  });

  const filtered = await getAnalyticsSummary(env, {
    days: 2,
    timezoneOffsetMinutes: 480,
    country: 'US',
  });
  assert.equal(filtered.totalClicks, 1);
  assert.equal(filtered.previousPeriod.totalClicks, 1);
  assert.equal(
    filtered.hourlyHeatmap.reduce((total, item) => total + item.clicks, 0),
    1
  );
  database.close();
});

function applyMigrations(database) {
  const migrationsUrl = new URL('../../../../migrations/', import.meta.url);
  for (const name of readdirSync(migrationsUrl)
    .filter((item) => item.endsWith('.sql'))
    .sort()) {
    database.exec(readFileSync(new URL(name, migrationsUrl), 'utf8'));
  }
}

function d1(database) {
  return {
    prepare(sql) {
      let params = [];
      const statement = {
        bind(...values) {
          params = values;
          return statement;
        },
        async first() {
          return database.prepare(sql).get(...params) ?? null;
        },
        async all() {
          return { results: database.prepare(sql).all(...params) };
        },
      };
      return statement;
    },
  };
}
