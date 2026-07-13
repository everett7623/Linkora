import assert from 'node:assert/strict';
import test from 'node:test';
import { appendHealthHistory, MAX_HEALTH_HISTORY_ITEMS, parseHealthHistory } from './history.ts';

const result = (id, status = 'healthy') => ({
  link_id: id, url: `https://example.com/${id}`, final_url: `https://example.com/${id}`,
  status, http_status: status === 'healthy' ? 200 : 503, method: 'HEAD',
  response_time_ms: 12, checked_at: '2026-07-11T12:00:00.000Z', error: null,
});

test('appends newest scheduled results with failure counts', () => {
  const items = appendHealthHistory([], [result('one', 'broken'), result('two')], { one: 3 });
  assert.deepEqual(items.map((item) => item.link_id), ['two', 'one']);
  assert.equal(items[1].consecutive_failures, 3);
  assert.equal(items[0].consecutive_failures, 0);
});

test('caps persisted history and tolerates invalid state', () => {
  const results = Array.from({ length: MAX_HEALTH_HISTORY_ITEMS + 10 }, (_, index) => result(String(index)));
  assert.equal(appendHealthHistory([], results, {}).length, MAX_HEALTH_HISTORY_ITEMS);
  assert.deepEqual(parseHealthHistory('not json'), []);
  assert.deepEqual(parseHealthHistory(JSON.stringify([{ link_id: 4 }])), []);
});

