import type { LinkHealthBatchResult, LinkHealthCheckResult } from '@linkora/shared';
import { apiPost } from './client';

export function checkUrl(url: string): Promise<LinkHealthCheckResult> {
  return apiPost('/api/health-checks/url', { url });
}

export function checkLink(id: string): Promise<LinkHealthCheckResult> {
  return apiPost(`/api/health-checks/links/${id}`);
}

export function runHealthCheckBatch(payload: { ids?: string[]; limit?: number } = {}): Promise<LinkHealthBatchResult> {
  return apiPost('/api/health-checks/batch', payload);
}
