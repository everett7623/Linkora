import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getExistingSlugs } from '../db/index';
import { jsonError, jsonOk } from '../utils/response';
import { validateLongUrl, validateSlug } from '@linkora/shared';
import type { LinkSuggestionResult } from '@linkora/shared';

const metadata = new Hono<{ Bindings: Env }>();

const MAX_CONTENT_LENGTH = 1024 * 1024;
const MAX_TITLE_LENGTH = 200;
const FETCH_TIMEOUT_MS = 6000;
const MAX_DESCRIPTION_LENGTH = 240;
const STOP_WORDS = new Set([
  'about', 'after', 'also', 'and', 'are', 'but', 'can', 'com', 'for', 'from',
  'get', 'has', 'have', 'how', 'into', 'learn', 'more', 'not', 'official',
  'our', 'page', 'site', 'the', 'this', 'with', 'www', 'your',
]);

interface PageMetadata {
  title?: string | null;
  description?: string | null;
  keywords: string[];
}

const EMPTY_PAGE_METADATA: PageMetadata = { keywords: [] };

metadata.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

metadata.post('/title', async (c) => {
  let body: { url?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const validation = validateLongUrl(url);
  if (!validation.valid) return jsonError(validation.error!, 400);

  let response: Response;
  try {
    const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    response = await fetch(url, {
      redirect: 'follow',
      signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        'User-Agent': 'Linkora/0.1 (+https://github.com/EvenFrank/Linkora)',
      },
    });
  } catch {
    return jsonError('Unable to fetch URL', 400);
  }

  if (!response.ok) {
    return jsonError(`Target URL returned HTTP ${response.status}`, 400);
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType && !/\b(html|xhtml|xml)\b/i.test(contentType)) {
    return jsonError('Target URL did not return an HTML page', 400);
  }

  const contentLength = Number(response.headers.get('Content-Length') ?? '0');
  if (contentLength > MAX_CONTENT_LENGTH) {
    return jsonError('Target page is too large to inspect', 400);
  }

  const title = await extractTitle(response);
  if (!title) return jsonError('No page title found', 404);

  return jsonOk({
    title,
    final_url: response.url || url,
  });
});

metadata.post('/suggestions', async (c) => {
  let body: { url?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const validation = validateLongUrl(url);
  if (!validation.valid) return jsonError(validation.error!, 400);

  const { finalUrl, pageMetadata, metadataFetched, error } = await fetchSuggestionMetadata(url);
  const result = await buildSuggestions(c.env, url, finalUrl, pageMetadata, metadataFetched, error);
  return jsonOk(result);
});

async function extractTitle(response: Response): Promise<string | null> {
  const fallback = response.clone();
  let pageTitle = '';
  let openGraphTitle = '';
  let twitterTitle = '';

  try {
    await new HTMLRewriter()
      .on('title', {
        text(text) {
          pageTitle += text.text;
        },
      })
      .on('meta', {
        element(element) {
          const property = normalizeAttribute(element.getAttribute('property'));
          const name = normalizeAttribute(element.getAttribute('name'));
          const content = element.getAttribute('content') ?? '';

          if (!openGraphTitle && property === 'og:title') openGraphTitle = content;
          if (!twitterTitle && name === 'twitter:title') twitterTitle = content;
        },
      })
      .transform(response)
      .arrayBuffer();

    return normalizeTitle(openGraphTitle) ?? normalizeTitle(twitterTitle) ?? normalizeTitle(pageTitle);
  } catch {
    return extractTitleWithFallback(await fallback.text());
  }
}

async function fetchSuggestionMetadata(url: string): Promise<{
  finalUrl: string;
  pageMetadata: PageMetadata;
  metadataFetched: boolean;
  error?: string | null;
}> {
  try {
    const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    const response = await fetch(url, {
      redirect: 'follow',
      signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        'User-Agent': 'Linkora/0.1 suggestions (+https://github.com/EvenFrank/Linkora)',
      },
    });

    if (!response.ok) {
      return { finalUrl: response.url || url, pageMetadata: EMPTY_PAGE_METADATA, metadataFetched: false, error: `Target URL returned HTTP ${response.status}` };
    }

    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType && !/\b(html|xhtml|xml)\b/i.test(contentType)) {
      return { finalUrl: response.url || url, pageMetadata: EMPTY_PAGE_METADATA, metadataFetched: false, error: 'Target URL did not return an HTML page' };
    }

    const contentLength = Number(response.headers.get('Content-Length') ?? '0');
    if (contentLength > MAX_CONTENT_LENGTH) {
      return { finalUrl: response.url || url, pageMetadata: EMPTY_PAGE_METADATA, metadataFetched: false, error: 'Target page is too large to inspect' };
    }

    return {
      finalUrl: response.url || url,
      pageMetadata: await extractMetadata(response),
      metadataFetched: true,
      error: null,
    };
  } catch {
    return { finalUrl: url, pageMetadata: EMPTY_PAGE_METADATA, metadataFetched: false, error: 'Unable to fetch URL metadata' };
  }
}

