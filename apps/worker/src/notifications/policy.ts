export const NOTIFICATION_PROVIDERS = [
  'telegram',
  'discord',
  'slack',
  'feishu',
  'dingtalk',
  'wecom',
] as const;

export type NotificationProvider = (typeof NOTIFICATION_PROVIDERS)[number];

const MAX_NOTIFICATION_ITEMS = 10;
const MAX_NOTIFICATION_LENGTH = 1900;

export function buildNotificationRequest(
  provider: NotificationProvider,
  credential: string,
  target: string,
  message: string
): { url: string; body: Record<string, unknown> } {
  if (provider === 'telegram') {
    return {
      url: `https://api.telegram.org/bot${credential}/sendMessage`,
      body: { chat_id: target, text: message, disable_web_page_preview: true },
    };
  }
  if (provider === 'discord') {
    return { url: credential, body: { content: message, allowed_mentions: { parse: [] } } };
  }
  if (provider === 'slack') return { url: credential, body: { text: message } };
  if (provider === 'feishu')
    return { url: credential, body: { msg_type: 'text', content: { text: message } } };
  return { url: credential, body: { msgtype: 'text', text: { content: message } } };
}

export function formatHealthNotification(
  event: 'health_check.failed' | 'health_check.recovered',
  data: unknown
): string {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const summary =
    record.summary && typeof record.summary === 'object'
      ? (record.summary as Record<string, unknown>)
      : {};
  const rawItems = Array.isArray(summary.items)
    ? summary.items.filter(
        (item): item is Record<string, unknown> => !!item && typeof item === 'object'
      )
    : Array.isArray(record.items)
      ? record.items.filter(
          (item): item is Record<string, unknown> => !!item && typeof item === 'object'
        )
      : [];
  const isFailure = event === 'health_check.failed';
  const items = isFailure ? rawItems.filter((item) => item.status !== 'healthy') : rawItems;
  const lines = [
    isFailure ? '⚠️ Linkora Link Alert' : '✅ Linkora Link Recovered',
    '',
    isFailure
      ? `Affected Links: ${items.length}`
      : `Recovered Links: ${items.length || arrayLength(record.recovered)}`,
  ];
  if (isFailure) {
    lines.push(
      `Checked: ${numberValue(summary.total)} | Warning: ${numberValue(summary.warning)} | Broken: ${numberValue(summary.broken)}`
    );
  }

  for (const item of items.slice(0, MAX_NOTIFICATION_ITEMS)) {
    const slug = stringValue(item.slug) || stringValue(item.link_id) || 'unknown';
    const domain = stringValue(item.domain);
    const error = stringValue(item.error);
    lines.push(
      '',
      `Short Link: ${domain ? `https://${domain}/${slug}` : `/${slug}`}`,
      `Target URL: ${stringValue(item.url) || 'Unknown'}`,
      `Status: ${healthStatus(item, isFailure)}`,
      `HTTP Status: ${httpStatus(item.http_status)}`,
      `Response Time: ${responseTime(item.response_time_ms)}`,
      `Detected At: ${detectedAt(item.checked_at)}`
    );
    if (error) lines.push(`Error: ${error}`);
  }
  if (items.length > MAX_NOTIFICATION_ITEMS) {
    lines.push('', `…and ${items.length - MAX_NOTIFICATION_ITEMS} more`);
  }
  lines.push(
    '',
    isFailure
      ? 'Please check the target URL or redirect configuration.'
      : 'The target URL has returned to normal.'
  );
  return lines.join('\n').slice(0, MAX_NOTIFICATION_LENGTH);
}

function healthStatus(item: Record<string, unknown>, isFailure: boolean): string {
  if (!isFailure) return 'Online';
  return item.status === 'warning' ? 'Target Warning' : 'Target Offline';
}

function httpStatus(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : 'N/A';
}

function responseTime(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? `${Math.round(value)} ms`
    : 'N/A';
}

function detectedAt(value: unknown): string {
  const timestamp = stringValue(value);
  const utc = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?Z$/.exec(timestamp);
  return utc ? `${utc[1]} ${utc[2]} UTC` : timestamp || 'Unknown';
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}
