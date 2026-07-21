import type { Env } from '../types';
import { getRuntimeVersion } from '../config/runtime';
import { getSettings, setSetting } from '../db/index';
import { generateId, now } from '../utils/id';
import {
  buildWebhookRequest,
  DEFAULT_WEBHOOK_EVENTS,
  deliverWebhookWithRetry,
  WEBHOOK_EVENTS,
  webhookFailureLog,
  type WebhookDeliveryResult,
  type WebhookEvent,
  type WebhookRequest,
} from './policy';

export { DEFAULT_WEBHOOK_EVENTS, WEBHOOK_EVENTS } from './policy';
export type { WebhookEvent } from './policy';

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  events: Array<(typeof WEBHOOK_EVENTS)[number]>;
  has_secret: boolean;
}

interface InternalWebhookConfig extends WebhookConfig {
  secret: string;
}

const EVENT_SET = new Set<string>(WEBHOOK_EVENTS);
const NOOP_WEBHOOK_EMITTER = async (): Promise<void> => {};

export type WebhookEmitter = (data: unknown) => Promise<void>;

export async function getWebhookConfig(env: Env): Promise<WebhookConfig> {
  const config = await getInternalWebhookConfig(env);
  return {
    enabled: config.enabled,
    url: config.url,
    events: config.events,
    has_secret: !!config.secret,
  };
}

export async function updateWebhookConfig(
  env: Env,
  input: { enabled?: unknown; url?: unknown; events?: unknown; secret?: unknown },
  updatedAt = now()
): Promise<WebhookConfig> {
  const existing = await getInternalWebhookConfig(env);
  const enabled = input.enabled === undefined ? existing.enabled : parseBoolean(input.enabled);
  const url = input.url === undefined ? existing.url : normalizeWebhookUrl(input.url);
  const events = input.events === undefined ? existing.events : parseEvents(input.events);

  if (enabled && !url) throw new Error('Webhook URL is required when webhooks are enabled');

  await Promise.all([
    setSetting(env, 'webhook_enabled', enabled ? 'true' : 'false', updatedAt),
    setSetting(env, 'webhook_url', url, updatedAt),
    setSetting(env, 'webhook_events', JSON.stringify(events), updatedAt),
    input.secret === undefined
      ? Promise.resolve()
      : setSetting(env, 'webhook_secret', normalizeSecret(input.secret), updatedAt),
  ]);

  return getWebhookConfig(env);
}

export async function emitWebhook(env: Env, event: WebhookEvent, data: unknown): Promise<void> {
  const emitter = await createWebhookEmitter(env, event);
  await emitter(data);
}

export async function createWebhookEmitter(env: Env, event: WebhookEvent): Promise<WebhookEmitter> {
  try {
    const config = await getInternalWebhookConfig(env);
    if (!shouldDeliver(config, event)) return NOOP_WEBHOOK_EMITTER;

    return async (data: unknown) => {
      try {
        const result = await deliverWebhook(env, config, event, data);
        if (!result.ok) logWebhookFailure(event, result);
      } catch (error) {
        logWebhookFailure(event, {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };
  } catch (error) {
    logWebhookFailure(event, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    return NOOP_WEBHOOK_EMITTER;
  }
}

export async function sendTestWebhook(env: Env): Promise<WebhookDeliveryResult> {
  const config = await getInternalWebhookConfig(env);
  if (!config.url) return { ok: false, error: 'Webhook URL is not configured' };

  return deliverWebhook(env, { ...config, enabled: true }, 'webhook.test', {
    message: 'Linketry webhook test',
  });
}

async function getInternalWebhookConfig(env: Env): Promise<InternalWebhookConfig> {
  const settings = await getSettings(env);
  return {
    enabled: settings.webhook_enabled === 'true',
    url: settings.webhook_url ?? '',
    events: parseStoredEvents(settings.webhook_events),
    secret: settings.webhook_secret ?? '',
    has_secret: !!settings.webhook_secret,
  };
}

function shouldDeliver(config: InternalWebhookConfig, event: WebhookEvent): boolean {
  if (event === 'webhook.test') return !!config.url;
  return config.enabled && !!config.url && config.events.includes(event);
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function normalizeWebhookUrl(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') throw new Error('Webhook URL must be a string');

  const url = value.trim();
  if (!url) return '';
  if (url.length > 2048) throw new Error('Webhook URL is too long');

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Webhook URL is invalid');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Webhook URL must use http or https');
  }

  return parsed.toString();
}

function normalizeSecret(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error('Webhook secret must be a string');
  if (value.length > 500) throw new Error('Webhook secret is too long');
  return value.trim();
}

function parseEvents(value: unknown): Array<(typeof WEBHOOK_EVENTS)[number]> {
  if (!Array.isArray(value)) throw new Error('Webhook events must be an array');
  const invalid = value.filter((event) => typeof event !== 'string' || !EVENT_SET.has(event));
  if (invalid.length > 0) throw new Error('Webhook events contain unsupported values');

  const events = value as Array<(typeof WEBHOOK_EVENTS)[number]>;
  return events.length > 0 ? [...new Set(events)] : [...DEFAULT_WEBHOOK_EVENTS];
}

function parseStoredEvents(value?: string | null): Array<(typeof WEBHOOK_EVENTS)[number]> {
  if (!value) return [...DEFAULT_WEBHOOK_EVENTS];
  try {
    return parseEvents(JSON.parse(value));
  } catch {
    return [...DEFAULT_WEBHOOK_EVENTS];
  }
}

async function deliverWebhook(
  env: Env,
  config: InternalWebhookConfig,
  event: WebhookEvent,
  data: unknown
): Promise<WebhookDeliveryResult> {
  const createdAt = now();
  const request = await buildWebhookRequest(
    event,
    data,
    getRuntimeVersion(env),
    config.secret,
    createdAt,
    generateId()
  );

  return deliverWebhookWithRetry(() => sendWebhookRequest(config.url, request));
}

async function sendWebhookRequest(
  url: string,
  request: WebhookRequest
): Promise<WebhookDeliveryResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: request.headers,
      body: request.body,
      signal: controller.signal,
    });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network_error',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function logWebhookFailure(event: WebhookEvent, result: WebhookDeliveryResult): void {
  console.warn(webhookFailureLog(event, result));
}
