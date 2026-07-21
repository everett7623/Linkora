import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';
import { routeAdminRelease } from './helpers/adminReleaseRoute.ts';

const targetVersion = '99.0.0';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

function corsApiResponse(data: unknown) {
  return {
    ...apiResponse(data),
    headers: { 'Access-Control-Allow-Origin': '*' },
  };
}

test('no-run-ID deployment waits through stale Admin assets and resumes on focus', async ({
  page,
}) => {
  const scriptRequests = await routeAdminRelease(page, targetVersion, 1);
  await page.addInitScript(() => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
  });
  await page.route('https://api.github.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.github.raw+json',
      body: JSON.stringify({ name: 'linketry', version: targetVersion }),
    });
  });
  await page.route('**/health', async (route) => {
    await route.fulfill(apiResponse({ status: 'ok', name: 'Linketry', version: targetVersion }));
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
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
    if (path === '/api/v1/system/upgrade' && request.method() === 'GET') {
      await route.fulfill(
        apiResponse({
          enabled: true,
          repositoryUrl: 'https://github.com/everett7623/Linketry',
          workflowUrl: 'https://github.com/everett7623/Linketry/actions/workflows/deploy.yml',
          branch: 'main',
          reason: 'ready',
        })
      );
      return;
    }
    if (path === '/api/v1/system/upgrade' && request.method() === 'POST') {
      await route.fulfill(
        apiResponse({
          accepted: true,
          runId: null,
          runUrl: 'https://github.com/everett7623/Linketry/actions/workflows/deploy.yml',
          status: 'requested',
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
  await page.getByRole('button', { name: messages.en.upgradeOnline }).click();
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: messages.en.confirmUpgrade }).click();
  await expect(page.getByText(messages.en.upgradeFinalizing)).toBeVisible();
  expect(scriptRequests()).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await reloaded;
  expect(scriptRequests()).toBeGreaterThanOrEqual(2);

  await expect(
    page.getByText(messages.en.upgradePropagationTitle.replace('{version}', targetVersion))
  ).toBeVisible();
  await expect(
    page.getByText(
      messages.en.upgradePropagationManual.replace('{currentVersion}', LINKETRY_VERSION)
    )
  ).toBeVisible();
  await expect(page.getByRole('button', { name: messages.en.upgradeOnline })).toHaveCount(0);
  await expect(page.getByText(messages.en.upgradeFinalizing)).toHaveCount(0);
});

test('successful deployment verifies the new runtime across the Admin and Worker origins', async ({
  page,
}) => {
  await routeAdminRelease(page, targetVersion);
  const apiOrigin = 'https://go.example.test';
  let runtimeChecks = 0;
  await page.addInitScript((origin) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
    localStorage.setItem('linketry_api_base', origin);
  }, apiOrigin);
  await page.route('https://api.github.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.github.raw+json',
      body: JSON.stringify({ name: 'linketry', version: targetVersion }),
    });
  });
  await page.route(`${apiOrigin}/health`, async (route) => {
    runtimeChecks += 1;
    await route.fulfill(
      corsApiResponse({ status: 'ok', name: 'Linketry', version: targetVersion })
    );
  });
  await page.route(`${apiOrigin}/api/v1/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/auth/me') {
      await route.fulfill(corsApiResponse(undefined));
      return;
    }
    if (path === '/api/v1/settings') {
      await route.fulfill(
        corsApiResponse({ default_domain: 'go.example.test', admin_hidden_modules: '[]' })
      );
      return;
    }
    if (path === '/api/v1/overview') {
      await route.fulfill(
        corsApiResponse({
          totalLinks: 0,
          totalClicks: 0,
          todayClicks: 0,
          recentLinks: [],
          topLinks: [],
        })
      );
      return;
    }
    if (path === '/api/v1/system/upgrade' && request.method() === 'GET') {
      await route.fulfill(
        corsApiResponse({
          enabled: true,
          repositoryUrl: 'https://github.com/everett7623/Linketry',
          workflowUrl: 'https://github.com/everett7623/Linketry/actions/workflows/deploy.yml',
          branch: 'main',
          reason: 'ready',
        })
      );
      return;
    }
    if (path === '/api/v1/system/upgrade' && request.method() === 'POST') {
      await route.fulfill(
        corsApiResponse({
          accepted: true,
          runId: 456,
          runUrl: 'https://github.com/everett7623/Linketry/actions/runs/456',
          status: 'requested',
        })
      );
      return;
    }
    if (path === '/api/v1/system/upgrade/456') {
      await route.fulfill(
        corsApiResponse({
          runId: 456,
          runUrl: 'https://github.com/everett7623/Linketry/actions/runs/456',
          status: 'completed',
          conclusion: 'success',
          headSha: '1234567890abcdef',
        })
      );
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: '{"error":"missing mock"}',
    });
  });

  await page.goto('/overview');
  await page.getByRole('button', { name: messages.en.upgradeOnline }).click();
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: messages.en.confirmUpgrade }).click();
  await expect(page.getByText(messages.en.upgradeSucceeded)).toBeVisible();
  await reloaded;

  expect(runtimeChecks).toBeGreaterThan(0);
  await expect(
    page.getByText(messages.en.upgradePropagationTitle.replace('{version}', targetVersion))
  ).toBeVisible();
  await expect(page.getByRole('button', { name: messages.en.upgradeOnline })).toHaveCount(0);
});
