import { expect, test, type Page } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';
import { EVERETTLABS_SUPPORT_URL } from '../src/utils/externalLinks';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

async function mockDashboardApi(page: Page) {
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
}

test('Desktop sidebar footer groups preferences, support, version, and update status', async ({
  page,
}) => {
  await page.addInitScript((version) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
    localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);
  await mockDashboardApi(page);

  await page.goto('/overview');

  const toolbar = page.getByTestId('desktop-toolbar');
  const sidebar = page.locator('aside:visible');
  const actions = sidebar.getByRole('group', { name: messages.en.quickActions });
  await expect(actions.locator('button, a')).toHaveCount(3);
  await expect(toolbar.getByRole('button', { name: messages.en.checkForUpdates })).toHaveCount(0);
  await expect(toolbar.getByRole('group', { name: messages.en.quickActions })).toHaveCount(0);
  await expect(
    toolbar.getByRole('button', { name: `${messages.en.interfaceMode}: ${messages.en.simple}` })
  ).toHaveCount(0);
  await expect(
    sidebar.getByRole('button', {
      name: `${messages.en.interfaceMode}: ${messages.en.simple}`,
    })
  ).toBeVisible();

  const versionStatus = sidebar.getByTestId('sidebar-version');
  await expect(versionStatus).toBeVisible();
  await expect(versionStatus).toHaveAccessibleName(messages.en.checkForUpdates);
  await expect(versionStatus.getByText(`v${LINKETRY_VERSION}`, { exact: true })).toBeVisible();
  await expect(versionStatus.getByText(messages.en.upToDate, { exact: true })).toBeVisible();

  const brandMark = page.getByTestId('sidebar-brand').getByTestId('brand-mark');
  await expect(brandMark).toHaveAttribute('src', `/favicon.svg?v=${LINKETRY_VERSION}`);

  const support = actions.getByRole('link', { name: messages.en.supportEverettlabs });
  await expect(support).toHaveAttribute('href', EVERETTLABS_SUPPORT_URL);
  await expect(support).toHaveAttribute('target', '_blank');
  await expect(support).toHaveAttribute('rel', 'noopener noreferrer');

  const lightLabel = messages.en.switchTheme.replace('{theme}', messages.en.lightTheme);
  await actions.getByRole('button', { name: lightLabel }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(brandMark).toHaveAttribute('src', `/favicon-light.svg?v=${LINKETRY_VERSION}`);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry_theme')))
    .toBe('light');

  const languageLabel = messages.en.switchLanguage
    .replace('{current}', 'English')
    .replace('{next}', '简体中文');
  await actions.getByRole('button', { name: languageLabel }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry.locale')))
    .toBe('zh-CN');
  await expect(page.getByRole('group', { name: messages['zh-CN'].quickActions })).toBeVisible();
});

test('Update notice exposes a safe repository upgrade workflow without mobile overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_theme', 'dark');
    localStorage.removeItem('linketry_update_check');
    localStorage.removeItem('linketry_dismissed_update_version');
  });
  await mockDashboardApi(page);
  await page.route('https://api.github.com/repos/**/contents/package.json?ref=main', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'linketry', version: '99.0.0' }),
    })
  );

  await page.goto('/overview');

  const notice = page
    .locator('main')
    .getByRole('status')
    .filter({ hasText: messages.en.updateAvailableTitle.replace('{version}', '99.0.0') });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole('link', { name: messages.en.viewChanges })).toHaveAttribute(
    'href',
    'https://github.com/everett7623/Linketry/blob/main/CHANGELOG.md'
  );
  await expect(notice.getByRole('link', { name: messages.en.openDeployment })).toHaveAttribute(
    'href',
    'https://github.com/everett7623/Linketry/actions/workflows/deploy.yml'
  );
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});
