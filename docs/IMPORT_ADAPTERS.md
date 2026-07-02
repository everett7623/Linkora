# Import Adapters

Linkora uses a modular adapter system for importing data from various URL shortener platforms.

## Architecture

All adapters implement the `ImportAdapter` interface:

```typescript
interface ImportAdapter {
  source: string;
  detect(input: unknown): boolean;
  parse(input: unknown): Promise<NormalizedImportItem[]>;
  validate(item: NormalizedImportItem): ImportValidationResult;
}
```

Every imported item is normalized to:

```typescript
interface NormalizedImportItem {
  slug: string;
  longUrl: string;
  shortUrl?: string;
  title?: string;
  description?: string;
  tags?: string[];
  clicks?: number;
  createdAt?: string;
  updatedAt?: string;
  lastClickedAt?: string;
  source?: string;
  sourceId?: string;
  raw?: unknown;
}
```

## V1 Adapters

### Shlink Adapter

**Source**: `shlink`

**Formats**: JSON array, JSONL, CSV

**Field mapping**:

| Input | Output |
|-------|--------|
| `shortCode` | `slug` |
| `longUrl` | `longUrl` |
| `shortUrl` | `shortUrl` |
| `title` | `title` |
| `tags` | `tags` |
| `dateCreated` | `createdAt` |
| `visitsSummary.total` or `visitsCount` | `clicks` |

**Detection**: Looks for `shortCode` + `longUrl` fields.

### Generic CSV Adapter

**Source**: `csv`

**Formats**: Standard CSV with header row

**Field mapping**: Auto-maps common column names:

| CSV Header (case-insensitive) | Output |
|-------------------------------|--------|
| `slug`, `short_code`, `shortCode`, `code` | `slug` |
| `url`, `long_url`, `longUrl`, `destination`, `target` | `longUrl` |
| `title`, `name` | `title` |
| `tags` | `tags` (comma-separated → array) |
| `clicks`, `visits`, `hits` | `clicks` |
| `created`, `created_at`, `createdAt`, `date` | `createdAt` |

### Generic JSON Adapter

**Source**: `json`

**Formats**: JSON array of objects

**Field mapping**: Same auto-mapping logic as CSV but reads from object keys.

## V2 Planned Adapters

### Sink

| Input | Output |
|-------|--------|
| `slug` / `key` | `slug` |
| `url` / `target` / `longUrl` | `longUrl` |
| `title` | `title` |
| `tags` | `tags` |
| `clicks` | `clicks` |
| `createdAt` | `createdAt` |

### YOURLS

| Input | Output |
|-------|--------|
| `keyword` | `slug` |
| `url` | `longUrl` |
| `title` | `title` |
| `clicks` | `clicks` |
| `timestamp` | `createdAt` |

### Dub

| Input | Output |
|-------|--------|
| `key` | `slug` |
| `url` | `longUrl` |
| `shortLink` | `shortUrl` |
| `title` | `title` |
| `tags` | `tags` |
| `clicks` | `clicks` |
| `createdAt` | `createdAt` |

### Bitly

| Input | Output |
|-------|--------|
| `id` / `custom_bitlinks` | `slug` |
| `long_url` | `longUrl` |
| `link` | `shortUrl` |
| `title` | `title` |
| `created_at` | `createdAt` |

## Conflict Handling

### V1 Strategy

- **skip**: Conflicting slugs are skipped (default, safe)

### V2 Strategies (planned)

- **rename**: Auto-append suffix (e.g., `slug` → `slug-1`)
- **overwrite**: Replace existing link (requires confirmation)

## Writing a Custom Adapter

1. Create a new file in `apps/worker/src/importers/`
2. Implement the `ImportAdapter` interface
3. Register it in the import route handler

```typescript
import type { ImportAdapter, NormalizedImportItem, ImportValidationResult } from '@linkora/shared';

export const myAdapter: ImportAdapter = {
  source: 'my-platform',

  detect(input: unknown): boolean {
    // Return true if input matches expected format
  },

  async parse(input: unknown): Promise<NormalizedImportItem[]> {
    // Transform raw input into normalized items
  },

  validate(item: NormalizedImportItem): ImportValidationResult {
    // Validate individual items
  },
};
```