async function extractMetadata(response: Response): Promise<PageMetadata> {
  const fallback = response.clone();
  let pageTitle = '';
  let openGraphTitle = '';
  let twitterTitle = '';
  let metaDescription = '';
  let openGraphDescription = '';
  let twitterDescription = '';
  let keywords = '';

  try {
    await new HTMLRewriter()
      .on('title', {
        text(text) {
          pageTitle += text.text;
        },
      })
      .on('meta', {
        element(element) {
          const property = normalizeAttribute(element.getAttribute('property'));
          const name = normalizeAttribute(element.getAttribute('name'));
          const content = element.getAttribute('content') ?? '';

          if (!openGraphTitle && property === 'og:title') openGraphTitle = content;
          if (!twitterTitle && name === 'twitter:title') twitterTitle = content;
          if (!openGraphDescription && property === 'og:description') openGraphDescription = content;
          if (!twitterDescription && name === 'twitter:description') twitterDescription = content;
          if (!metaDescription && name === 'description') metaDescription = content;
          if (!keywords && name === 'keywords') keywords = content;
        },
      })
      .transform(response)
      .arrayBuffer();

    return {
      title: normalizeTitle(openGraphTitle) ?? normalizeTitle(twitterTitle) ?? normalizeTitle(pageTitle),
      description: normalizeDescription(openGraphDescription) ?? normalizeDescription(twitterDescription) ?? normalizeDescription(metaDescription),
      keywords: parseKeywords(keywords),
    };
  } catch {
    return extractMetadataWithFallback(await fallback.text());
  }
}

