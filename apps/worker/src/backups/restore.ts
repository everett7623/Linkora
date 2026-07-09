import type { Backup, ImportAdapter, Link, NormalizedImportItem, RedirectRule, Tag } from '@linkora/shared';
import type { Env } from '../types';
import {
  createLink,
  createTagsIfMissing,
  getExistingSlugs,
  getLinkBySlug,
  updateLink,
} from '../db/index';
import {
  extractLinkoraBackupRedirectRules,
  extractLinkoraBackupTags,
  LinkoraBackupAdapter,
} from '../importers/platforms';
import { generateId, now } from '../utils/id';
import {
  backupLinkIdFromItem,
  csvRow,
  deleteRestoredCache,
  linkFromBackupItem,
  overwriteFieldsFromBackupItem,
  restoreBackupRedirectRules,
  syncRestoredCache,
} from './restoreHelpers';

export type RestoreConflictStrategy = 'skip' | 'rename' | 'overwrite';
type RestoreAction = 'create' | 'overwrite' | 'rename' | 'skip' | 'invalid';

export interface BackupRestorePreview {
  backup: {
    exportedAt?: string;
    version?: string;
    links: number;
    tags: number;
    redirectRules: number;
  };
  conflictStrategy: RestoreConflictStrategy;
  total: number;
  valid: number;
  invalid: number;
  conflicts: number;
  willCreate: number;
  willOverwrite: number;
  willRename: number;
  willSkip: number;
  redirectRulesToRestore: number;
  preview: Array<{
    slug: string;
    title?: string | null;
    longUrl: string;
    valid: boolean;
    errors: string[];
    conflict: boolean;
    action: RestoreAction;
    nextSlug?: string;
  }>;
}

export interface BackupRestoreResult extends BackupRestorePreview {
  mode: 'restore';
  preRestoreBackup?: Backup;
  restoredAt: string;
  created: number;
  overwritten: number;
  renamed: number;
  skipped: number;
  failed: number;
  redirectRulesRestored: number;
  report: string;
}

interface PlannedRestoreItem {
  item: NormalizedImportItem;
  valid: boolean;
  errors: string[];
  conflict: boolean;
  action: RestoreAction;
  nextSlug?: string;
}

export function parseRestoreConflictStrategy(value: unknown): RestoreConflictStrategy {
  return value === 'rename' || value === 'overwrite' ? value : 'skip';
}

export async function previewBackupRestore(
  env: Env,
  payload: unknown,
  conflictStrategy: RestoreConflictStrategy
): Promise<BackupRestorePreview> {
  const { items, tags, redirectRules } = await parseBackupPayload(payload);
  const actions = await planRestoreActions(env, items, LinkoraBackupAdapter, conflictStrategy);
  return buildPreview(payload, items.length, tags.length, redirectRules.length, conflictStrategy, actions);
}

export async function restoreBackupPayload(
  env: Env,
  payload: unknown,
  requestDomain: string,
  conflictStrategy: RestoreConflictStrategy,
  preRestoreBackup?: Backup
): Promise<BackupRestoreResult> {
  const { items, tags, redirectRules } = await parseBackupPayload(payload);
  const actions = await planRestoreActions(env, items, LinkoraBackupAdapter, conflictStrategy);
  const ts = now();
  const reportRows = ['slug,action,status,reason'];
  const linkIdByBackupId = new Map<string, string>();
  const replaceRuleLinkIds = new Set<string>();
  let created = 0;
  let overwritten = 0;
  let renamed = 0;
  let skipped = 0;
  let failed = 0;

  if (tags.length > 0) await createTagsIfMissing(env, tags);

  for (const planned of actions) {
    const item = planned.item;
    if (!planned.valid) {
      failed++;
      reportRows.push(csvRow(item.slug, 'invalid', 'failed', planned.errors.join('; ')));
      continue;
    }

    if (planned.action === 'skip') {
      skipped++;
      reportRows.push(csvRow(item.slug, 'skip', 'skipped', planned.conflict ? 'slug already exists' : 'not selected'));
      continue;
    }

    try {
      if (planned.action === 'overwrite') {
        const existing = await getLinkBySlug(env, item.slug);
        if (!existing) {
          failed++;
          reportRows.push(csvRow(item.slug, 'overwrite', 'failed', 'conflicting link disappeared before restore'));
          continue;
        }
        const fields = overwriteFieldsFromBackupItem(item, existing, ts);
        await deleteRestoredCache(env, requestDomain, existing);
        await updateLink(env, existing.id, fields);
        await syncRestoredCache(env, requestDomain, { ...existing, ...fields } as Link);
        const backupLinkId = backupLinkIdFromItem(item);
        if (backupLinkId) {
          linkIdByBackupId.set(backupLinkId, existing.id);
          replaceRuleLinkIds.add(existing.id);
        }
        overwritten++;
        reportRows.push(csvRow(item.slug, 'overwrite', 'success', ''));
        continue;
      }

      const slug = planned.nextSlug ?? item.slug;
      const link = linkFromBackupItem(item, generateId(), slug, requestDomain, ts);
      await createLink(env, link);
      await syncRestoredCache(env, requestDomain, link);
      const backupLinkId = backupLinkIdFromItem(item);
      if (backupLinkId) linkIdByBackupId.set(backupLinkId, link.id);
      if (planned.action === 'rename') renamed++;
      else created++;
      reportRows.push(csvRow(item.slug, planned.action, 'success', planned.action === 'rename' ? slug : ''));
    } catch (error) {
      failed++;
      reportRows.push(csvRow(item.slug, planned.action, 'failed', error instanceof Error ? error.message : String(error)));
    }
  }

  const redirectRulesRestored = await restoreBackupRedirectRules(env, redirectRules, linkIdByBackupId, replaceRuleLinkIds, ts);
  const preview = buildPreview(payload, items.length, tags.length, redirectRules.length, conflictStrategy, actions);
  return {
    ...preview,
    mode: 'restore',
    preRestoreBackup,
    restoredAt: ts,
    created,
    overwritten,
    renamed,
    skipped,
    failed,
    redirectRulesRestored,
    report: reportRows.join('\n'),
  };
}

