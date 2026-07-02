import type { Link, KVCacheEntry } from '@linkora/shared';
import type { Env } from '../types';
import { generateId, now, sha256 } from '../utils/id';
import { incrementClicks, insertVisit } from '../db/index';
import { setCachedLink } from '../cache/index';

const BOT_UA_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i,
  /wget/i, /python/i, /java\/\d/i, /axios/i, /node-fetch/i,
  /go-http/i, /php/i, /ruby/i,
];

function detectBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/MSIE|Trident/i.test(ua)) return 'IE';
  if (/Opera|OPR/i.test(ua)) return 'Opera';
  return 'Other';
}

function detectOS(ua: string): string {
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  return 'Other';
}

function detectDevice(ua: string): string {
  if (/Mobile/i.test(ua)) return 'mobile';
  if (/Tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

export async function recordVisit(
  env: Env,
  link: Link,
  request: Request,
  domain: string
): Promise<void> {
  try {
    const ua = request.headers.get('User-Agent') ?? '';
    const referer = request.headers.get('Referer') ?? undefined;
    const country = (request as Request & { cf?: { country?: string } }).cf?.country ?? undefined;
    const ip = request.headers.get('CF-Connecting-IP') ?? '';

    const isBot = detectBot(ua) ? 1 : 0;
    const ipHash = ip ? await sha256(ip) : undefined;

    const visitId = generateId();
    const createdAt = now();

    await Promise.all([
      incrementClicks(env, link.id, createdAt),
      insertVisit(env, {
        id: visitId,
        link_id: link.id,
        slug: link.slug,
        domain,
        referer,
        country,
        user_agent: ua,
        browser: detectBrowser(ua),
        os: detectOS(ua),
        device_type: detectDevice(ua),
        ip_hash: ipHash,
        is_bot: isBot,
        created_at: createdAt,
      }),
    ]);

    // Update KV cache with fresh click count
    const cacheEntry: KVCacheEntry = {
      id: link.id,
      slug: link.slug,
      domain: link.domain ?? undefined,
      longUrl: link.long_url,
      redirectType: (link.redirect_type as 301 | 302),
      status: link.status,
      expiresAt: link.expires_at ?? undefined,
      maxClicks: link.max_clicks ?? undefined,
      warningEnabled: link.warning_enabled === 1,
      passwordProtected: !!link.password_hash,
    };
    await setCachedLink(env, domain, cacheEntry);
  } catch {
    // Statistics must never affect redirect
  }
}
