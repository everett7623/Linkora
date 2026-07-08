import type { ImportAdapter, ImportFieldMapping, NormalizedImportItem, ImportValidationResult } from '@linkora/shared';
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

interface GenericWrappedInput {
  input: unknown;
  fieldMapping?: ImportFieldMapping;
}

const FIELD_ALIASES: Record<string, string[]> = {
  slug: ['slug', 'short_code', 'shortCode', 'short code', 'code', 'key', 'keyword', 'alias', 'path'],
  longUrl: ['long_url', 'longUrl', 'long url', 'url', 'target', 'target_url', 'destination', 'destination_url', 'original_url', 'link'],
  shortUrl: ['short_url', 'shortUrl', 'short url'],
  title: ['title', 'name', 'label'],
  description: ['description', 'desc', 'notes', 'note'],
  tags: ['tags', 'tag', 'labels', 'categories'],
  clicks: ['clicks', 'visits', 'visit_count', 'count', 'total_clicks'],
  createdAt: ['created_at', 'createdAt', 'created at', 'dateCreated', 'created'],
  updatedAt: ['updated_at', 'updatedAt', 'updated at', 'modified_at', 'updated'],
  lastClickedAt: ['last_clicked_at', 'lastClickedAt', 'last clicked at', 'last_visit_at'],
  status: ['status', 'state'],
  redirectType: ['redirect_type', 'redirectType', 'redirect type', 'type', 'http_status'],
  expiresAt: ['expires_at', 'expiresAt', 'expires at', 'expiration', 'expires'],
  maxClicks: ['max_clicks', 'maxClicks', 'max clicks', 'click_limit'],
  warningEnabled: ['warning_enabled', 'warningEnabled', 'warning', 'safety_warning'],
  source: ['source', 'provider'],
  sourceId: ['source_id', 'sourceId', 'source id', 'external_id', 'id'],
  passwordHash: ['password_hash', 'passwordHash'],
};

function unwrapGenericInput(input: unknown): GenericWrappedInput {
  if (typeof input === 'object' && input !== null && 'input' in input) {
    const wrapped = input as GenericWrappedInput;
    return {
      input: wrapped.input,
      fieldMapping: wrapped.fieldMapping,
    };
  }

  return { input };
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/^\uFEFF/, '').replace(/[^a-z0-9]/g, '');
}

function readMappedValue(row: GenericRow, field: string, mapping?: ImportFieldMapping): unknown {
  const mapped = mapping?.[field as keyof NormalizedImportItem];
  const candidates = [
    ...(Array.isArray(mapped) ? mapped : mapped ? [mapped] : []),
    ...(FIELD_ALIASES[field] ?? []),
  ];

  const entries = Object.entries(row);
  for (const candidate of candidates) {
    const direct = row[candidate];
    if (direct !== undefined) return direct;

    const normalized = normalizeHeader(candidate);
    const found = entries.find(([key]) => normalizeHeader(key) === normalized);
    if (found) return found[1];
  }

  return undefined;
}

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function asNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(text)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(text)) return false;
  return undefined;
}

function asTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,|;]/).map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function asRedirectType(value: unknown): 301 | 302 | undefined {
  const parsed = asNumber(value);
  return parsed === 301 || parsed === 302 ? parsed : undefined;
}

function asStatus(value: unknown): NormalizedImportItem['status'] | undefined {
  const text = asString(value);
  return text === 'active' || text === 'disabled' || text === 'expired' || text === 'archived'
    ? text
    : undefined;
}

