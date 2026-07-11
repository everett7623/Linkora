import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateHealthAlerts,
  normalizeFailureThreshold,
  normalizeSuppressionMinutes,
  parseHealthAlertState,
} from './alertPolicy.ts';

test('health alerts require consecutive failures and emit recovery', () => {
  const first = evaluateHealthAlerts(
    ['a'],
    ['a'],
    { failures: {}, alerted: [] },
    2,
    1440,
    '2026-07-11T00:00:00.000Z'
  );
  assert.equal(first.notifyFailure, false);

  const second = evaluateHealthAlerts(
    ['a'],
    ['a'],
    first.nextState,
    2,
    1440,
    '2026-07-11T01:00:00.000Z'
  );
  assert.equal(second.notifyFailure, true);
  assert.deepEqual(second.newlyFailed, ['a']);

  const recovered = evaluateHealthAlerts(
    ['a'],
    [],
    second.nextState,
    2,
    1440,
    '2026-07-11T02:00:00.000Z'
  );
  assert.deepEqual(recovered.recovered, ['a']);
  assert.deepEqual(recovered.nextState.alerted, []);
});

test('health alerts suppress repeats until the configured window elapses', () => {
  const previous = {
    failures: { a: 2 },
    alerted: ['a'],
    lastAlertAt: '2026-07-11T00:00:00.000Z',
  };
  const suppressed = evaluateHealthAlerts(
    ['a'],
    ['a'],
    previous,
    2,
    60,
    '2026-07-11T00:30:00.000Z'
  );
  assert.equal(suppressed.notifyFailure, false);

  const repeated = evaluateHealthAlerts(
    ['a'],
    ['a'],
    previous,
    2,
    60,
    '2026-07-11T01:00:00.000Z'
  );
  assert.equal(repeated.notifyFailure, true);
});

test('health alert settings and stored state use safe defaults', () => {
  assert.equal(normalizeFailureThreshold('0'), 2);
  assert.equal(normalizeFailureThreshold('10'), 10);
  assert.equal(normalizeSuppressionMinutes('-1'), 1440);
  assert.equal(normalizeSuppressionMinutes('0'), 0);
  assert.deepEqual(parseHealthAlertState('invalid'), { failures: {}, alerted: [] });
});

test('health alerts preserve state for targets outside the current rotating batch', () => {
  const decision = evaluateHealthAlerts(
    ['current'],
    [],
    {
      failures: { deferred: 3 },
      alerted: ['deferred'],
      lastAlertAt: '2026-07-11T00:00:00.000Z',
    },
    2,
    1440,
    '2026-07-11T01:00:00.000Z'
  );

  assert.equal(decision.nextState.failures.deferred, 3);
  assert.deepEqual(decision.nextState.alerted, ['deferred']);
  assert.deepEqual(decision.recovered, []);
});
