import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDemoArtifacts, buildDemoSeedSql } from './demo-seed.mjs';

test('Demo seed is deterministic, synthetic, and uses the isolated origin', () => {
  const sql = buildDemoSeedSql({
    origin: 'https://demo-go.linketry.com',
    now: new Date('2026-07-17T12:00:00.000Z'),
  });

  assert.match(sql, /Linketry public Demo synthetic dataset/);
  assert.match(sql, /demo-go\.linketry\.com/);
  assert.match(sql, /linketry-demo-link-product/);
  assert.match(sql, /linketry-demo-visit-084/);
  assert.match(sql, /linketry-demo-conversion-12/);
  assert.match(sql, /warning_enabled/);
  assert.match(sql, /'disabled'/);
  assert.match(sql, /linketry-demo-rule-weighted/);
  assert.match(sql, /linketry-demo-import-shlink/);
  assert.match(sql, /linketry-demo-token-read/);
  assert.match(sql, /linketry-demo-backup-latest/);
  assert.match(sql, /health_check_history/);
  assert.match(sql, /analytics_report_records/);
  assert.match(sql, /ON CONFLICT\(id\) DO UPDATE/);
  assert.match(sql, /ON CONFLICT\(key\) DO UPDATE/);
  assert.doesNotMatch(sql, /go\.uukk\.de|admin\.uukk\.de/);
});

test('Demo artifacts match the seeded R2 object keys and contain valid sample files', () => {
  const artifacts = buildDemoArtifacts({
    origin: 'https://demo-go.linketry.com',
    now: new Date('2026-07-17T12:00:00.000Z'),
    version: '0.25.0',
  });

  assert.deepEqual(
    artifacts.map((artifact) => artifact.key),
    [
      'backups/linketry-demo-snapshot.json',
      'backups/linketry-demo-pre-release.json',
      'reports/linketry-demo-analytics.csv',
    ]
  );
  assert.equal(JSON.parse(artifacts[0].body).name, 'Linketry Backup');
  assert.match(artifacts[2].body, /summary,total_clicks,84/);
});

test('Demo seed rejects unsafe or ambiguous origins', () => {
  assert.throws(() => buildDemoSeedSql({ origin: 'http://demo.example' }), /must be an HTTPS URL/);
  assert.throws(
    () => buildDemoSeedSql({ origin: 'https://demo.example/path' }),
    /must not contain a path/
  );
});
