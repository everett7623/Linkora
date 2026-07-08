import { apiPost } from './client';
import type { LinkSuggestionResult } from '@linkora/shared';

export interface PageTitleResult {
  title: string;
  final_url: string;
}

export function fetchPageTitle(url: string): Promise<PageTitleResult> {
  return apiPost('/api/metadata/title', { url });
}

export function fetchLinkSuggestions(url: string): Promise<LinkSuggestionResult> {
  return apiPost('/api/metadata/suggestions', { url });
}
