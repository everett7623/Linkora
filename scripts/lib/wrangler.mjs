import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const wranglerPackagePath = require.resolve('wrangler/package.json');
const wranglerPackage = require('wrangler/package.json');
const WRANGLER_CLI = resolve(dirname(wranglerPackagePath), wranglerPackage.bin.wrangler);

export function runWrangler(args, env = process.env) {
  return spawnSync(process.execPath, [WRANGLER_CLI, ...args], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
    windowsHide: true,
  });
}

export function stripAnsi(value) {
  return String(value ?? '').replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
}

export function parseJsonOutput(value) {
  const output = stripAnsi(value).trim();
  const starts = [output.indexOf('['), output.indexOf('{')].filter((index) => index >= 0);
  if (starts.length === 0) throw new Error('Wrangler did not return JSON output.');

  const start = Math.min(...starts);
  const closingCharacter = output[start] === '[' ? ']' : '}';
  const end = output.lastIndexOf(closingCharacter);
  if (end < start) throw new Error('Wrangler returned incomplete JSON output.');
  return JSON.parse(output.slice(start, end + 1));
}
