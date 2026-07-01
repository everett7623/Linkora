import type { ImportAdapter, NormalizedImportItem, ImportValidationResult } from '@linkora/shared';
import { validateSlug, validateLongUrl } from '@linkora/shared';

interface GenericRow {
  slug?: string;
  short_code?: string;
  shortCode?: string;
  key?: string;
  long_url?: string;
  longUrl?: string;
  url?: string;
  target?: string;
  short_url?: string;
  shortUrl?: string;
  title?: string;
  description?: string;
  tags?: string | string[];
  clicks?: number | string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  last_clicked_at?: string;
  lastClickedAt?: string;
  [key: string]: unknown;
}

function normalizeGenericRow(row: GenericRow): NormalizedImportItem {
  const slug =
    row.slug ??
    row.short_code ??
    row.shortCode ??
    row.key ??
    '';

  const longUrl =
    row.long_url ??
    row.longUrl ??
    row.url ??
    row.target ??
    '';

  const tags: string[] = Array.isArray(row.tags)
    ? row.tags.map(String)
    : typeof row.tags === 'string'
    ? row.tags.split(/[,|;]/).map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    slug: String(slug),
    longUrl: String(longUrl),
    shortUrl: row.short_url ?? row.shortUrl ?? undefined,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    tags,
    clicks: row.clicks !== undefined ? parseInt(String(row.clicks), 10) || 0 : undefined,
    createdAt: row.created_at ?? row.createdAt ?? undefined,
    updatedAt: row.updated_at ?? row.updatedAt ?? undefined,
    lastClickedAt: row.last_clicked_at ?? row.lastClickedAt ?? undefined,
    source: 'generic',
    raw: row,
  };
}

function parseGenericCsv(input: string): NormalizedImportItem[] {
  const lines = input.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const items: NormalizedImportItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: GenericRow = {};
    headers.forEach((h, idx) => {
      (row as Record<string, unknown>)[h] = cols[idx] ?? '';
    });
    items.push(normalizeGenericRow(row));
  }

  return items;
}

export const GenericCsvAdapter: ImportAdapter = {
  source: 'generic-csv',

  detect(input: unknown): boolean {
    if (typeof input !== 'string') return false;
    const trimmed = input.trim();
    return !trimmed.startsWith('{') && !trimmed.startsWith('[') && trimmed.includes(',');
  },

  async parse(input: unknown): Promise<NormalizedImportItem[]> {
    if (typeof input !== 'string') return [];
    return parseGenericCsv(input);
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

export const GenericJsonAdapter: ImportAdapter = {
  source: 'generic-json',

  detect(input: unknown): boolean {
    if (Array.isArray(input)) return true;
    if (typeof input === 'string') {
      const trimmed = input.trim();
      return trimmed.startsWith('[') || trimmed.startsWith('{');
    }
    return false;
  },

  async parse(input: unknown): Promise<NormalizedImportItem[]> {
    let items: GenericRow[] = [];

    if (typeof input === 'string') {
      const trimmed = input.trim();
      try {
        if (trimmed.startsWith('[')) {
          items = JSON.parse(trimmed) as GenericRow[];
        } else if (trimmed.startsWith('{')) {
          // Could be JSONL
          if (trimmed.includes('\n')) {
            const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
            items = lines.map((l) => {
              try { return JSON.parse(l) as GenericRow; } catch { return null; }
            }).filter((x): x is GenericRow => x !== null);
          } else {
            const obj = JSON.parse(trimmed) as Record<string, unknown>;
            if (Array.isArray(obj.data)) items = obj.data as GenericRow[];
            else if (Array.isArray(obj.links)) items = obj.links as GenericRow[];
            else items = [obj as GenericRow];
          }
        }
      } catch {
        return [];
      }
    } else if (Array.isArray(input)) {
      items = input as GenericRow[];
    }

    return items.map(normalizeGenericRow);
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
