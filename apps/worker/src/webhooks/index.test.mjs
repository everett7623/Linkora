import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import {
  buildWebhookRequest,
  DEFAULT_WEBHOOK_EVENTS,
  deliverWebhookWithRetry,
  shouldRetryWebhook,
  WEBHOOK_EVENTS,
  webhookFailureLog,
} from './policy.ts';
import { buildClickWebhookData } from '../analytics/clickWebhook.ts';

test('link.clicked is available but excluded from the default high-volume event set', () => {
  assert.equal(WEBHOOK_EVENTS.includes('link.clicked'), true);
  assert.equal(DEFAULT_WEBHOOK_EVENTS.includes('link.clicked'), false);
});

test('click webhook payload excludes visitor and destination details', () => {
  const data = buildClickWebhookData(
    {
      link: {
        id: 'link-1',
        slug: 'private-offer',
        domain: 'go.example.com',
        long_url: 'https://merchant.example/private?customer=secret',
        redirect_type: 302,
        status: 'active',
        warning_enabled: 0,
        password_protected: false,
      },
      request: {
        ip: '203.0.113.10',
        user_agent: 'Private Browser Value',
        referer: 'https://private.example/referrer',
        country: 'DE',
      },
      domain: 'go.example.com',
      target: { url: 'https://selected.example/private', redirect_rule_id: 'rule-1' },
      queued_at: '2026-07-21T00:00:00.000Z',
    },
    'visit-1',
    '2026-07-21T00:00:01.000Z',
    false
  );

  assert.deepEqual(data, {
    click: { id: 'visit-1', occurred_at: '2026-07-21T00:00:01.000Z', is_bot: false },
    link: { id: 'link-1', slug: 'private-offer', domain: 'go.example.com' },
  });
  assert.doesNotMatch(
    JSON.stringify(data),
    /203\.0\.113\.10|Private Browser Value|private\.example|merchant\.example|selected\.example|rule-1|country|referer|user_agent|ip_hash/
  );
});

test('webhook request signs one stable event envelope', async () => {
  const createdAt = '2026-07-21T00:00:01.000Z';
  const request = await buildWebhookRequest(
    'link.clicked',
    { click: { id: 'visit-1' } },
    '0.28.4',
    'test-secret',
    createdAt,
    'event-1'
  );
  const expected = createHmac('sha256', 'test-secret')
    .update(`${createdAt}.${request.body}`)
    .digest('hex');

  assert.equal(request.headers['X-Linketry-Event'], 'link.clicked');
  assert.equal(request.headers['X-Linketry-Timestamp'], createdAt);
  assert.equal(request.headers['X-Linketry-Signature'], `sha256=${expected}`);
  assert.deepEqual(JSON.parse(request.body), {
    id: 'event-1',
    event: 'link.clicked',
    created_at: createdAt,
    version: '0.28.4',
    data: { click: { id: 'visit-1' } },
  });
});

test('retry policy is bounded to transient transport and HTTP failures', () => {
  assert.equal(shouldRetryWebhook({ ok: false, error: 'network error' }), true);
  for (const status of [408, 425, 429, 500, 503]) {
    assert.equal(shouldRetryWebhook({ ok: false, status }), true);
  }
  for (const status of [400, 401, 403, 404, 422]) {
    assert.equal(shouldRetryWebhook({ ok: false, status }), false);
  }
  assert.equal(shouldRetryWebhook({ ok: true, status: 204 }), false);
});

test('transient delivery retries twice with one bounded schedule', async () => {
  const results = [
    { ok: false, status: 503 },
    { ok: false, status: 429 },
    { ok: true, status: 204 },
  ];
  const waits = [];
  let calls = 0;
  const result = await deliverWebhookWithRetry(
    async () => results[calls++] ?? { ok: false, status: 503 },
    async (milliseconds) => waits.push(milliseconds)
  );

  assert.deepEqual(result, { ok: true, status: 204, attempts: 3 });
  assert.equal(calls, 3);
  assert.deepEqual(waits, [200, 500]);
});

test('failure observability excludes payloads, URLs, and secrets', () => {
  const log = webhookFailureLog('link.clicked', {
    ok: false,
    status: 503,
    error: 'upstream unavailable',
    attempts: 3,
  });
  assert.deepEqual(JSON.parse(log), {
    message: 'Linketry webhook delivery failed',
    event: 'link.clicked',
    status: 503,
    error: 'upstream unavailable',
    attempts: 3,
  });
  assert.doesNotMatch(log, /secret|https?:|payload|visit-1/);
});
