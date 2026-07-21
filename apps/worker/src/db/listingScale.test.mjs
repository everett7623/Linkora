import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { DatabaseSync } from 'node:sqlite';
import test, { after } from 'node:test';
import {
  AUDIT_ORDER_BY,
  MAX_LIST_PAGE,
  MAX_LIST_PAGE_SIZE,
  linkOrderBy,
  normalizeBoundedPositiveInteger,
  normalizeListPage,
  normalizeListPageSize,
} from './listingPolicy.ts';
import { MAX_HEALTH_HISTORY_ITEMS, parseHealthHistory } from '../health/history.ts';

const PROFILE = {
  links: 20_000,
  visits: 100_000,
  auditLogs: 20_000,
  rawHealthHistory: 10_000,
};

const BUDGET_MS = {
  linksPage: 750,
  auditPage: 750,
  analytics: 5_000,
  healthHistory: 250,
};

const database = new DatabaseSync(':memory:');
const migrationsUrl = new URL('../../../../migrations/', import.meta.url);
for (const migration of readdirSync(migrationsUrl)
  .filter((name) => name.endsWith('.sql'))
  .sort()) {
  database.exec(readFileSync(new URL(migration, migrationsUrl), 'utf8'));
}

seedScaleProfile(database);
after(() => database.close());

test('listing policy bounds malformed pagination and stabilizes every sort', () => {
  assert.equal(normalizeListPage(undefined), 1);
  assert.equal(normalizeListPage('2'), 2);
  assert.equal(normalizeListPage('2x'), 1);
  assert.equal(normalizeListPage('-1'), 1);
  assert.equal(normalizeListPage('1.5'), 1);
  assert.equal(normalizeListPage('Infinity'), 1);
  assert.equal(normalizeListPage(String(MAX_LIST_PAGE + 1)), MAX_LIST_PAGE);
  assert.equal(normalizeListPageSize('0', 20), 20);
  assert.equal(normalizeListPageSize('25', 20), 25);
  assert.equal(normalizeListPageSize('101', 20), MAX_LIST_PAGE_SIZE);
  assert.equal(normalizeBoundedPositiveInteger('21', 5, 20), 20);
  assert.match(linkOrderBy('clicks_desc'), /^clicks DESC, id DESC$/);
  assert.match(linkOrderBy('last_clicked_at_asc'), /id ASC$/);
  assert.equal(linkOrderBy('unknown'), 'created_at DESC, id DESC');
  assert.equal(AUDIT_ORDER_BY, 'created_at DESC, id DESC');
});

test('20k Links and Audit rows remain bounded, deterministic, and within budget', async () => {
  const firstLinks = await withinBudget('Links first page', BUDGET_MS.linksPage, () =>
    listLinksPage(database, { page: 1, pageSize: 100, sort: 'created_at_desc' })
  );
  const secondLinks = await withinBudget('Links second page', BUDGET_MS.linksPage, () =>
    listLinksPage(database, { page: 2, pageSize: 100, sort: 'created_at_desc' })
  );
  assert.equal(firstLinks.total, PROFILE.links);
  assert.equal(firstLinks.items.length, 100);
  assert.equal(secondLinks.items.length, 100);
  assert.equal(firstLinks.items[0].id, 'link-19999');
  assert.equal(secondLinks.items[0].id, 'link-19899');
  assert.equal(
    new Set([...firstLinks.items, ...secondLinks.items].map((item) => item.id)).size,
    200
  );

  const audit = await withinBudget('Audit first page', BUDGET_MS.auditPage, () =>
    listAuditPage(database, { page: 1, pageSize: 100 })
  );
  assert.equal(audit.total, PROFILE.auditLogs);
  assert.equal(audit.items.length, 100);
  assert.equal(audit.items[0].id, 'audit-19999');
});

