import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

test('Mobile Admin uses a drawer without shrinking the page content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((version) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_admin_mode', 'advanced');
    localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);

  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/me') {
      await route.fulfill(apiResponse({ authenticated: true }));
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
          totalLinks: 5,
          totalClicks: 84,
          todayClicks: 6,
          recentLinks: [],
          topLinks: [],
        })
      );
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });

  await page.goto('/overview');

  const openNavigation = page.getByRole('button', { name: messages.en.openNavigation });
  await expect(openNavigation).toBeVisible();
  await expect(page.getByRole('link', { name: messages.en.analytics })).toHaveCount(0);

  const layout = await page.locator('main').evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    left: element.getBoundingClientRect().left,
  }));
  expect(layout.left).toBe(0);
  expect(layout.width).toBe(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await openNavigation.click();
  await expect(page.getByRole('link', { name: messages.en.analytics })).toBeVisible();
  await expect(page.getByRole('button', { name: messages.en.closeNavigation })).toHaveCount(2);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: messages.en.analytics })).toHaveCount(0);
  await expect(openNavigation).toBeVisible();
});
