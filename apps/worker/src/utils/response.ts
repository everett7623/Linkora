import type { ApiResponse } from '@linkora/shared';

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

export function notFound(message = 'Not Found'): Response {
  return new Response(renderNotFoundPage(message), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function disabledPage(): Response {
  return new Response(renderDisabledPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function expiredPage(): Response {
  return new Response(renderExpiredPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function passwordGatePage(slug: string, error?: string): Response {
  return new Response(renderPasswordGatePage(slug, error), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function warningPage(slug: string, longUrl: string): Response {
  return new Response(renderWarningPage(slug, longUrl), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function renderNotFoundPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Link Not Found | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    .code { font-size: 6rem; font-weight: 800; color: #6366f1; line-height: 1; }
    h1 { font-size: 1.5rem; margin: 1rem 0 0.5rem; color: #f1f5f9; }
    p { color: #94a3b8; }
    a { color: #6366f1; text-decoration: none; margin-top: 1.5rem; display: inline-block; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">404</div>
    <h1>Link Not Found</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

function renderDisabledPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Disabled | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f1f5f9; }
    p { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔒</div>
    <h1>Link Disabled</h1>
    <p>This link has been disabled and is no longer accessible.</p>
  </div>
</body>
</html>`;
}

function renderExpiredPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expired | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f1f5f9; }
    p { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⏰</div>
    <h1>Link Expired</h1>
    <p>This link has expired and is no longer accessible.</p>
  </div>
</body>
</html>`;
}

function renderPasswordGatePage(slug: string, error?: string): string {
  const escapedSlug = slug.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
  const errorHtml = error ? `<p class="error">${error}</p>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Required | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; max-width: 400px; width: 100%; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f1f5f9; }
    p { color: #94a3b8; margin-bottom: 1.5rem; }
    .error { color: #f87171; font-size: 0.875rem; margin-bottom: 1rem; }
    form { display: flex; flex-direction: column; gap: 0.75rem; }
    input[type="password"] { padding: 0.625rem 0.75rem; border-radius: 0.5rem; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; font-size: 0.875rem; outline: none; }
    input[type="password"]:focus { border-color: #6366f1; }
    button { padding: 0.625rem; border-radius: 0.5rem; border: none; background: #6366f1; color: white; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔐</div>
    <h1>Password Required</h1>
    <p>This link is password-protected. Enter the password to continue.</p>
    ${errorHtml}
    <form method="POST" action="/${escapedSlug}">
      <input type="password" name="password" placeholder="Enter password" required autofocus />
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>`;
}

function renderWarningPage(slug: string, longUrl: string): string {
  const escapedSlug = slug.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
  const escapedUrl = longUrl.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirect Warning | Linkora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; max-width: 500px; width: 100%; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f1f5f9; }
    p { color: #94a3b8; margin-bottom: 1rem; }
    .url { word-break: break-all; color: #6366f1; font-size: 0.875rem; background: #1e293b; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1.5rem; }
    .actions { display: flex; justify-content: center; gap: 0.75rem; }
    a.btn { padding: 0.625rem 1.25rem; border-radius: 0.5rem; text-decoration: none; font-size: 0.875rem; font-weight: 600; }
    a.btn-primary { background: #6366f1; color: white; }
    a.btn-primary:hover { background: #4f46e5; }
    a.btn-secondary { border: 1px solid #334155; color: #94a3b8; }
    a.btn-secondary:hover { background: #1e293b; color: #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Redirect Warning</h1>
    <p>You are about to be redirected to the following URL:</p>
    <div class="url">${escapedUrl}</div>
    <div class="actions">
      <a href="/${escapedSlug}?confirm=1" class="btn btn-primary">Continue</a>
      <a href="javascript:history.back()" class="btn btn-secondary">Go Back</a>
    </div>
  </div>
</body>
</html>`;
}
