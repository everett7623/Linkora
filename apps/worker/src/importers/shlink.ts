import type { ImportAdapter, NormalizedImportItem, ImportValidationResult } from '@linkora/shared';
import { validateSlug, validateLongUrl } from '@linkora/shared';

interface ShlinkJsonItem {
  shortCode?: string;
  shortUrl?: string;
  longUrl?: string;
  title?: string;
  tags?: string[];
  dateCreated?: string;
  visitsSummary?: { total?: number };
  id?: string;
}

function parseShlinkJson(input: unknown): NormalizedImportItem[] {
  const data = input as Record<string, unknown>;

  // Shlink export: { data: { shortUrls: { data: [...] } } }
  let items: ShlinkJsonItem[] = [];

  if (Array.isArray(input)) {
    items = input as ShlinkJsonItem[];
  } else if (data?.data && typeof data.data === 'object') {
    const d = data.data as Record<string, unknown>;
    if (Array.isArray(d?.shortUrls)) {
      items = d.shortUrls as ShlinkJsonItem[];
    } else if (d?.shortUrls && typeof d.shortUrls === 'object') {
      const su = d.shortUrls as Record<string, unknown>;
      if (Array.isArray(su?.data)) {
        items = su.data as ShlinkJsonItem[];
      }
    }
  } else if (Array.isArray((data as { shortUrls?: unknown })?.shortUrls)) {
    items = (data as { shortUrls: ShlinkJsonItem[] }).shortUrls;
  }

  return items.map((item) => ({
    slug: item.shortCode ?? '',
    longUrl: item.longUrl ?? '',
    shortUrl: item.shortUrl,
    title: item.title,
    tags: Array.isArray(item.tags) ? item.tags : [],
    clicks: item.visitsSummary?.total ?? 0,
    createdAt: item.dateCreated,
    source: 'shlink',
    sourceId: item.shortCode,
    raw: item,
  }));
}

function parseShlinkJsonl(input: string): NormalizedImportItem[] {
  const lines = input.split('\n').filter((l) => l.trim().length > 0);
  const items: NormalizedImportItem[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as ShlinkJsonItem;
      items.push({
        slug: obj.shortCode ?? '',
        longUrl: obj.longUrl ?? '',
        shortUrl: obj.shortUrl,
        title: obj.title,
        tags: Array.isArray(obj.tags) ? obj.tags : [],
        clicks: obj.visitsSummary?.total ?? 0,
        createdAt: obj.dateCreated,
        source: 'shlink',
        sourceId: obj.shortCode,
        raw: obj,
      });
    } catch {
      // Skip invalid lines
    }
  }
  return items;
}

function parseShlinkCsv(input: string): NormalizedImportItem[] {
  const lines = input.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const items: NormalizedImportItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? '';
    });

    const slug = row['Short Code'] ?? row['shortCode'] ?? row['short_code'] ?? '';
    const longUrl = row['Long URL'] ?? row['longUrl'] ?? row['long_url'] ?? '';
    const title = row['Title'] ?? row['title'] ?? '';
    const tags = (row['Tags'] ?? row['tags'] ?? '').split('|').filter(Boolean);
    const clicks = parseInt(row['Visits'] ?? row['clicks'] ?? '0', 10) || 0;
    const createdAt = row['Created At'] ?? row['dateCreated'] ?? row['created_at'] ?? '';

    items.push({
      slug,
      longUrl,
      title: title || undefined,
      tags,
      clicks,
      createdAt: createdAt || undefined,
      source: 'shlink',
      sourceId: slug,
      raw: row,
    });
  }

  return items;
}

export const ShlinkAdapter: ImportAdapter = {
  source: 'shlink',

  detect(input: unknown): boolean {
    if (typeof input === 'string') {
      const trimmed = input.trim();
      // JSONL: first line is a JSON object with shortCode
      if (trimmed.startsWith('{')) {
        try {
          const obj = JSON.parse(trimmed.split('\n')[0]) as Record<string, unknown>;
          return 'shortCode' in obj || 'shortUrl' in obj;
        } catch {
          return false;
        }
      }
      // CSV with Shlink headers
      if (trimmed.toLowerCase().includes('short code') || trimmed.toLowerCase().includes('shortcode')) {
        return true;
      }
      return false;
    }
    if (typeof input === 'object' && input !== null) {
      const obj = input as Record<string, unknown>;
      if (obj.shortCode !== undefined) return true;
      if (obj.data && typeof obj.data === 'object') return true;
      if (Array.isArray(obj.shortUrls)) return true;
    }
    return false;
  },

  async parse(input: unknown): Promise<NormalizedImportItem[]> {
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed) as unknown;
          // Could be JSONL if first char is '{' but each line is separate
          if (trimmed.startsWith('{') && trimmed.includes('\n')) {
            return parseShlinkJsonl(trimmed);
          }
          return parseShlinkJson(parsed);
        } catch {
          // Try JSONL
          return parseShlinkJsonl(trimmed);
        }
      }
      return parseShlinkCsv(trimmed);
    }
    return parseShlinkJson(input);
  },

  validate(item: NormalizedImportItem): ImportValidationResult {
    const errors: string[] = [];
    const slugResult = validateSlug(item.slug);
    if (!slugResult.valid) errors.push(`Invalid slug: ${slugResult.error}`);
    const urlResult = validateLongUrl(item.longUrl);
    if (!urlResult.valid) errors.push(`Invalid URL: ${urlResult.error}`);
    return { valid: errors.length === 0, errors };
  },
};
