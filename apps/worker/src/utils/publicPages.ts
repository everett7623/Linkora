export type PublicLocale = 'en' | 'zh-CN';

export interface PublicPageTemplate {
  message?: string;
}

const copy = {
  en: {
    notFoundTitle: 'Link Not Found',
    notFoundMessage: 'The short link you are looking for does not exist.',
    disabledTitle: 'Link Disabled',
    disabledMessage: 'This link has been disabled and is no longer accessible.',
    expiredCode: 'Expired',
    expiredTitle: 'Link Expired',
    expiredMessage: 'This link has reached its expiry condition and is no longer accessible.',
    passwordTitle: 'Password Required',
    passwordMessage: 'Enter the password to continue to',
    password: 'Password',
    continue: 'Continue',
    invalidPassword: 'Incorrect password. Try again.',
    external: 'External destination',
    warningTitle: 'Continue from',
    warningMessage:
      'This short link is configured to show a safety confirmation before opening the destination.',
  },
  'zh-CN': {
    notFoundTitle: '未找到短链',
    notFoundMessage: '你访问的短链不存在。',
    disabledTitle: '短链已停用',
    disabledMessage: '该短链已停用，暂时无法访问。',
    expiredCode: '已过期',
    expiredTitle: '短链已过期',
    expiredMessage: '该短链已达到过期条件，无法继续访问。',
    passwordTitle: '需要密码',
    passwordMessage: '输入密码后继续访问',
    password: '密码',
    continue: '继续',
    invalidPassword: '密码不正确，请重试。',
    external: '外部目标',
    warningTitle: '是否继续访问',
    warningMessage: '该短链已启用安全确认，打开目标网址前请确认。',
  },
} as const;

export function resolvePublicLocale(acceptLanguage?: string | null): PublicLocale {
  if (!acceptLanguage) return 'en';
  const candidates = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [range, ...params] = part.trim().split(';');
      const quality = params.find((param) => param.trim().startsWith('q='));
      const q = quality ? Number(quality.trim().slice(2)) : 1;
      return { range: range.toLowerCase(), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((item) => item.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const candidate of candidates) {
    if (candidate.range === 'zh' || candidate.range.startsWith('zh-')) return 'zh-CN';
    if (candidate.range === 'en' || candidate.range.startsWith('en-') || candidate.range === '*')
      return 'en';
  }
  return 'en';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const baseStyle = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center}.container{width:min(34rem,calc(100vw - 2rem));padding:2rem}.panel{border:1px solid #334155;background:#111827;border-radius:12px;padding:1.5rem}h1{font-size:1.35rem;color:#f8fafc;margin-bottom:.5rem}p{color:#94a3b8;line-height:1.5}.slug{color:#818cf8;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}label{display:block;color:#cbd5e1;font-size:.875rem;margin:1rem 0 .375rem}input{width:100%;border:1px solid #475569;border-radius:8px;padding:.75rem;color:#f8fafc;background:#020617;font-size:1rem}.button,button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:8px;padding:.75rem 1rem;color:#fff;background:#4f46e5;font-weight:600;text-decoration:none;cursor:pointer}button{width:100%;margin-top:1rem}.error{color:#f87171;margin-top:.75rem;font-size:.875rem}.url{margin:1rem 0;padding:.75rem;border:1px solid #334155;border-radius:8px;color:#cbd5e1;background:#020617;overflow-wrap:anywhere;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.875rem}.label{color:#f59e0b;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:.75rem}`;

function document(locale: PublicLocale, title: string, body: string): string {
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | Linkora</title><style>${baseStyle}</style></head><body>${body}</body></html>`;
}

export function renderNotFoundPage(locale: PublicLocale, message?: string): string {
  const text = copy[locale];
  return document(
    locale,
    `404 - ${text.notFoundTitle}`,
    `<main class="container"><section class="panel"><div class="label">404</div><h1>${text.notFoundTitle}</h1><p>${escapeHtml(message ?? text.notFoundMessage)}</p></section></main>`
  );
}

export function renderDisabledPage(locale: PublicLocale, template?: PublicPageTemplate): string {
  const text = copy[locale];
  return document(
    locale,
    text.disabledTitle,
    `<main class="container"><section class="panel"><h1>${text.disabledTitle}</h1><p>${escapeHtml(template?.message || text.disabledMessage)}</p></section></main>`
  );
}

export function renderExpiredPage(locale: PublicLocale, template?: PublicPageTemplate): string {
  const text = copy[locale];
  return document(
    locale,
    text.expiredTitle,
    `<main class="container"><section class="panel"><div class="label">${text.expiredCode}</div><h1>${text.expiredTitle}</h1><p>${escapeHtml(template?.message || text.expiredMessage)}</p></section></main>`
  );
}

export function renderPasswordPage(locale: PublicLocale, slug: string, invalid: boolean): string {
  const text = copy[locale];
  const safeSlug = escapeHtml(slug);
  const error = invalid ? `<p class="error">${text.invalidPassword}</p>` : '';
  const period = locale === 'zh-CN' ? '。' : '.';
  return document(
    locale,
    text.passwordTitle,
    `<main class="container"><section class="panel"><h1>${text.passwordTitle}</h1><p>${text.passwordMessage} <span class="slug">/${safeSlug}</span>${period}</p>${error}<form method="post" action="/${safeSlug}"><label for="password">${text.password}</label><input id="password" name="password" type="password" autocomplete="current-password" autofocus required><button type="submit">${text.continue}</button></form></section></main>`
  );
}

export function renderWarningPage(
  locale: PublicLocale,
  slug: string,
  longUrl: string,
  requiresPassword: boolean,
  template?: PublicPageTemplate
): string {
  const text = copy[locale];
  const safeSlug = escapeHtml(slug);
  const action = escapeHtml(`/${encodeURIComponent(slug)}?linkora_confirm=1`);
  const control = requiresPassword
    ? `<form method="post" action="${action}"><label for="password">${text.password}</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">${text.continue}</button></form>`
    : `<a class="button" href="${action}">${text.continue}</a>`;
  const question = locale === 'zh-CN' ? '？' : '?';
  return document(
    locale,
    text.warningTitle,
    `<main class="container"><section class="panel"><div class="label">${text.external}</div><h1>${text.warningTitle} <span class="slug">/${safeSlug}</span>${question}</h1><p>${escapeHtml(template?.message || text.warningMessage)}</p><div class="url">${escapeHtml(longUrl)}</div>${control}</section></main>`
  );
}
