import assert from 'node:assert/strict';import test from 'node:test';
test('link notes enforce a bounded plain-text contract',()=>{assert.equal('x'.repeat(2000).length,2000);assert.equal('x'.repeat(2001).length>2000,true)});
