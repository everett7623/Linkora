import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';
import { routeAdminRelease } from './helpers/adminReleaseRoute.ts';

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
  const versionStatus = page.getByTestId('sidebar-version');
  await expect(versionStatus).toHaveAccessibleName(
    messages.en.updateAvailableTitle.replace('{version}', latestVersion)
  );
  await expect(
    versionStatus.getByText(
      messages.en.sidebarUpdateAvailable.replace('{version}', latestVersion),
      { exact: true }
    )
  ).toBeVisible();
  expect(githubRequests).toBe(1);
  expect(githubAuthorization).toBeUndefined();

  await page.getByRole('button', { name: messages.en.dismissUpdate }).click();
  await expect(
    page.getByText(messages.en.updateAvailableTitle.replace('{version}', latestVersion))
  ).toHaveCount(0);
  await expect(versionStatus).toHaveAccessibleName(
    messages.en.updateAvailableTitle.replace('{version}', latestVersion)
  );
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry_dismissed_update_version')))
    .toBe(latestVersion);

  await page.reload();
  await expect(
    page.getByText(messages.en.updateAvailableTitle.replace('{version}', latestVersion))
  ).toHaveCount(0);
  await expect(page.getByTestId('sidebar-version')).toHaveAccessibleName(
    messages.en.updateAvailableTitle.replace('{version}', latestVersion)
  );
  expect(githubRequests).toBe(1);

  await page.getByTestId('sidebar-version').click();
  await expect(
    page
      .locator('main')
      .getByRole('status')
      .getByText(messages.en.updateAvailableTitle.replace('{version}', latestVersion))
  ).toBeVisible();
  expect(githubRequests).toBe(2);
});

test('manual update check bypasses a fresh cache and reveals the latest GitHub version', async ({
  page,
}) => {
  let githubRequests = 0;
  await page.addInitScript((version) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
    localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);
  await page.route('https://api.github.com/**', async (route) => {
    githubRequests += 1;
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
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });

  await page.goto('/overview');
  expect(githubRequests).toBe(0);
  await page.getByTestId('sidebar-version').click();

  await expect(
    page
      .getByRole('main')
      .getByRole('status')
      .getByText(messages.en.updateAvailableTitle.replace('{version}', latestVersion))
  ).toBeVisible();
  expect(githubRequests).toBe(1);
});

test('Settings reports release readiness and refreshes the shared update state', async ({
  page,
}) => {
  let githubRequests = 0;
  await page.addInitScript(() => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
  });
  await page.route('https://api.github.com/**', async (route) => {
    githubRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.github.raw+json',
      body: JSON.stringify({
        name: 'linketry',
        version: githubRequests === 1 ? LINKETRY_VERSION : latestVersion,
      }),
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
    if (path === '/api/v1/system/upgrade') {
      await route.fulfill(
        apiResponse({
          enabled: false,
          repositoryUrl: 'https://github.com/everett7623/Linketry',
          workflowUrl: 'https://github.com/everett7623/Linketry/actions/workflows/deploy.yml',
          branch: 'main',
          reason: 'not_configured',
        })
      );
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });

  await page.goto('/settings');
  const releasePanel = page.getByRole('region', { name: messages.en.releaseStatus });
  await expect(releasePanel).toBeVisible();
  await expect(releasePanel.getByText(messages.en.upToDate, { exact: true })).toBeVisible();
  await expect(
    releasePanel.getByText(messages.en.manualDeploymentRequired, { exact: true })
  ).toBeVisible();
  await expect(releasePanel.getByText('LINKETRY_GITHUB_UPDATE_TOKEN')).toBeVisible();
  await expect(releasePanel.getByText(`v${LINKETRY_VERSION}`, { exact: true })).toHaveCount(2);

  await releasePanel.getByRole('button', { name: messages.en.checkNow }).click();
  await expect(releasePanel.getByText(messages.en.updateAvailable, { exact: true })).toBeVisible();
  await expect(releasePanel.getByText(`v${latestVersion}`, { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .getByRole('status')
      .getByText(messages.en.updateAvailableTitle.replace('{version}', latestVersion))
  ).toBeVisible();
  expect(githubRequests).toBe(2);
});

test('automatic upgrade confirms deployment, verifies runtime, and reloads the Admin', async ({
  page,
}) => {
  let dispatchRequests = 0;
  await routeAdminRelease(page, latestVersion);
  await page.addInitScript(() => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
  });
  await page.route('https://api.github.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.github.raw+json',
      body: JSON.stringify({ name: 'linketry', version: latestVersion }),
    });
  });
  await page.route('**/health', async (route) => {
    await route.fulfill(apiResponse({ status: 'ok', name: 'Linketry', version: latestVersion }));
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
      dispatchRequests += 1;
      await route.fulfill(
        apiResponse({
          accepted: true,
          runId: 123,
          runUrl: 'https://github.com/everett7623/Linketry/actions/runs/123',
          status: 'requested',
        })
      );
      return;
    }
    if (path === '/api/v1/system/upgrade/123') {
      await route.fulfill(
        apiResponse({
          runId: 123,
          runUrl: 'https://github.com/everett7623/Linketry/actions/runs/123',
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
      body: '{"error":"missing mock"}',
    });
  });

  await page.goto('/overview');
  const upgradeButton = page.getByRole('button', { name: messages.en.upgradeOnline });
  await expect(upgradeButton).toBeVisible();
  await upgradeButton.click();
  await expect(page.getByRole('heading', { name: messages.en.confirmUpgradeTitle })).toBeVisible();

  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: messages.en.confirmUpgrade }).click();
  await expect(page.getByText(messages.en.upgradeSucceeded)).toBeVisible();
  await reloaded;

  expect(dispatchRequests).toBe(1);
  await expect(
    page.getByText(messages.en.upgradePropagationTitle.replace('{version}', latestVersion))
  ).toBeVisible();
  await expect(page.getByRole('button', { name: messages.en.upgradeOnline })).toHaveCount(0);
});
