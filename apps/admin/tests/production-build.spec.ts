import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

test('built Admin renders the authenticated overview without module identity errors', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await page.addInitScript((version) => {
    window.localStorage.setItem('linketry_token', 'production-smoke-token');
    window.localStorage.setItem('linketry_demo_access', 'granted');
    window.localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"success":true}',
      });
      return;
    }
    if (path === '/api/v1/settings') {
      await route.fulfill(
        apiResponse({ default_domain: 'go.example.com', admin_hidden_modules: '[]' })
      );
      return;
    }
    if (path === '/api/v1/overview') {
      await route.fulfill(
        apiResponse({
          totalLinks: 0,
          totalClicks: 0,
          todayClicks: 0,
          recentLinks: [],
          topLinks: [],
        })
      );
      return;
    }
    await route.fulfill(apiResponse({}));
  });

  await page.goto('/overview');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  expect(browserErrors).toEqual([]);
});