test('100k Visits analytics and oversized health history remain bounded and within budget', async () => {
  const analytics = await withinBudget('Analytics summary', BUDGET_MS.analytics, () =>
    analyticsSummaryQueries(database)
  );
  assert.equal(analytics.totalClicks, PROFILE.visits);
  assert.equal(analytics.botClicks, PROFILE.visits / 10);
  assert.equal(analytics.recentVisits.length, 20);
  assert.ok(analytics.daily.length <= 30);
  assert.ok(analytics.topLinks.length <= 10);
  assert.ok(analytics.topCountries.length <= 10);
  assert.ok(analytics.countryDistribution.length <= 250);
  assert.ok(analytics.previousDaily.length <= 30);
  assert.ok(analytics.hourlyHeatmap.length <= 168);

  const rawHistory = Array.from({ length: PROFILE.rawHealthHistory }, (_, index) => ({
    link_id: `link-${String(index % PROFILE.links).padStart(5, '0')}`,
    status: 'healthy',
    http_status: 200,
    checked_at: new Date().toISOString(),
    response_time_ms: index % 500,
    consecutive_failures: 0,
  }));
  const history = await withinBudget('Health history parse', BUDGET_MS.healthHistory, () =>
    parseHealthHistory(JSON.stringify(rawHistory))
  );
  assert.equal(history.length, MAX_HEALTH_HISTORY_ITEMS);
});

async function withinBudget(label, budgetMs, operation) {
  const startedAt = performance.now();
  const result = await operation();
  const elapsedMs = performance.now() - startedAt;
  assert.ok(
    elapsedMs <= budgetMs,
    `${label} took ${elapsedMs.toFixed(1)} ms; budget is ${budgetMs} ms`
  );
  return result;
}

function listLinksPage(db, { page, pageSize, sort }) {
  const total = Number(
    db.prepare('SELECT COUNT(*) AS count FROM links WHERE archived = 0').get().count
  );
  const items = db
    .prepare(
      `SELECT * FROM links WHERE archived = 0 ORDER BY ${linkOrderBy(sort)} LIMIT ? OFFSET ?`
    )
    .all(pageSize, (page - 1) * pageSize);
  return { items, total };
}

function listAuditPage(db, { page, pageSize }) {
  const total = Number(db.prepare('SELECT COUNT(*) AS count FROM audit_logs').get().count);
  const items = db
    .prepare(`SELECT * FROM audit_logs ORDER BY ${AUDIT_ORDER_BY} LIMIT ? OFFSET ?`)
    .all(pageSize, (page - 1) * pageSize);
  return { items, total };
}

