import { Hono } from 'hono';
import type { RedirectRule, RedirectRuleConfig, RedirectRuleTarget, RedirectRuleType } from '@linkora/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  createRedirectRule,
  deleteRedirectRule,
  getLinkById,
  getRedirectRuleById,
  listRedirectRules,
  updateRedirectRule,
} from '../db/index';
import { recordAudit } from '../audit/index';
import { jsonCreated, jsonError, jsonOk } from '../utils/response';
import { generateId, now } from '../utils/id';

const redirectRules = new Hono<{ Bindings: Env }>();

const RULE_TYPES: RedirectRuleType[] = ['country', 'device', 'browser', 'referer', 'language', 'weighted'];

redirectRules.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

redirectRules.get('/', async (c) => {
  const linkId = c.req.query('linkId') || undefined;
  if (linkId && !(await getLinkById(c.env, linkId))) return jsonError('Link not found', 404);

  const rules = await listRedirectRules(c.env, linkId);
  return jsonOk({ items: rules, total: rules.length });
});

redirectRules.get('/:id', async (c) => {
  const rule = await getRedirectRuleById(c.env, c.req.param('id'));
  if (!rule) return jsonError('Redirect rule not found', 404);
  return jsonOk(rule);
});

redirectRules.post('/', async (c) => {
  let body: RuleBody;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = await parseRuleBody(c.env, body);
  if (parsed.error) return jsonError(parsed.error, 400);

  const ts = now();
  const rule: RedirectRule = {
    id: generateId(),
    link_id: parsed.linkId!,
    rule_type: parsed.ruleType!,
    rule_config: JSON.stringify(parsed.config),
    priority: parsed.priority!,
    created_at: ts,
    updated_at: ts,
  };

  await createRedirectRule(c.env, rule);
  await recordAudit(c.env, c.req.raw, 'redirect_rule.create', 'redirect_rule', rule.id, {
    link_id: rule.link_id,
    rule_type: rule.rule_type,
    priority: rule.priority,
  });

  return jsonCreated(rule);
});

redirectRules.put('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await getRedirectRuleById(c.env, id);
  if (!existing) return jsonError('Redirect rule not found', 404);

  let body: RuleBody;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (body.link_id !== undefined && body.link_id !== existing.link_id) {
    return jsonError('link_id cannot be changed after rule creation', 400);
  }

  const parsed = await parseRuleBody(c.env, { ...body, link_id: existing.link_id }, existing);
  if (parsed.error) return jsonError(parsed.error, 400);

  const updatedAt = now();
  await updateRedirectRule(c.env, id, {
    rule_type: parsed.ruleType!,
    rule_config: JSON.stringify(parsed.config),
    priority: parsed.priority!,
    updated_at: updatedAt,
  });

  const updated: RedirectRule = {
    ...existing,
    rule_type: parsed.ruleType!,
    rule_config: JSON.stringify(parsed.config),
    priority: parsed.priority!,
    updated_at: updatedAt,
  };

  await recordAudit(c.env, c.req.raw, 'redirect_rule.update', 'redirect_rule', id, {
    link_id: updated.link_id,
    rule_type: updated.rule_type,
    priority: updated.priority,
  });

  return jsonOk(updated);
});

redirectRules.delete('/:id', async (c) => {
  const existing = await getRedirectRuleById(c.env, c.req.param('id'));
  if (!existing) return jsonError('Redirect rule not found', 404);

  await deleteRedirectRule(c.env, existing.id);
  await recordAudit(c.env, c.req.raw, 'redirect_rule.delete', 'redirect_rule', existing.id, {
    link_id: existing.link_id,
    rule_type: existing.rule_type,
  });

  return jsonOk({ message: 'Redirect rule deleted' });
});

interface RuleBody {
  link_id?: unknown;
  rule_type?: unknown;
  priority?: unknown;
  config?: unknown;
  enabled?: unknown;
  values?: unknown;
  targetUrl?: unknown;
  targets?: unknown;
}