function extractMetadataWithFallback(html: string): PageMetadata {
  const head = html.slice(0, MAX_CONTENT_LENGTH);
  const ogTitleMatch = head.match(/<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const titleMatch = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch = head.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const ogDescriptionMatch = head.match(/<meta\b[^>]*(?:property|name)=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const keywordsMatch = head.match(/<meta\b[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["'][^>]*>/i);

  return {
    title: normalizeTitle(ogTitleMatch?.[1]) ?? normalizeTitle(titleMatch?.[1]),
    description: normalizeDescription(ogDescriptionMatch?.[1]) ?? normalizeDescription(descriptionMatch?.[1]),
    keywords: parseKeywords(keywordsMatch?.[1] ?? ''),
  };
}

async function buildSuggestions(
  env: Env,
  url: string,
  finalUrl: string,
  pageMetadata: PageMetadata,
  metadataFetched: boolean,
  error?: string | null
): Promise<LinkSuggestionResult> {
  const slugs = await uniqueSlugSuggestions(env, [
    ...(pageMetadata.title ? [pageMetadata.title] : []),
    ...urlTextCandidates(finalUrl),
  ]);

  return {
    url,
    final_url: finalUrl,
    title: pageMetadata.title ?? titleFromUrl(finalUrl),
    description: pageMetadata.description ?? null,
    slugs,
    tags: tagSuggestions(finalUrl, pageMetadata),
    metadata_fetched: metadataFetched,
    error: error ?? null,
  };
}

async function uniqueSlugSuggestions(env: Env, inputs: string[]): Promise<string[]> {
  const bases = unique(
    inputs
      .flatMap((input) => slugCandidates(input))
      .filter(Boolean)
  ).slice(0, 12);
  const candidatesToCheck = bases.flatMap((base) => (
    Array.from({ length: 10 }, (_, index) => index === 0 ? base : `${base}-${index + 1}`)
  ));
  const existing = await getExistingSlugs(env, candidatesToCheck);
  const suggestions: string[] = [];
  const seen = new Set<string>();

  for (const base of bases) {
    for (let suffix = 0; suffix < 10; suffix++) {
      const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
      if (candidate.length > 100 || seen.has(candidate) || existing.has(candidate)) continue;
      const validation = validateSlug(candidate);
      if (!validation.valid) continue;
      suggestions.push(candidate);
      seen.add(candidate);
      break;
    }
    if (suggestions.length >= 6) break;
  }

  return suggestions;
}

function slugCandidates(input: string): string[] {
  const slug = slugify(input);
  if (!slug) return [];
  const words = slug.split('-').filter(Boolean);
  return unique([
    words.slice(0, 6).join('-'),
    words.slice(0, 4).join('-'),
    words.slice(-4).join('-'),
    slug,
  ].filter((item) => item.length >= 2));
}

function urlTextCandidates(value: string): string[] {
  try {
    const url = new URL(value);
    const pathSegments = url.pathname
      .split('/')
      .map((segment) => safeDecode(segment))
      .filter(Boolean)
      .filter((segment) => !/^(index|home|default)\.[a-z0-9]+$/i.test(segment));
    return [
      pathSegments[pathSegments.length - 1] ?? '',
      pathSegments.slice(-2).join(' '),
      url.hostname.replace(/^www\./i, '').split('.')[0],
    ];
  } catch {
    return [value];
  }
}

function titleFromUrl(value: string): string | null {
  const candidate = urlTextCandidates(value)[0];
  if (!candidate) return null;
  const title = candidate
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return normalizeTitle(title);
}

function tagSuggestions(url: string, pageMetadata: PageMetadata): string[] {
  const weighted = new Map<string, number>();
  const add = (value: string, score: number) => {
    const tag = slugify(value).replace(/-/g, ' ').split(' ')[0] || slugify(value);
    if (!tag || tag.length < 2 || tag.length > 30 || STOP_WORDS.has(tag)) return;
    weighted.set(tag, (weighted.get(tag) ?? 0) + score);
  };

  for (const keyword of pageMetadata.keywords) add(keyword, 5);
  for (const word of wordsFromText(pageMetadata.title ?? '')) add(word, 4);
  for (const word of wordsFromText(pageMetadata.description ?? '')) add(word, 2);
  for (const candidate of urlTextCandidates(url)) {
    for (const word of wordsFromText(candidate)) add(word, 2);
  }

  try {
    const host = new URL(url).hostname.replace(/^www\./i, '').split('.')[0];
    add(host, 3);
  } catch {
    // Ignore malformed URL here; validation already happened.
  }

  return [...weighted.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
    .slice(0, 8);
}

function wordsFromText(value: string): string[] {
  return slugify(value)
    .split('-')
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
}

function slugify(value: string): string {
  return decodeHtmlEntities(safeDecode(value))
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 80);
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parseKeywords(value: string): string[] {
  return unique(value.split(/[,|;]/).map((item) => decodeHtmlEntities(item).trim()).filter(Boolean)).slice(0, 12);
}

function normalizeDescription(value?: string | null): string | null {
  const description = decodeHtmlEntities(value ?? '').replace(/\s+/g, ' ').trim();
  if (!description) return null;
  if (description.length <= MAX_DESCRIPTION_LENGTH) return description;
  return `${description.slice(0, MAX_DESCRIPTION_LENGTH - 3).trimEnd()}...`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractTitleWithFallback(html: string): string | null {
  const head = html.slice(0, MAX_CONTENT_LENGTH);
  const ogMatch = head.match(/<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const twitterMatch = head.match(/<meta\b[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const titleMatch = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);

  return normalizeTitle(ogMatch?.[1]) ?? normalizeTitle(twitterMatch?.[1]) ?? normalizeTitle(titleMatch?.[1]);
}

function normalizeAttribute(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeTitle(value?: string | null): string | null {
  const title = decodeHtmlEntities(value ?? '').replace(/\s+/g, ' ').trim();
  if (!title) return null;
  if (title.length <= MAX_TITLE_LENGTH) return title;
  return `${title.slice(0, MAX_TITLE_LENGTH - 3).trimEnd()}...`;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => decodeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => decodeCodePoint(Number.parseInt(code, 16)));
}

function decodeCodePoint(codePoint: number): string {
  try {
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : '';
  } catch {
    return '';
  }
}

export default metadata;