function analyticsSummaryQueries(db) {
  const totalClicks = Number(db.prepare('SELECT COUNT(*) AS count FROM visits').get().count);
  const botClicks = Number(
    db.prepare('SELECT COUNT(*) AS count FROM visits WHERE is_bot = 1').get().count
  );
  const uniqueVisitors = Number(
    db
      .prepare(
        `SELECT COUNT(DISTINCT ip_hash) AS count
         FROM visits WHERE ip_hash IS NOT NULL AND ip_hash != ''`
      )
      .get().count
  );
  const daily = db
    .prepare(
      `SELECT substr(created_at, 1, 10) AS date,
         COUNT(*) AS clicks,
         SUM(CASE WHEN COALESCE(is_bot, 0) = 0 THEN 1 ELSE 0 END) AS human_clicks,
         SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) AS bot_clicks,
         COUNT(DISTINCT CASE WHEN ip_hash IS NOT NULL AND ip_hash != '' THEN ip_hash END) AS unique_visitors
       FROM visits GROUP BY substr(created_at, 1, 10) ORDER BY date ASC`
    )
    .all();
  const topLinks = db
    .prepare(
      `SELECT COALESCE(v.link_id, l.id) AS id, v.slug, COALESCE(v.domain, l.domain) AS domain,
         l.title, COUNT(*) AS clicks
       FROM visits v LEFT JOIN links l ON (
         l.id = v.link_id OR (
           v.link_id IS NULL AND l.slug = v.slug
           AND COALESCE(l.domain, '') = COALESCE(v.domain, '')
         )
       )
       GROUP BY COALESCE(v.link_id, l.id), v.slug, COALESCE(v.domain, l.domain), l.title
       ORDER BY clicks DESC LIMIT 10`
    )
    .all();
  const topCountries = db
    .prepare(
      `SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS clicks
       FROM visits GROUP BY COALESCE(country, 'Unknown') ORDER BY clicks DESC LIMIT 10`
    )
    .all();
  const countryDistribution = db
    .prepare(
      `SELECT UPPER(TRIM(COALESCE(country, ''))) AS country, COUNT(*) AS clicks
       FROM visits GROUP BY UPPER(TRIM(COALESCE(country, '')))
       ORDER BY clicks DESC LIMIT 250`
    )
    .all();
  const recentVisits = db.prepare('SELECT * FROM visits ORDER BY created_at DESC LIMIT 20').all();
  const previousTotals = db
    .prepare(
      `SELECT COUNT(*) AS total_clicks,
         SUM(CASE WHEN COALESCE(is_bot, 0) = 0 THEN 1 ELSE 0 END) AS human_clicks,
         SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) AS bot_clicks,
         COUNT(DISTINCT CASE WHEN ip_hash IS NOT NULL AND ip_hash != '' THEN ip_hash END) AS unique_visitors
       FROM visits WHERE created_at < datetime('now', '-30 days')`
    )
    .get();
  const previousDaily = db
    .prepare(
      `SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS clicks
       FROM visits WHERE created_at < datetime('now', '-30 days')
       GROUP BY substr(created_at, 1, 10) ORDER BY date ASC LIMIT 30`
    )
    .all();
  const hourlyHeatmap = db
    .prepare(
      `SELECT CAST(strftime('%w', created_at) AS INTEGER) AS weekday,
         CAST(strftime('%H', created_at) AS INTEGER) AS hour, COUNT(*) AS clicks
       FROM visits GROUP BY weekday, hour ORDER BY weekday, hour`
    )
    .all();
  return {
    totalClicks,
    botClicks,
    uniqueVisitors,
    daily,
    topLinks,
    topCountries,
    countryDistribution,
    recentVisits,
    previousTotals,
    previousDaily,
    hourlyHeatmap,
  };
}

function seedScaleProfile(db) {
  const createdAt = new Date().toISOString();
  const insertLink = db.prepare(
    `INSERT INTO links (
      id, slug, domain, long_url, title, status, redirect_type, clicks,
      created_at, updated_at, archived
    ) VALUES (?, ?, ?, ?, ?, 'active', 302, ?, ?, ?, 0)`
  );
  const insertVisit = db.prepare(
    `INSERT INTO visits (
      id, link_id, slug, domain, referer, country, browser, os, device_type,
      ip_hash, is_bot, created_at
    ) VALUES (?, ?, ?, 'scale.example', ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertAudit = db.prepare(
    `INSERT INTO audit_logs (id, action, target_type, target_id, detail, created_at)
     VALUES (?, 'link.read', 'link', ?, '{"profile":"scale"}', ?)`
  );

  db.exec('BEGIN');
  try {
    for (let index = 0; index < PROFILE.links; index++) {
      const suffix = String(index).padStart(5, '0');
      insertLink.run(
        `link-${suffix}`,
        `slug-${suffix}`,
        'scale.example',
        `https://destination.example/${suffix}?utm_source=scale`,
        `Scale link ${suffix}`,
        index % 1_000,
        createdAt,
        createdAt
      );
    }

    for (let index = 0; index < PROFILE.visits; index++) {
      const linkSuffix = String(index % PROFILE.links).padStart(5, '0');
      insertVisit.run(
        `visit-${String(index).padStart(6, '0')}`,
        `link-${linkSuffix}`,
        `slug-${linkSuffix}`,
        index % 3 === 0 ? 'https://search.example/' : null,
        ['US', 'DE', 'SG', 'CN'][index % 4],
        ['chrome', 'firefox', 'safari'][index % 3],
        ['Windows', 'Linux', 'macOS'][index % 3],
        index % 2 === 0 ? 'desktop' : 'mobile',
        `visitor-${index % 5_000}`,
        index % 10 === 0 ? 1 : 0,
        createdAt
      );
    }

    for (let index = 0; index < PROFILE.auditLogs; index++) {
      const suffix = String(index).padStart(5, '0');
      insertAudit.run(`audit-${suffix}`, `link-${suffix}`, createdAt);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