async function parseRuleBody(
  env: Env,
  body: RuleBody,
  fallback?: RedirectRule
): Promise<{
  linkId?: string;
  ruleType?: RedirectRuleType;
  priority?: number;
  config?: RedirectRuleConfig;
  error?: string;
}> {
  const linkId = typeof body.link_id === 'string' && body.link_id.trim()
    ? body.link_id.trim()
    : fallback?.link_id;
  if (!linkId) return { error: 'link_id is required' };
  if (!(await getLinkById(env, linkId))) return { error: 'Link not found' };

  const ruleType = parseRuleType(body.rule_type, fallback?.rule_type);
  if (!ruleType) return { error: 'rule_type is invalid' };

  const priority = parsePriority(body.priority, fallback?.priority ?? 100);
  if (priority === null) return { error: 'priority must be a non-negative integer' };

  const config = normalizeConfig(ruleType, body, fallback);
  if (config.error) return { error: config.error };

  return { linkId, ruleType, priority, config: config.value };
}

function parseRuleType(value: unknown, fallback?: RedirectRuleType): RedirectRuleType | null {
  if (value === undefined || value === null || value === '') return fallback ?? null;
  if (typeof value !== 'string') return null;
  return RULE_TYPES.includes(value as RedirectRuleType) ? value as RedirectRuleType : null;
}

function parsePriority(value: unknown, fallback: number): number | null {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function normalizeConfig(
  ruleType: RedirectRuleType,
  body: RuleBody,
  fallback?: RedirectRule
): { value?: RedirectRuleConfig; error?: string } {
  const fallbackConfig = fallback ? parseStoredConfig(fallback.rule_config) : {};
  const rawConfig = typeof body.config === 'object' && body.config !== null && !Array.isArray(body.config)
    ? body.config as RedirectRuleConfig
    : {};
  const enabled = parseEnabled(body.enabled ?? rawConfig.enabled ?? fallbackConfig.enabled);

  if (ruleType === 'weighted') {
    const rawTargets = body.targets ?? rawConfig.targets ?? fallbackConfig.targets;
    const targets = parseTargets(rawTargets);
    if (targets.error) return { error: targets.error };
    return { value: { enabled, targets: targets.value } };
  }

  const rawValues = body.values ?? rawConfig.values ?? fallbackConfig.values;
  const values = parseValues(rawValues);
  if (values.length === 0) return { error: 'values must include at least one match value' };

  const targetUrl = typeof body.targetUrl === 'string'
    ? body.targetUrl.trim()
    : typeof rawConfig.targetUrl === 'string'
      ? rawConfig.targetUrl.trim()
      : fallbackConfig.targetUrl ?? '';
  if (!isHttpUrl(targetUrl)) return { error: 'targetUrl must be a valid http or https URL' };

  return { value: { enabled, values, targetUrl } };
}

function parseStoredConfig(value: string): RedirectRuleConfig {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null ? parsed as RedirectRuleConfig : {};
  } catch {
    return {};
  }
}

function parseEnabled(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  return value === true || value === 1 || value === '1' || value === 'true';
}

function parseValues(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return [...new Set(raw.map((item) => String(item).trim().toLowerCase()).filter(Boolean))];
}

function parseTargets(value: unknown): { value?: RedirectRuleTarget[]; error?: string } {
  if (!Array.isArray(value)) return { error: 'targets must be an array' };

  const targets: RedirectRuleTarget[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return { error: 'Each target must be an object' };
    }
    const record = item as Record<string, unknown>;
    const url = typeof record.url === 'string' ? record.url.trim() : '';
    if (!isHttpUrl(url)) return { error: 'Each target url must be a valid http or https URL' };
    const weight = record.weight === undefined || record.weight === null || record.weight === ''
      ? 1
      : Number(record.weight);
    if (!Number.isFinite(weight) || weight <= 0) return { error: 'Each target weight must be greater than 0' };
    targets.push({ url, weight });
  }

  if (targets.length === 0) return { error: 'targets must include at least one URL' };
  return { value: targets };
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default redirectRules;
