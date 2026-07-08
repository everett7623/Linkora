import { Hono } from 'hono';
import type { Link, LinkGroup, LinkGroupType, Tag } from '@linkora/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  createTag,
  createTagsIfMissing,
  deleteTag,
  getAllLinkTagNames,
  getAllLinks,
  getAllTags,
  getTagById,
  getTagByName,
  removeTagFromLinks,
  renameTagInLinks,
  updateTag,
} from '../db/index';
import { recordAudit } from '../audit/index';
import { generateId, now } from '../utils/id';
import { jsonCreated, jsonError, jsonOk } from '../utils/response';

const groups = new Hono<{ Bindings: Env }>();

const GROUP_TYPES: LinkGroupType[] = ['campaign', 'project'];
const DEFAULT_COLORS: Record<LinkGroupType, string> = {
  campaign: '#38bdf8',
  project: '#a78bfa',
};

groups.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

groups.get('/', async (c) => {
  const type = parseGroupType(c.req.query('type'));
  if (c.req.query('type') && !type) return jsonError('type must be campaign or project', 400);

  await syncGroupTagsFromLinks(c.env);
  const [tags, links] = await Promise.all([getAllTags(c.env), getAllLinks(c.env)]);
  const items = buildGroups(tags, links).filter((group) => !type || group.type === type);

  return jsonOk({ items, total: items.length });
});

groups.post('/', async (c) => {
  let body: GroupBody;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = normalizeGroupPayload(body);
  if (parsed.error) return jsonError(parsed.error, 400);

  const tagName = groupTagName(parsed.value!.type, parsed.value!.name);
  const existing = await getTagByName(c.env, tagName);
  if (existing) return jsonError(`${parsed.value!.type} "${parsed.value!.name}" already exists`, 409);

  const ts = now();
  const tag: Tag = {
    id: generateId(),
    name: tagName,
    color: parsed.value!.color ?? DEFAULT_COLORS[parsed.value!.type],
    description: parsed.value!.description,
    created_at: ts,
    updated_at: ts,
  };

  await createTag(c.env, tag);
  await recordAudit(c.env, c.req.raw, 'group.create', 'group', tag.id, {
    type: parsed.value!.type,
    name: parsed.value!.name,
    tagName,
  });

  const group = tagToGroup(tag, [], parsed.value!.type, parsed.value!.name);
  return jsonCreated(group);
});

groups.put('/:id', async (c) => {
  const existing = await getTagById(c.env, c.req.param('id'));
  if (!existing) return jsonError('Group not found', 404);

  const existingMeta = parseGroupTag(existing.name);
  if (!existingMeta) return jsonError('Group not found', 404);

  let body: GroupBody;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = normalizeGroupPayload(body, existingMeta);
  if (parsed.error) return jsonError(parsed.error, 400);

  const nextTagName = groupTagName(parsed.value!.type, parsed.value!.name);
  const conflict = await getTagByName(c.env, nextTagName);
  if (conflict && conflict.id !== existing.id) {
    return jsonError(`${parsed.value!.type} "${parsed.value!.name}" already exists`, 409);
  }

  const updatedAt = now();
  await updateTag(c.env, existing.id, {
    name: nextTagName,
    color: parsed.value!.color,
    description: parsed.value!.description,
    updated_at: updatedAt,
  });

  if (nextTagName !== existing.name) {
    await renameTagInLinks(c.env, existing.name, nextTagName, updatedAt);
  }

  await recordAudit(c.env, c.req.raw, 'group.update', 'group', existing.id, {
    from: existing.name,
    to: nextTagName,
    type: parsed.value!.type,
    name: parsed.value!.name,
  });

  const updatedTag: Tag = {
    ...existing,
    name: nextTagName,
    color: parsed.value!.color,
    description: parsed.value!.description,
    updated_at: updatedAt,
  };
  const group = tagToGroup(updatedTag, await getAllLinks(c.env), parsed.value!.type, parsed.value!.name);
  return jsonOk(group);
});

groups.delete('/:id', async (c) => {
  const existing = await getTagById(c.env, c.req.param('id'));
  if (!existing) return jsonError('Group not found', 404);

  const meta = parseGroupTag(existing.name);
  if (!meta) return jsonError('Group not found', 404);

  const ts = now();
  await removeTagFromLinks(c.env, existing.name, ts);
  await deleteTag(c.env, existing.id);
  await recordAudit(c.env, c.req.raw, 'group.delete', 'group', existing.id, {
    type: meta.type,
    name: meta.name,
    tagName: existing.name,
  });

  return jsonOk({ message: 'Group deleted' });
});

