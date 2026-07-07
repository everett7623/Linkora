import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { jsonError, jsonOk } from '../utils/response';
import { validateLongUrl } from '@linkora/shared';

const metadata = new Hono<{ Bindings: Env }>();

const MAX_CONTENT_LENGTH = 1024 * 1024;
const MAX_TITLE_LENGTH = 200;
const FETCH_TIMEOUT_MS = 6000;

metadata.use('*', async (c, next) => {
  const authError = requireAuth(c);
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
