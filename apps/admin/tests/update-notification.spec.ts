import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';

const latestVersion = '99.0.0';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

test('authenticated Admin opening shows and dismisses a cached GitHub update notice', async ({
  page,
}) => {
  let githubRequests = 0;
  let githubAuthorization: string | undefined;
  await page.addInitScript(() => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
  });
  await page.route('https://api.github.com/**', async (route) => {
    githubRequests += 1;
    githubAuthorization = route.request().headers().authorization;
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.github.raw+json',
      body: JSON.stringify({ name: 'linketry', version: latestVersion }),
    });
  });
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
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: '{"error":"missing mock"}',
    });
  });

  await page.goto('/overview');
  await expect(
    page.getByText(messages.en.updateAvailableTitle.replace('{version}', latestVersion))
  ).toBeVisible();
  await expect(
    page.getByText(
      messages.en.updateAvailableDescription.replace('{currentVersion}', LINKETRY_VERSION)
    )
  ).toBeVisible();
  expect(githubRequests).toBe(1);
  expect(githubAuthorization).toBeUndefined();

  await page.getByRole('button', { name: messages.en.dismissUpdate }).click();
  await expect(page.getByText(latestVersion)).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry_dismissed_update_version')))
    .toBe(latestVersion);

  await page.reload();
  await expect(page.getByText(latestVersion)).toHaveCount(0);
  expect(githubRequests).toBe(1);
});
