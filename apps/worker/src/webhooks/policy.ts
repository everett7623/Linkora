export const DEFAULT_WEBHOOK_EVENTS = [
  'link.created',
  'link.updated',
  'link.deleted',
  'link.disabled',
  'link.enabled',
  'link.archived',
  'link.restored',
  'link.bulk',
  'import.completed',
  'backup.completed',
  'backup.failed',
  'health_check.failed',
  'health_check.recovered',
] as const;

export const WEBHOOK_EVENTS = [...DEFAULT_WEBHOOK_EVENTS, 'link.clicked'] as const;
export const WEBHOOK_MAX_DELIVERY_ATTEMPTS = 3;
export const WEBHOOK_RETRY_DELAYS_MS = [200, 500] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number] | 'webhook.test';

export interface WebhookDeliveryResult {
  ok: boolean;
  status?: number;
  error?: string;
  attempts?: number;
}

export interface WebhookRequest {
  body: string;
  headers: Record<string, string>;
}

export async function buildWebhookRequest(
  event: WebhookEvent,
  data: unknown,
  version: string,
  secret: string,
  createdAt: string,
  id: string
): Promise<WebhookRequest> {
  const body = JSON.stringify({ id, event, created_at: createdAt, version, data });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Linketry-Webhook/1.0',
    'X-Linketry-Event': event,
    'X-Linketry-Timestamp': createdAt,
  };

  if (secret) {
    const signature = `sha256=${await signWebhook(secret, `${createdAt}.${body}`)}`;
    headers['X-Linketry-Signature'] = signature;
  }

  return { body, headers };
}

export function shouldRetryWebhook(result: WebhookDeliveryResult): boolean {
  if (result.ok) return false;
  if (result.status === undefined) return true;
  return (
    result.status === 408 || result.status === 425 || result.status === 429 || result.status >= 500
  );
}

export async function deliverWebhookWithRetry(
  send: () => Promise<WebhookDeliveryResult>,
  wait: (milliseconds: number) => Promise<void> = delay
): Promise<WebhookDeliveryResult> {
  let lastResult: WebhookDeliveryResult = { ok: false, error: 'Webhook delivery failed' };
  for (let attempt = 1; attempt <= WEBHOOK_MAX_DELIVERY_ATTEMPTS; attempt += 1) {
    lastResult = { ...(await send()), attempts: attempt };
    if (
      lastResult.ok ||
      !shouldRetryWebhook(lastResult) ||
      attempt === WEBHOOK_MAX_DELIVERY_ATTEMPTS
    ) {
      return lastResult;
    }
    await wait(WEBHOOK_RETRY_DELAYS_MS[attempt - 1] ?? WEBHOOK_RETRY_DELAYS_MS.at(-1) ?? 500);
  }
  return lastResult;
}

export function webhookFailureLog(event: WebhookEvent, result: WebhookDeliveryResult): string {
  return JSON.stringify({
    message: 'Linketry webhook delivery failed',
    event,
    status: result.status,
    error: result.error,
    attempts: result.attempts,
  });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function signWebhook(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
