import type { RedirectRule, RedirectRuleTarget, RedirectRuleType } from '@linkora/shared';
import { apiDelete, apiGet, apiPost, apiPut } from './client';

export interface RedirectRulesList {
  items: RedirectRule[];
  total: number;
}

export interface RedirectRulePayload {
  link_id: string;
  rule_type: RedirectRuleType;
  priority?: number;
  enabled?: boolean;
  values?: string[];
  targetUrl?: string;
  targets?: RedirectRuleTarget[];
}

export function listRedirectRules(linkId?: string): Promise<RedirectRulesList> {
  const query = linkId ? `?linkId=${encodeURIComponent(linkId)}` : '';
  return apiGet(`/api/redirect-rules${query}`);
}

export function createRedirectRule(payload: RedirectRulePayload): Promise<RedirectRule> {
  return apiPost('/api/redirect-rules', payload);
}

export function updateRedirectRule(id: string, payload: RedirectRulePayload): Promise<RedirectRule> {
  return apiPut(`/api/redirect-rules/${id}`, payload);
}

export function deleteRedirectRule(id: string): Promise<{ message: string }> {
  return apiDelete(`/api/redirect-rules/${id}`);
}
