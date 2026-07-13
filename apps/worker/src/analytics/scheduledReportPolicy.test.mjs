import assert from 'node:assert/strict'; import test from 'node:test';
import { parseReportConfig, parseReportRecords } from './scheduledReportPolicy.ts';
test('scheduled report policy is opt-in and bounded', () => {
  assert.deepEqual(parseReportConfig(), { enabled:false, days:30, saved_view_id:null });
  assert.equal(parseReportConfig('{"enabled":true,"days":13}').days, 30);
  const records = Array.from({length:35}, (_, i) => ({key:`reports/${i}.csv`,created_at:'now',status:'completed',size:1}));
  assert.equal(parseReportRecords(JSON.stringify(records)).length, 30);
  assert.deepEqual(parseReportRecords('bad'), []);
});
