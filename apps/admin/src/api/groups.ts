import type { LinkGroup, LinkGroupType } from '@linkora/shared';
import { apiDelete, apiGet, apiPost, apiPut } from './client';

export interface GroupsList {
  items: LinkGroup[];
  total: number;
}

export interface GroupPayload {
  type: LinkGroupType;
  name: string;
  color?: string | null;
  description?: string | null;
}

export function listGroups(type?: LinkGroupType | ''): Promise<GroupsList> {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  return apiGet(`/api/groups${query}`);
}

export function createGroup(payload: GroupPayload): Promise<LinkGroup> {
  return apiPost('/api/groups', payload);
}

export function updateGroup(id: string, payload: GroupPayload): Promise<LinkGroup> {
  return apiPut(`/api/groups/${id}`, payload);
}

export function deleteGroup(id: string): Promise<{ message: string }> {
  return apiDelete(`/api/groups/${id}`);
}