function normalizeGenericRow(row: GenericRow, mapping?: ImportFieldMapping): NormalizedImportItem {
  const slug = asString(readMappedValue(row, 'slug', mapping)) ?? '';
  const longUrl = asString(readMappedValue(row, 'longUrl', mapping)) ?? '';
  const clicks = asNumber(readMappedValue(row, 'clicks', mapping));

  return {
    slug,
    longUrl,
    shortUrl: asString(readMappedValue(row, 'shortUrl', mapping)),
    title: asString(readMappedValue(row, 'title', mapping)),
    description: asString(readMappedValue(row, 'description', mapping)),
    tags: asTags(readMappedValue(row, 'tags', mapping)),
    clicks,
    createdAt: asString(readMappedValue(row, 'createdAt', mapping)),
    updatedAt: asString(readMappedValue(row, 'updatedAt', mapping)),
    lastClickedAt: asString(readMappedValue(row, 'lastClickedAt', mapping)),
    source: asString(readMappedValue(row, 'source', mapping)) ?? 'generic',
    sourceId: asString(readMappedValue(row, 'sourceId', mapping)),
    status: asStatus(readMappedValue(row, 'status', mapping)),
    redirectType: asRedirectType(readMappedValue(row, 'redirectType', mapping)),
    expiresAt: asString(readMappedValue(row, 'expiresAt', mapping)) ?? null,
    maxClicks: asNumber(readMappedValue(row, 'maxClicks', mapping)) ?? null,
    passwordHash: asString(readMappedValue(row, 'passwordHash', mapping)) ?? null,
    warningEnabled: asBoolean(readMappedValue(row, 'warningEnabled', mapping)),
    raw: row,
  };
}

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i++;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      cols.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  cols.push(current.trim());
  return cols;
}

function parseGenericCsv(input: string, mapping?: ImportFieldMapping): NormalizedImportItem[] {
  const lines = input.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''));
  const items: NormalizedImportItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]).map((c) => c.replace(/^"|"$/g, ''));
    const row: GenericRow = {};
    headers.forEach((h, idx) => {
      (row as Record<string, unknown>)[h] = cols[idx] ?? '';
    });
    items.push(normalizeGenericRow(row, mapping));
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
    const { input: rawInput, fieldMapping } = unwrapGenericInput(input);
    if (typeof rawInput !== 'string') return [];
    return parseGenericCsv(rawInput, fieldMapping);
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
    if (typeof input === 'object' && input !== null) {
      const obj = input as Record<string, unknown>;
      return Array.isArray(obj.data) || Array.isArray(obj.links) || Array.isArray(obj.items) || Array.isArray(obj.records);
    }
    return false;
  },

  async parse(input: unknown): Promise<NormalizedImportItem[]> {
    const { input: rawInput, fieldMapping } = unwrapGenericInput(input);
    let items: GenericRow[] = [];

    if (typeof rawInput === 'string') {
      const trimmed = rawInput.trim();
      try {
        if (trimmed.startsWith('[')) {
          items = JSON.parse(trimmed) as GenericRow[];
        } else if (trimmed.startsWith('{')) {
          const obj = JSON.parse(trimmed) as Record<string, unknown>;
          if (Array.isArray(obj.data)) items = obj.data as GenericRow[];
          else if (Array.isArray(obj.links)) items = obj.links as GenericRow[];
          else if (Array.isArray(obj.items)) items = obj.items as GenericRow[];
          else if (Array.isArray(obj.records)) items = obj.records as GenericRow[];
          else if (obj.data && typeof obj.data === 'object' && Array.isArray((obj.data as Record<string, unknown>).items)) {
            items = (obj.data as { items: GenericRow[] }).items;
          } else {
            items = [obj as GenericRow];
          }
        }
      } catch {
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        items = lines.map((l) => {
          try { return JSON.parse(l) as GenericRow; } catch { return null; }
        }).filter((x): x is GenericRow => x !== null);
      }
    } else if (Array.isArray(rawInput)) {
      items = rawInput as GenericRow[];
    } else if (typeof rawInput === 'object' && rawInput !== null) {
      const obj = rawInput as Record<string, unknown>;
      if (Array.isArray(obj.data)) items = obj.data as GenericRow[];
      else if (Array.isArray(obj.links)) items = obj.links as GenericRow[];
      else if (Array.isArray(obj.items)) items = obj.items as GenericRow[];
      else if (Array.isArray(obj.records)) items = obj.records as GenericRow[];
      else items = [obj as GenericRow];
    }

    return items.map((item) => normalizeGenericRow(item, fieldMapping));
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
