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
    .code { font-size: 4rem; font-weight: 800; color: #f59e0b; line-height: 1; }
    h1 { font-size: 1.5rem; margin: 1rem 0 0.5rem; color: #f1f5f9; }
    p { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">Expired</div>
    <h1>Link Expired</h1>
    <p>This link has reached its expiry condition and is no longer accessible.</p>
  </div>
</body>
</html>`;
}
