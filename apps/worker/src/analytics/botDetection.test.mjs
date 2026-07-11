import assert from 'node:assert/strict';
import test from 'node:test';
import { isLikelyBot } from './botDetection.ts';

test('bot detection recognizes search, preview, AI, monitoring, and automation clients', () => {
  const bots = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2',
    'ClaudeBot/1.0',
    'UptimeRobot/2.0',
    'curl/8.10.1',
    'python-requests/2.32.0',
    'Linkora/0.1 health-check (+https://github.com/EvenFrank/Linkora)',
    'Example_Crawler/1.0',
  ];

  for (const userAgent of bots) assert.equal(isLikelyBot(userAgent), true, userAgent);
});

test('bot detection preserves real browsers and avoids CUBOT false positives', () => {
  const browsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; CUBOT KINGKONG 9) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0',
  ];

  for (const userAgent of browsers) assert.equal(isLikelyBot(userAgent), false, userAgent);
  assert.equal(isLikelyBot(''), false);
  assert.equal(isLikelyBot(null), false);
});
