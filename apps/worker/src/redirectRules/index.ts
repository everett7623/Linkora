import type { Link, RedirectRule, RedirectRuleConfig, RedirectRuleTarget } from '@linkora/shared';

interface RedirectContext {
  country?: string;
  device: string;
  browser: string;
  referer?: string;
  languages: string[];
  userKey?: string;
}

export function resolveRedirectTarget(
  link: Pick<Link, 'id' | 'long_url'>,
  rules: RedirectRule[],
  request: Request
): string {
  try {
    const context = buildRedirectContext(request);
    for (const rule of [...rules].sort((a, b) => a.priority - b.priority)) {
      const target = evaluateRule(link, rule, context);
      if (target) return target;
    }
  } catch {
    // Smart redirect failures must never break the default redirect.
  }

  return link.long_url;
}

function evaluateRule(
  link: Pick<Link, 'id' | 'long_url'>,
  rule: RedirectRule,
  context: RedirectContext
): string | null {
  const config = parseRuleConfig(rule.rule_config);
  if (!config || config.enabled === false) return null;

  if (rule.rule_type === 'weighted') {
    return chooseWeightedTarget(link.id, config.targets ?? [], context);
  }

  const targetUrl = validUrl(config.targetUrl) ? config.targetUrl! : null;
  if (!targetUrl) return null;

  const values = normalizeValues(config.values);
  if (values.length === 0) return null;

  if (rule.rule_type === 'country') {
    return values.includes((context.country ?? '').toLowerCase()) ? targetUrl : null;
  }

  if (rule.rule_type === 'device') {
    return values.includes(context.device.toLowerCase()) ? targetUrl : null;
  }

  if (rule.rule_type === 'browser') {
    return values.includes(context.browser.toLowerCase()) ? targetUrl : null;
  }

  if (rule.rule_type === 'language') {
    return context.languages.some((language) => values.includes(language)) ? targetUrl : null;
  }

  if (rule.rule_type === 'referer') {
    return refererMatches(context.referer, values) ? targetUrl : null;
  }

  return null;
}

function parseRuleConfig(value: string): RedirectRuleConfig | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null ? parsed as RedirectRuleConfig : null;
  } catch {
    return null;
  }
}

function buildRedirectContext(request: Request): RedirectContext {
  const ua = request.headers.get('User-Agent') ?? '';
  const languageHeader = request.headers.get('Accept-Language') ?? '';
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const cf = request as Request & { cf?: { country?: string } };

  return {
    country: cf.cf?.country?.toLowerCase(),
    device: detectDevice(ua),
    browser: detectBrowser(ua),
    referer: request.headers.get('Referer') ?? undefined,
    languages: parseLanguages(languageHeader),
    userKey: `${ip}:${ua}`,
  };
}

function normalizeValues(values?: string[]): string[] {
  return [...new Set((values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

function validUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function refererMatches(referer: string | undefined, values: string[]): boolean {
  if (!referer) return false;
  const lowerReferer = referer.toLowerCase();
  let host = '';
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    // Fall back to substring matching.
  }

  return values.some((value) => (
    lowerReferer.includes(value) ||
    (host && (host === value || host.endsWith(`.${value}`)))
  ));
}

function chooseWeightedTarget(
  linkId: string,
  targets: RedirectRuleTarget[],
  context: RedirectContext
): string | null {
  const validTargets = targets
    .filter((target) => validUrl(target.url) && (target.weight ?? 1) > 0)
    .map((target) => ({ url: target.url, weight: target.weight ?? 1 }));
  const total = validTargets.reduce((sum, target) => sum + target.weight, 0);
  if (validTargets.length === 0 || total <= 0) return null;

  let slot = hashToUnit(`${linkId}:${context.userKey ?? Math.random()}`) * total;
  for (const target of validTargets) {
    slot -= target.weight;
    if (slot <= 0) return target.url;
  }

  return validTargets[validTargets.length - 1].url;
}

function hashToUnit(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function parseLanguages(header: string): string[] {
  const languages = new Set<string>();
  for (const part of header.split(',')) {
    const language = part.split(';')[0].trim().toLowerCase();
    if (!language) continue;
    languages.add(language);
    languages.add(language.split('-')[0]);
  }
  return [...languages];
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'edge';
  if (/Chrome/i.test(ua)) return 'chrome';
  if (/Firefox/i.test(ua)) return 'firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'safari';
  if (/MSIE|Trident/i.test(ua)) return 'ie';
  if (/Opera|OPR/i.test(ua)) return 'opera';
  return 'other';
}

function detectDevice(ua: string): string {
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  return 'desktop';
}
