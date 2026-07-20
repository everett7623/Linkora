import { expect, test, type Page } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';
import { UPGRADE_FEEDBACK_STORAGE_KEY } from '../src/utils/upgradeFeedback';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

async function preparePage(
  page: Page,
  latestVersion: string,
  feedback: { targetVersion: string; followUpRefreshScheduled: boolean }
) {
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem('linketry_token', 'test-token');
      localStorage.setItem('linketry.locale', 'en');
      localStorage.setItem('linketry_theme', 'dark');
      sessionStorage.setItem(key, JSON.stringify({ ...value, createdAt: Date.now() }));
    },
    { key: UPGRADE_FEEDBACK_STORAGE_KEY, value: feedback }
  );
  await page.route('https://api.github.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.github.raw+json',
      body: JSON.stringify({ name: 'linketry', version: latestVersion }),
    });
  });
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
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
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });
}

test('newly loaded target build confirms the completed online upgrade', async ({ page }) => {
  await preparePage(page, LINKETRY_VERSION, {
    targetVersion: LINKETRY_VERSION,
    followUpRefreshScheduled: true,
  });

  await page.goto('/overview');

  await expect(
    page.getByText(
      messages.en.upgradeCompletedTitle.replace('{version}', LINKETRY_VERSION)
    )
  ).toBeVisible();
  await expect(page.getByText(messages.en.upgradeCompletedDescription)).toBeVisible();
  await page.getByRole('button', { name: messages.en.dismissUpgradeResult }).click();
  await expect(page.getByText(messages.en.upgradeCompletedDescription)).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), UPGRADE_FEEDBACK_STORAGE_KEY))
    .toBeNull();
});

test('stale build requests a manual refresh after the bounded retry', async ({ page }) => {
  const targetVersion = '99.0.0';
  await preparePage(page, targetVersion, {
    targetVersion,
    followUpRefreshScheduled: true,
  });

  await page.goto('/overview');

  await expect(
    page.getByText(messages.en.upgradePropagationTitle.replace('{version}', targetVersion))
  ).toBeVisible();
  await expect(
    page.getByText(
      messages.en.upgradePropagationManual.replace('{currentVersion}', LINKETRY_VERSION)
    )
  ).toBeVisible();
  await expect(page.getByRole('button', { name: messages.en.refreshNow })).toBeVisible();
  await expect(page.getByRole('button', { name: messages.en.upgradeOnline })).toHaveCount(0);
});
