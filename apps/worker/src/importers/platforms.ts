import type { ImportAdapter, ImportValidationResult, Link, NormalizedImportItem, Tag } from '@linkora/shared';
import { validateLongUrl, validateSlug } from '@linkora/shared';

interface SourceRow {
  [key: string]: unknown;
}

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function asNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(/[,|;]/).map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function rowsFromJson(input: unknown, keys: string[] = ['data', 'links', 'shortUrls']): SourceRow[] {
  if (Array.isArray(input)) return input as SourceRow[];
  if (typeof input !== 'object' || input === null) return [];

  const obj = input as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key] as SourceRow[];
  }
  return [obj as SourceRow];
}

function parseJsonish(input: unknown): unknown {
  if (typeof input !== 'string') return input;
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (trimmed.includes('\n') && trimmed.startsWith('{')) {
    const rows = trimmed.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line) as SourceRow; } catch { return null; }
      })
      .filter((row): row is SourceRow => row !== null);
    if (rows.length > 0) return rows;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return [];
  }
}

function validateImportItem(item: NormalizedImportItem): ImportValidationResult {
  const errors: string[] = [];
  const slugResult = validateSlug(item.slug);
  if (!slugResult.valid) errors.push(`Invalid slug: ${slugResult.error}`);
  const urlResult = validateLongUrl(item.longUrl);
  if (!urlResult.valid) errors.push(`Invalid URL: ${urlResult.error}`);
  return { valid: errors.length === 0, errors };
}

function makeAdapter(
  source: string,
  detectKeys: string[],
  normalize: (row: SourceRow) => NormalizedImportItem,
  containerKeys?: string[]
): ImportAdapter {
  return {
    source,

    detect(input: unknown): boolean {
      const parsed = parseJsonish(input);
      const rows = rowsFromJson(parsed, containerKeys);
      if (rows.length === 0) return false;
      return detectKeys.some((key) => rows.some((row) => row[key] !== undefined));
    },

    async parse(input: unknown): Promise<NormalizedImportItem[]> {
      const parsed = parseJsonish(input);
      return rowsFromJson(parsed, containerKeys).map(normalize);
    },

    validate: validateImportItem,
  };
}

export const SinkAdapter = makeAdapter(
  'sink',
  ['slug', 'key', 'url', 'target', 'longUrl'],
  (row) => ({
    slug: asString(row.slug ?? row.key) ?? '',
    longUrl: asString(row.url ?? row.target ?? row.longUrl) ?? '',
    title: asString(row.title),
    tags: asTags(row.tags),
    clicks: asNumber(row.clicks ?? row.count),
    createdAt: asString(row.createdAt ?? row.created_at),
    updatedAt: asString(row.updatedAt ?? row.updated_at),
    source: 'sink',
    sourceId: asString(row.id ?? row.slug ?? row.key),
    raw: row,
  })
);

export const YourlsAdapter = makeAdapter(
  'yourls',
  ['keyword', 'url', 'timestamp'],
  (row) => ({
    slug: asString(row.keyword) ?? '',
    longUrl: asString(row.url) ?? '',
    title: asString(row.title),
    tags: asTags(row.tags),
    clicks: asNumber(row.clicks),
    createdAt: asString(row.timestamp),
    source: 'yourls',
    sourceId: asString(row.keyword),
    raw: row,
  })
);

export const DubAdapter = makeAdapter(
  'dub',
  ['key', 'url', 'shortLink'],
  (row) => ({
    slug: asString(row.key) ?? '',
    longUrl: asString(row.url) ?? '',
    shortUrl: asString(row.shortLink),
    title: asString(row.title),
    tags: asTags(row.tags),
    clicks: asNumber(row.clicks),
    createdAt: asString(row.createdAt ?? row.created_at),
    updatedAt: asString(row.updatedAt ?? row.updated_at),
    source: 'dub',
    sourceId: asString(row.id ?? row.key),
    raw: row,
  })
);

function normalizeBackupLink(row: SourceRow): NormalizedImportItem {
  const link = row as Partial<Link>;
  return {
    slug: asString(link.slug) ?? '',
    longUrl: asString(link.long_url) ?? '',
    shortUrl: asString(link.short_url),
    title: asString(link.title),
    description: asString(link.description),
    tags: asTags(link.tags ? safeJsonParse(link.tags) ?? link.tags : undefined),
    clicks: asNumber(link.clicks),
    createdAt: asString(link.created_at),
    updatedAt: asString(link.updated_at),
    lastClickedAt: asString(link.last_clicked_at),
    source: asString(link.source) ?? 'linkora-backup',
    sourceId: asString(link.source_id ?? link.id),
    status: link.status,
    redirectType: link.redirect_type,
    expiresAt: link.expires_at,
    maxClicks: link.max_clicks,
    warningEnabled: link.warning_enabled === 1,
    fallbackUrl: link.fallback_url,
    archived: link.archived,
    raw: row,
  };
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

export const LinkoraBackupAdapter: ImportAdapter = {
  source: 'linkora-backup',

  detect(input: unknown): boolean {
    const parsed = parseJsonish(input);
    if (typeof parsed !== 'object' || parsed === null) return false;
    const obj = parsed as Record<string, unknown>;
    return obj.name === 'Linkora Backup' && Array.isArray(obj.links);
  },

  async parse(input: unknown): Promise<NormalizedImportItem[]> {
    const parsed = parseJsonish(input);
    if (typeof parsed !== 'object' || parsed === null) return [];
    const links = (parsed as { links?: unknown }).links;
    return Array.isArray(links) ? (links as SourceRow[]).map(normalizeBackupLink) : [];
  },

  validate: validateImportItem,
};

export function extractLinkoraBackupTags(input: unknown): Tag[] {
  const parsed = parseJsonish(input);
  if (typeof parsed !== 'object' || parsed === null) return [];
  const tags = (parsed as { tags?: unknown }).tags;
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => tag as Partial<Tag>)
    .filter((tag) => asString(tag.name))
    .map((tag) => ({
      id: asString(tag.id) ?? asString(tag.name)!,
      name: asString(tag.name)!,
      color: tag.color ?? null,
      description: tag.description ?? null,
      created_at: asString(tag.created_at) ?? new Date().toISOString(),
      updated_at: asString(tag.updated_at) ?? new Date().toISOString(),
    }));
}
