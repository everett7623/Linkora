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

| Adapter         | File                                     | Formats                                           |
| --------------- | ---------------------------------------- | ------------------------------------------------- |
| Shlink          | `apps/worker/src/importers/shlink.ts`    | JSON, JSONL, CSV, API pull                        |
| Sink            | `apps/worker/src/importers/platforms.ts` | JSON, JSONL                                       |
| YOURLS          | `apps/worker/src/importers/platforms.ts` | JSON, JSONL                                       |
| Dub             | `apps/worker/src/importers/platforms.ts` | JSON, JSONL                                       |
| Linketry backup | `apps/worker/src/importers/platforms.ts` | `backup.json`                                     |
| Generic CSV     | `apps/worker/src/importers/generic.ts`   | CSV                                               |
| Generic JSON    | `apps/worker/src/importers/generic.ts`   | JSON, JSONL-style newline objects, wrapped arrays |

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

## Candidate Adapters

The v0.28.0 migration plan prioritizes platforms with a current official export contract. Bitly and Short.io are the first file-import targets; Rebrandly follows as a JSON/API target after its pagination and payload are verified against a redacted response.

| Candidate | Status                   | Requirement before implementation                                         |
| --------- | ------------------------ | ------------------------------------------------------------------------- |
| Bitly     | Planned for v0.28.0      | Redacted CSV fixture matching the current documented export columns       |
| Short.io  | Planned for v0.28.0      | Redacted CSV fixture covering domain, path, tags, timestamps, and expiry  |
| Rebrandly | Planned phase 2          | Redacted JSON/API fixture plus verified pagination and credential handling |
| Kutt      | Fixture-gated            | Current official export or API payload contract                           |
| TinyURL   | Deferred to Generic      | Current official export contract and representative account export       |
| BL.INK    | Deferred to Generic      | Current official export contract and representative account export       |
| Cuttly    | Deferred to Generic      | Current official export contract and representative account export       |

Do not infer a production field contract from an old planning table or a platform name. Before implementation, collect representative current exports, record format/version details, confirm how custom domains and click totals are represented, and define fixtures that contain no credentials or personal data.

Prioritize adapters based on user migration demand and maintainability. A platform-specific adapter should provide more reliable normalization than the Generic importer; otherwise, document a Generic field mapping instead.

The detailed acceptance checklist is tracked in `.codex/tasks/mainstream-import-adapters-2026-07-20.md`.

## Adding an Adapter

1. Create `apps/worker/src/importers/<source>.ts`.
2. Normalize input into `NormalizedImportItem`.
3. Validate URL and slug safety.
4. Register the adapter in `importRoutes.ts`.
5. Add source selection in `apps/admin/src/pages/ImportExport.tsx`.
6. Add tests or at least local preview/confirm smoke checks.

Adapter acceptance also requires:

- representative redacted fixtures;
- detection that does not claim unrelated Generic payloads;
- preview counts for valid, conflict, and invalid rows;
- skip, rename, and overwrite coverage;
- preservation of source slug and short domain when the source provides them;
- bounded asynchronous confirmation for large files;
- downloadable failure reporting.

## Conflict Rules

- Default slug conflict strategy is `skip`.
- `rename` appends a suffix to conflicting slugs.
- `overwrite` updates existing links and should be used only after reviewing the pre-import backup.
- Do not overwrite existing links unless the user explicitly selects `overwrite`.
- Do not make KV the source of truth.
- Import confirmation writes links through `src/db/index.ts`.
- Imported active links are cached after D1 writes succeed.
