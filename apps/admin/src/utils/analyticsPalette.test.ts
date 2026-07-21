import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GLOBAL_DISTRIBUTION_COLORS,
  WORLD_TRAFFIC_COLORS,
  globalDistributionColor,
  worldTrafficColor,
} from './analyticsPalette.ts';

test('global distribution provides ten distinct categorical colors', () => {
  assert.equal(GLOBAL_DISTRIBUTION_COLORS.length, 10);
  assert.equal(new Set(GLOBAL_DISTRIBUTION_COLORS).size, 10);
});

test('world traffic uses ten distinct intensity colors', () => {
  assert.equal(WORLD_TRAFFIC_COLORS.length, 10);
  assert.equal(new Set(WORLD_TRAFFIC_COLORS).size, 10);
  assert.deepEqual(
    Array.from({ length: 10 }, (_, index) => worldTrafficColor(index + 1, 10)),
    WORLD_TRAFFIC_COLORS
  );
  assert.equal(worldTrafficColor(0, 10), 'rgb(30 41 59)');
});

test('global distribution colors repeat predictably for long country lists', () => {
  assert.equal(globalDistributionColor(0), GLOBAL_DISTRIBUTION_COLORS[0]);
  assert.equal(globalDistributionColor(9), GLOBAL_DISTRIBUTION_COLORS[9]);
  assert.equal(globalDistributionColor(10), GLOBAL_DISTRIBUTION_COLORS[0]);
  assert.equal(globalDistributionColor(Number.NaN), GLOBAL_DISTRIBUTION_COLORS[0]);
});
