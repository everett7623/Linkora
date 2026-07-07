import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Link, PaginatedResult } from '@linkora/shared';

export interface ListLinksParams {
  keyword?: string;
  tag?: string;
  status?: string;
  source?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export function listLinks(params: ListLinksParams = {}): Promise<PaginatedResult<Link>> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.tag) q.set('tag', params.tag);
  if (params.status) q.set('status', params.status);
  if (params.source) q.set('source', params.source);
  if (params.sort) q.set('sort', params.sort);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return apiGet(`/api/links?${q.toString()}`);
}

export function getLink(id: string): Promise<Link> {
  return apiGet(`/api/links/${id}`);
}

export interface CreateLinkPayload {
  long_url: string;
  slug?: string;
  title?: string;
  tags?: string[];
  redirect_type?: 301 | 302;
  status?: string;
  expires_at?: string | null;
  max_clicks?: number | null;
}

export function createLink(payload: CreateLinkPayload): Promise<Link> {
  return apiPost('/api/links', payload);
}

export function updateLink(id: string, payload: Partial<CreateLinkPayload>): Promise<Link> {
  return apiPut(`/api/links/${id}`, payload);
}

export function deleteLink(id: string): Promise<{ message: string }> {
  return apiDelete(`/api/links/${id}`);
}

export function disableLink(id: string): Promise<{ message: string }> {
  return apiPost(`/api/links/${id}/disable`);
}

export function enableLink(id: string): Promise<{ message: string }> {
  return apiPost(`/api/links/${id}/enable`);
}

export function archiveLink(id: string): Promise<{ message: string }> {
  return apiPost(`/api/links/${id}/archive`);
}

export function restoreLink(id: string): Promise<{ message: string }> {
  return apiPost(`/api/links/${id}/restore`);
}

export type BulkLinkAction = 'disable' | 'enable' | 'archive' | 'restore' | 'delete';
export type BulkTagMode = 'add' | 'replace' | 'remove' | 'clear';

export function bulkLinkAction(
  ids: string[],
  action: BulkLinkAction
): Promise<{ action: BulkLinkAction; total: number; success: number; notFound: number }> {
  return apiPost('/api/links/bulk', { ids, action });
}

export function bulkTagLinks(
  ids: string[],
  tags: string[],
  mode: BulkTagMode
): Promise<{ mode: BulkTagMode; tags: string[]; total: number; success: number; notFound: number }> {
  return apiPost('/api/links/bulk-tag', { ids, tags, mode });
}

export function getOverview(): Promise<{
  totalLinks: number;
  totalClicks: number;
  todayClicks: number;
  recentLinks: Link[];
  topLinks: Link[];
}> {
  return apiGet('/api/overview');
}
