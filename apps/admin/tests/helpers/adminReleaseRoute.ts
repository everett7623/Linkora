import type { Page } from '@playwright/test';

export async function routeAdminRelease(
  page: Page,
  targetVersion: string,
  fallbackScriptResponses = 0
) {
  let scriptRequests = 0;
  await page.route(/[?&]linketry-admin-ready=/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <meta name="linketry-version" content="${targetVersion}">
        <script type="module" src="/assets/upgrade-entry.js"></script>
        <link rel="stylesheet" href="/assets/upgrade-entry.css">
      `,
    });
  });
  await page.route('**/assets/upgrade-entry.js', async (route) => {
    scriptRequests += 1;
    await route.fulfill(
      scriptRequests <= fallbackScriptResponses
        ? { status: 200, contentType: 'text/html', body: '<!doctype html>' }
        : { status: 200, contentType: 'application/javascript', body: 'export {};' }
    );
  });
  await page.route('**/assets/upgrade-entry.css', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/css', body: 'body{}' });
  });
  return () => scriptRequests;
}