async function parseBackupPayload(payload: unknown): Promise<{
  items: NormalizedImportItem[];
  tags: Tag[];
  redirectRules: RedirectRule[];
}> {
  if (!LinkoraBackupAdapter.detect(payload)) throw new Error('Invalid Linkora backup payload');
  return {
    items: await LinkoraBackupAdapter.parse(payload),
    tags: extractLinkoraBackupTags(payload),
    redirectRules: extractLinkoraBackupRedirectRules(payload),
  };
}

async function planRestoreActions(
  env: Env,
  items: NormalizedImportItem[],
  adapter: ImportAdapter,
  conflictStrategy: RestoreConflictStrategy
): Promise<PlannedRestoreItem[]> {
  const validSlugs = items.filter((item) => adapter.validate(item).valid).map((item) => item.slug);
  const existingSlugs = await getExistingSlugs(env, validSlugs);
  const reservedSlugs = new Set(existingSlugs);

  return items.map((item) => {
    const validation = adapter.validate(item);
    if (!validation.valid) return { item, valid: false, errors: validation.errors, conflict: false, action: 'invalid' };

    const conflict = existingSlugs.has(item.slug);
    if (conflict && conflictStrategy === 'skip') return { item, valid: true, errors: [], conflict, action: 'skip' };
    if (conflict && conflictStrategy === 'overwrite') return { item, valid: true, errors: [], conflict, action: 'overwrite' };
    if (conflict && conflictStrategy === 'rename') {
      const nextSlug = makeUniqueSlug(item.slug, reservedSlugs);
      reservedSlugs.add(nextSlug);
      return { item, valid: true, errors: [], conflict, action: 'rename', nextSlug };
    }

    reservedSlugs.add(item.slug);
    return { item, valid: true, errors: [], conflict, action: 'create' };
  });
}

function buildPreview(
  payload: unknown,
  links: number,
  tags: number,
  redirectRules: number,
  conflictStrategy: RestoreConflictStrategy,
  actions: PlannedRestoreItem[]
): BackupRestorePreview {
  return {
    backup: backupSummary(payload, links, tags, redirectRules),
    conflictStrategy,
    total: actions.length,
    valid: actions.filter((item) => item.valid).length,
    invalid: actions.filter((item) => !item.valid).length,
    conflicts: actions.filter((item) => item.conflict).length,
    willCreate: actions.filter((item) => item.action === 'create').length,
    willOverwrite: actions.filter((item) => item.action === 'overwrite').length,
    willRename: actions.filter((item) => item.action === 'rename').length,
    willSkip: actions.filter((item) => item.action === 'skip').length,
    redirectRulesToRestore: redirectRules,
    preview: actions.slice(0, 200).map((item) => ({
      slug: item.item.slug,
      title: item.item.title ?? null,
      longUrl: item.item.longUrl,
      valid: item.valid,
      errors: item.errors,
      conflict: item.conflict,
      action: item.action,
      nextSlug: item.nextSlug,
    })),
  };
}

function backupSummary(payload: unknown, links: number, tags: number, redirectRules: number): BackupRestorePreview['backup'] {
  const obj = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {};
  return {
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : undefined,
    version: typeof obj.version === 'string' ? obj.version : undefined,
    links,
    tags,
    redirectRules,
  };
}

function makeUniqueSlug(slug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(slug)) return slug;
  const base = slug.slice(0, 94);
  for (let i = 2; i < 10000; i++) {
    const candidate = `${base}-${i}`;
    if (!existingSlugs.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
