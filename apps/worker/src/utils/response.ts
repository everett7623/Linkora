import type { ApiResponse } from '@linkora/shared';
import {
  renderDisabledPage,
  renderExpiredPage,
  renderNotFoundPage,
  renderPasswordPage,
  renderWarningPage,
  type PublicLocale,
} from './publicPages';

export function jsonOk<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = { success: true, data };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonError(error: string, status = 400): Response {
  const body: ApiResponse = { success: false, error };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonCreated<T>(data: T): Response {
  return jsonOk(data, 201);
}

const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8', Vary: 'Accept-Language' };

export function notFound(message?: string, locale: PublicLocale = 'en'): Response {
  return new Response(renderNotFoundPage(locale, message), { status: 404, headers: htmlHeaders });
}

export function disabledPage(locale: PublicLocale = 'en'): Response {
  return new Response(renderDisabledPage(locale), { status: 200, headers: htmlHeaders });
}

export function expiredPage(locale: PublicLocale = 'en'): Response {
  return new Response(renderExpiredPage(locale), { status: 200, headers: htmlHeaders });
}

export function passwordPage(slug: string, invalid = false, locale: PublicLocale = 'en'): Response {
  return new Response(renderPasswordPage(locale, slug, invalid), {
    status: invalid ? 401 : 200,
    headers: htmlHeaders,
  });
}

export function warningPage(
  slug: string,
  longUrl: string,
  requiresPassword = false,
  locale: PublicLocale = 'en'
): Response {
  return new Response(renderWarningPage(locale, slug, longUrl, requiresPassword), {
    status: 200,
    headers: htmlHeaders,
  });
}
