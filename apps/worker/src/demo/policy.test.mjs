import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkDemoRateLimit,
  isPublicReadOnlyDemo,
  isReadOnlyMethod,
} from './policy.ts';

function createRateLimiter(outcomes) {
  const keys = [];
  return {
    keys,
    async limit({ key }) {
      keys.push(key);
      return { success: outcomes.shift() ?? false };
    },
  };
}

test('public Demo mode is explicit and permits only read-only methods', () => {
  assert.equal(isPublicReadOnlyDemo({ LINKETRY_DEMO_MODE: 'read-only' }), true);
  assert.equal(isPublicReadOnlyDemo({ LINKETRY_DEMO_MODE: 'true' }), false);
  assert.equal(isPublicReadOnlyDemo({}), false);
  assert.equal(isReadOnlyMethod('GET'), true);
  assert.equal(isReadOnlyMethod('head'), true);
  assert.equal(isReadOnlyMethod('OPTIONS'), true);
  assert.equal(isReadOnlyMethod('POST'), false);
  assert.equal(isReadOnlyMethod('DELETE'), false);
});

test('Demo rate limit sends only a hashed client key to the platform binding', async () => {
  const limiter = createRateLimiter([true, true, false]);
  const env = { DEMO_RATE_LIMITER: limiter };
  const request = new Request('https://demo.example/api/v1/overview', {
    headers: { 'CF-Connecting-IP': '203.0.113.42' },
  });

  const first = await checkDemoRateLimit(env, request);
  const second = await checkDemoRateLimit(env, request);
  const third = await checkDemoRateLimit(env, request);

  assert.deepEqual(
    [first.allowed, second.allowed, third.allowed],
    [true, true, false]
  );
  assert.equal(first.limit, 120);
  assert.equal(limiter.keys.length, 3);
  assert.doesNotMatch(limiter.keys[0], /203\.0\.113\.42/);
  assert.match(limiter.keys[0], /^[a-f0-9]{64}$/);
});

test('Demo rate limit fails closed when its dedicated binding is missing', async () => {
  await assert.rejects(
    () => checkDemoRateLimit({}, new Request('https://demo.example/api/v1/overview')),
    /binding is unavailable/
  );
});
