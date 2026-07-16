import assert from 'node:assert/strict';
import test from 'node:test';
import type { Link } from '@linketry/shared';
import {
  getEffectiveLinkStatus,
  isLinkExpiredByClicks,
  isLinkExpiredByTime,
  parseLinkTags,
} from './linkPresentation.ts';

const link: Link = {
  id: 'link-1',
  slug: 'docs',
  long_url: 'https://example.com/docs',
  status: 'active',
  redirect_type: 302,
  clicks: 4,
  created_at: '2026-07-16T00:00:00.000Z',
  updated_at: '2026-07-16T00:00:00.000Z',
  warning_enabled: 0,
  archived: 0,
};

test('effective status reflects time and click limits without changing stored status', () => {
  const now = Date.parse('2026-07-16T12:00:00.000Z');
  assert.equal(isLinkExpiredByTime({ ...link, expires_at: '2026-07-16T11:00:00.000Z' }, now), true);
  assert.equal(isLinkExpiredByClicks({ ...link, max_clicks: 4 }), true);
  assert.equal(getEffectiveLinkStatus({ ...link, max_clicks: 5 }, now), 'active');
  assert.equal(
    getEffectiveLinkStatus({ ...link, status: 'disabled', max_clicks: 4 }, now),
    'disabled'
  );
});

test('stored link tags are parsed defensively for both list views', () => {
  assert.deepEqual(parseLinkTags('["docs"," release ",3]'), ['docs', ' release ']);
  assert.deepEqual(parseLinkTags('{"docs":true}'), []);
  assert.deepEqual(parseLinkTags('invalid'), []);
});
