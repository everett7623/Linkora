import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';
import { expectNoSeriousAccessibilityViolations } from './accessibility';

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

test('Mobile Admin uses a drawer without shrinking the page content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
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
  const reducedTransitionSeconds = await openNavigation.evaluate((element) =>
    Number.parseFloat(window.getComputedStyle(element).transitionDuration)
  );
  expect(reducedTransitionSeconds).toBeLessThanOrEqual(0.001);
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
  const navigationDialog = page.getByRole('dialog', { name: messages.en.navigationMenu });
  await expect(navigationDialog).toBeVisible();

  const versionStatus = page.locator('aside:visible').getByTestId('sidebar-version');
  await expect(versionStatus).toBeVisible();
  await expect(versionStatus).toHaveAccessibleName(messages.en.checkForUpdates);
  await expect(versionStatus.getByText(`v${LINKETRY_VERSION}`, { exact: true })).toBeVisible();
  const mobileSidebar = page.locator('aside:visible');
  await expect(
    mobileSidebar.getByRole('group', { name: messages.en.quickActions }).locator('button, a')
  ).toHaveCount(3);
  await expect(
    mobileSidebar.getByRole('button', {
      name: `${messages.en.interfaceMode}: ${messages.en.advanced}`,
    })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: messages.en.closeNavigation })).toHaveCount(1);
  const closeNavigation = page.getByRole('button', { name: messages.en.closeNavigation });
  await expect(closeNavigation).toBeFocused();
  const lastNavigationControl = navigationDialog
    .locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])')
    .last();
  await page.keyboard.press('Shift+Tab');
  await expect(lastNavigationControl).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeNavigation).toBeFocused();
  await expectNoSeriousAccessibilityViolations(page);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: messages.en.analytics })).toHaveCount(0);
  await expect(openNavigation).toBeFocused();
});

test('Desktop Admin can collapse navigation and use the wider workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript((version) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_admin_mode', 'advanced');
    localStorage.setItem('linketry_sidebar_collapsed', 'false');
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

  const collapseNavigation = page.getByRole('button', { name: messages.en.collapseNavigation });
  await expect(collapseNavigation).toBeVisible();
  await expect(
    page.locator('aside').getByRole('button', {
      name: messages.en.collapseNavigation,
    })
  ).toHaveCount(0);
  await expect(
    page.locator('main').getByRole('button', {
      name: messages.en.collapseNavigation,
    })
  ).toHaveCount(1);
  await expect(page.getByRole('link', { name: messages.en.analytics })).toBeVisible();

  const chromeHeights = await page.evaluate(() => ({
    brand: document.querySelector('[data-testid="sidebar-brand"]')?.getBoundingClientRect().height,
    toolbar: document.querySelector('[data-testid="desktop-toolbar"]')?.getBoundingClientRect()
      .height,
  }));
  expect(chromeHeights).toEqual({ brand: 64, toolbar: 64 });

  const expanded = await page.locator('aside').evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    pageWidth: document.documentElement.scrollWidth,
  }));
  expect(expanded.width).toBe(240);
  expect(expanded.pageWidth).toBe(1440);

  await collapseNavigation.click();
  await expect(page.getByRole('button', { name: messages.en.expandNavigation })).toBeVisible();
  await expect(page.getByTestId('sidebar-version')).toHaveAccessibleName(
    messages.en.checkForUpdates
  );
  const collapsedSidebar = page.locator('aside:visible');
  await expect(
    collapsedSidebar.getByRole('group', { name: messages.en.quickActions }).locator('button, a')
  ).toHaveCount(3);
  await expect(
    collapsedSidebar.getByRole('button', {
      name: `${messages.en.interfaceMode}: ${messages.en.advanced}`,
    })
  ).toBeVisible();
  await expect
    .poll(() => page.locator('aside').evaluate((element) => element.getBoundingClientRect().width))
    .toBe(80);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);

  await page.getByRole('button', { name: messages.en.expandNavigation }).click();
  await expect(page.getByRole('button', { name: messages.en.collapseNavigation })).toBeVisible();
});
