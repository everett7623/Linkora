import assert from 'node:assert/strict';
import test from 'node:test';
import { isPublicStatsShare, normalizePublicStatsDays } from './policy.ts';

test('public stats privacy policy restricts date ranges and stored config shape', () => {
  assert.equal(normalizePublicStatsDays(7), 7);
  assert.equal(normalizePublicStatsDays(13), 30);
  assert.equal(isPublicStatsShare({ link_id: '1', token_hash: 'hash', days: 30, show_countries: false, show_referrers: false, created_at: 'now' }), true);
  assert.equal(isPublicStatsShare({ link_id: '1', token: 'secret' }), false);
});

