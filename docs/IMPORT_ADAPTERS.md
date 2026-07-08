# Import Adapters

Importers live in `apps/worker/src/importers/` and implement the shared `ImportAdapter` interface.

```ts
export interface ImportAdapter {
  source: string;
  detect(input: unknown): boolean;
  parse(input: unknown): Promise<NormalizedImportItem[]>;
  validate(item: NormalizedImportItem): ImportValidationResult;
}
```

## Current Adapters

| Adapter | File | Formats |
|---------|------|---------|
| Shlink | `apps/worker/src/importers/shlink.ts` | JSON, JSONL, CSV, API pull |
| Sink | `apps/worker/src/importers/platforms.ts` | JSON, JSONL |
| YOURLS | `apps/worker/src/importers/platforms.ts` | JSON, JSONL |
| Dub | `apps/worker/src/importers/platforms.ts` | JSON, JSONL |
| Linkora backup | `apps/worker/src/importers/platforms.ts` | `backup.json` |
| Generic CSV | `apps/worker/src/importers/generic.ts` | CSV |
| Generic JSON | `apps/worker/src/importers/generic.ts` | JSON, JSONL-style newline objects, wrapped arrays |

Adapters are registered in `apps/worker/src/routes/importRoutes.ts`.

## Generic Field Mapping

Generic CSV and JSON import can accept a `fieldMapping` object in preview and confirm requests. Mapping keys use `NormalizedImportItem` fields such as `slug`, `longUrl`, `title`, `tags`, `createdAt`, `expiresAt`, and `maxClicks`; values are source column or property names.

Example:

```json
{
  "slug": "Code",
  "longUrl": "Destination",
  "title": "Name",
  "tags": "Labels"
}
```

The generic adapter still falls back to built-in aliases such as `code`, `alias`, `destination`, `url`, `labels`, and `categories`.

## Adding an Adapter

1. Create `apps/worker/src/importers/<source>.ts`.
2. Normalize input into `NormalizedImportItem`.
3. Validate URL and slug safety.
4. Register the adapter in `importRoutes.ts`.
5. Add source selection in `apps/admin/src/pages/ImportExport.tsx`.
6. Add tests or at least local preview/confirm smoke checks.

## Conflict Rules

- Default slug conflict strategy is `skip`.
- `rename` appends a suffix to conflicting slugs.
- `overwrite` updates existing links and should be used only after reviewing the pre-import backup.
- Do not overwrite existing links unless the user explicitly selects `overwrite`.
- Do not make KV the source of truth.
- Import confirmation writes links through `src/db/index.ts`.
- Imported active links are cached after D1 writes succeed.
