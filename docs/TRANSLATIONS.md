# Contributing Admin Translations

Linketry ships reviewed English (`en`) and Simplified Chinese (`zh-CN`) Admin catalogs. Additional languages are welcome through focused pull requests, but incomplete or machine-generated catalogs are not enabled by default.

This guide covers the React Admin only. Public redirect and status pages are maintained separately in the Worker so translation work cannot accidentally change redirect behavior.

## Add a locale

1. Add the locale to every catalog in `apps/admin/src/i18n/*Messages.ts` and to the root catalog assembled in `apps/admin/src/i18n/messages.ts`.
2. Register its code, native-language name, HTML language tag, and text direction in `apps/admin/src/i18n/locales.ts`.
3. Translate every English message key. Preserve product names, protocol fields, environment-variable names, URLs, and code snippets when they should remain literal.
4. Preserve interpolation placeholders exactly. For example, a translation of `Updated to {version}` must still contain `{version}`.
5. Run the locale gate and the Admin build before opening a pull request.

```bash
npm run test:i18n --workspace=apps/admin
npm run build --workspace=apps/admin
```

The locale gate fails when a registered locale is missing a catalog, when message keys differ from English, when a value is empty, or when interpolation placeholders change. The TypeScript registry also requires metadata for every locale assembled by `messages.ts`.

## Review checklist

- Use the locale's native name in the language selector.
- Prefer natural product language over word-for-word translation.
- Keep destructive-action warnings and authentication guidance unambiguous.
- Verify navigation, dialogs, empty states, errors, tables, and narrow layouts for clipping.
- Switch languages, reload the Admin, and confirm the selected locale persists.
- Do not translate user data, dynamic API values, short-link slugs, or target URLs.
- Do not add third-party translation scripts or runtime requests; catalogs ship with the Admin bundle.

## Scope and fallback

English is the default and fallback for unknown or stale browser values. Linketry only exposes locales that have a complete reviewed catalog and registered metadata. Adding a locale does not change Worker APIs, D1/KV data, analytics, or redirect behavior.