interface GroupBody {
  type?: unknown;
  name?: unknown;
  color?: unknown;
  description?: unknown;
}

interface GroupPayload {
  type: LinkGroupType;
  name: string;
  color: string | null;
  description: string | null;
}

function normalizeGroupPayload(
  body: GroupBody,
  fallback?: { type: LinkGroupType; name: string }
): { value?: GroupPayload; error?: string } {
  const type = parseGroupType(body.type) ?? fallback?.type;
  if (!type) return { error: 'type must be campaign or project' };

  const rawName = typeof body.name === 'string' && body.name.trim() ? body.name : fallback?.name;
  const name = normalizeGroupName(rawName, type);
  if (!name) return { error: 'name is required' };
  if (name.length > 40) return { error: 'name must be 40 characters or less' };

  const tagName = groupTagName(type, name);
  if (tagName.length > 50) return { error: 'group tag name must be 50 characters or less' };

  const color = typeof body.color === 'string' && body.color.trim()
    ? body.color.trim()
    : null;
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { error: 'color must be a hex color like #38bdf8' };
  }

  const description = typeof body.description === 'string' && body.description.trim()
    ? body.description.trim()
    : null;
  if (description && description.length > 200) {
    return { error: 'description must be 200 characters or less' };
  }

  return { value: { type, name, color, description } };
}

function parseGroupType(value: unknown): LinkGroupType | null {
  return GROUP_TYPES.includes(value as LinkGroupType) ? value as LinkGroupType : null;
}

function normalizeGroupName(value: unknown, type: LinkGroupType): string {
  if (typeof value !== 'string') return '';
  const withoutPrefix = value.trim().replace(/^(campaign|project):/i, '');
  return withoutPrefix.replace(/\s+/g, ' ').replace(/,/g, '').trim();
}

function groupTagName(type: LinkGroupType, name: string): string {
  return `${type}:${name}`;
}

function parseGroupTag(name: string): { type: LinkGroupType; name: string } | null {
  const index = name.indexOf(':');
  if (index <= 0) return null;
  const type = parseGroupType(name.slice(0, index));
  const groupName = name.slice(index + 1).trim();
  return type && groupName ? { type, name: groupName } : null;
}

async function syncGroupTagsFromLinks(env: Env): Promise<void> {
  const groupNames = (await getAllLinkTagNames(env)).filter((name) => parseGroupTag(name));
  if (groupNames.length === 0) return;

  const ts = now();
  await createTagsIfMissing(env, groupNames.map((name) => {
    const meta = parseGroupTag(name)!;
    return {
      id: generateId(),
      name,
      color: DEFAULT_COLORS[meta.type],
      description: null,
      created_at: ts,
      updated_at: ts,
    };
  }));
}

function buildGroups(tags: Tag[], links: Link[]): LinkGroup[] {
  return tags
    .map((tag) => {
      const meta = parseGroupTag(tag.name);
      return meta ? tagToGroup(tag, links, meta.type, meta.name) : null;
    })
    .filter((group): group is LinkGroup => group !== null)
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

function tagToGroup(tag: Tag, links: Link[], type: LinkGroupType, name: string): LinkGroup {
  const matchedLinks = links.filter((link) => linkHasTag(link, tag.name));
  const lastClickedAt = matchedLinks
    .map((link) => link.last_clicked_at)
    .filter((value): value is string => !!value)
    .sort()
    .pop() ?? null;

  return {
    id: tag.id,
    type,
    name,
    tagName: tag.name,
    color: tag.color,
    description: tag.description,
    linkCount: matchedLinks.length,
    activeLinkCount: matchedLinks.filter((link) => link.status === 'active' && link.archived === 0).length,
    totalClicks: matchedLinks.reduce((sum, link) => sum + link.clicks, 0),
    lastClickedAt,
    created_at: tag.created_at,
    updated_at: tag.updated_at,
  };
}

function linkHasTag(link: Link, tagName: string): boolean {
  if (!link.tags) return false;
  try {
    const parsed = JSON.parse(link.tags) as unknown;
    return Array.isArray(parsed) && parsed.some((tag) => String(tag).trim() === tagName);
  } catch {
    return false;
  }
}

export default groups;
