import { expect, test, type Page } from '@playwright/test';
import { messages, type Locale } from '../src/i18n/messages';

const link = {
  id: 'link_smoke_1',
  slug: 'docs',
  domain: 'go.example.com',
  long_url: 'https://example.com/docs',
  title: 'Docs',
  description: '',
  tags: JSON.stringify(['docs']),
  redirect_type: 302,
  status: 'active',
  archived: 0,
  clicks: 42,
  expires_at: null,
  max_clicks: null,
  password_hash: null,
  password_protected: false,
  warning_enabled: 0,
  fallback_url: null,
  source: null,
  source_id: null,
  last_clicked_at: null,
  created_at: '2026-07-10T08:00:00.000Z',
  updated_at: '2026-07-10T08:00:00.000Z',
};

const protectedLink = {
  ...link,
  id: 'link_smoke_protected',
  slug: 'private-docs',
  password_protected: true,
};

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

async function mockAdminApi(page: Page) {
  const instanceSettings: Record<string, string> = {
    site_name: 'Linketry',
    default_domain: 'go.example.com',
    default_redirect_type: '302',
    analytics_retention_days: '0',
    backup_retention_days: '30',
    health_monitoring_enabled: 'false',
    health_monitoring_limit: '20',
    health_failure_threshold: '2',
    health_alert_suppression_minutes: '1440',
    admin_hidden_modules: '[]',
  };
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (!path.startsWith('/api/v1/')) {
      await route.fallback();
      return;
    }

    if (path === '/api/v1/auth/login') {
      await route.fulfill(apiResponse({ authenticated: true }));
      return;
    }
    if (path === '/api/v1/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"success":true}',
      });
      return;
    }
    if (path === '/api/v1/overview') {
      await route.fulfill(
        apiResponse({
          totalLinks: 1,
          totalClicks: 42,
          todayClicks: 3,
          recentLinks: [link],
          topLinks: [link],
        })
      );
      return;
    }
    if (path === '/api/v1/settings' && request.method() === 'GET') {
      await route.fulfill(apiResponse(instanceSettings));
      return;
    }
    if (path === '/api/v1/settings' && request.method() === 'PUT') {
      Object.assign(instanceSettings, request.postDataJSON() as Record<string, string>);
      await route.fulfill(apiResponse({ message: 'Settings saved' }));
      return;
    }
    if (path === '/api/v1/webhooks/config' && request.method() === 'GET') {
      await route.fulfill(
        apiResponse({
          enabled: false,
          url: '',
          events: [],
          has_secret: false,
          available_events: ['health_check.failed', 'health_check.recovered'],
        })
      );
      return;
    }
    if (path === '/api/v1/links' && request.method() === 'GET') {
      await route.fulfill(
        apiResponse({
          items: [link],
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        })
      );
      return;
    }
    if (path === '/api/v1/links' && request.method() === 'POST') {
      const body = request.postDataJSON() as { slug?: string; long_url?: string; title?: string };
      await route.fulfill(
        apiResponse({
          ...link,
          id: 'link_smoke_created',
          slug: body.slug || 'created',
          long_url: body.long_url || link.long_url,
          title: body.title || null,
          clicks: 0,
        })
      );
      return;
    }
    if (path === '/api/v1/tags') {
      await route.fulfill(apiResponse([]));
      return;
    }
    if (path === '/api/v1/domains') {
      await route.fulfill(
        apiResponse([
          {
            id: 'domain_1',
            domain: 'go.example.com',
            is_default: 1,
            status: 'active',
            created_at: '2026-07-10T08:00:00.000Z',
            updated_at: '2026-07-10T08:00:00.000Z',
          },
        ])
      );
      return;
    }
    if (path === '/api/v1/backups') {
      await route.fulfill(
        apiResponse({
          items: [],
          total: 0,
          r2Configured: true,
          retentionDays: 30,
        })
      );
      return;
    }
    if (path === '/api/v1/system/capabilities') {
      await route.fulfill(
        apiResponse({
          profile: 'advanced',
          core: { d1: true, kv: true },
          advanced: {
            r2Backups: true,
            visitQueue: true,
            configuredDomains: 1,
            multipleDomains: false,
          },
        })
      );
      return;
    }
    if (path === '/api/v1/health-checks/batch' && request.method() === 'POST') {
      await route.fulfill(apiResponse({ items: [], total: 0, healthy: 0, warning: 0, broken: 0 }));
      return;
    }
    if (path === '/api/v1/health-checks/alerts' && request.method() === 'GET') {
      await route.fulfill(apiResponse({ items: [], last_alert_at: null }));
      return;
    }
    if (path === '/api/v1/health-checks/history' && request.method() === 'GET') {
      await route.fulfill(apiResponse({ items: [] }));
      return;
    }
    if (path.startsWith('/api/v1/public-stats/links/') && request.method() === 'GET') {
      await route.fulfill(apiResponse({ enabled: false }));
      return;
    }
    if (path === '/api/v1/analytics-views' && request.method() === 'GET') {
      await route.fulfill(apiResponse({ items: [] }));
      return;
    }
    if (path === '/api/v1/analytics-reports' && request.method() === 'GET') {
      await route.fulfill(
        apiResponse({
          config: { enabled: false, days: 30, saved_view_id: null },
          records: [],
          r2Configured: true,
        })
      );
      return;
    }
    if (path === '/api/v1/utm-templates' && request.method() === 'GET') {
      await route.fulfill(apiResponse({ items: [] }));
      return;
    }
    if (path.startsWith('/api/v1/link-notes/') && request.method() === 'GET') {
      await route.fulfill(apiResponse({ note: '' }));
      return;
    }
    if (path === '/api/v1/metadata/preview' && request.method() === 'POST') {
      await route.fulfill(
        apiResponse({
          title: 'Preview',
          description: 'Preview',
          image: null,
          final_url: 'https://example.com',
        })
      );
      return;
    }
    if (path === '/api/v1/links/duplicates' && request.method() === 'GET') {
      const excluded = url.searchParams.get('excludeId');
      await route.fulfill(
        apiResponse({
          normalized_url: url.searchParams.get('url'),
          items: excluded === link.id ? [] : [link],
          total: excluded === link.id ? 0 : 1,
          has_more: false,
        })
      );
      return;
    }
    if (path === `/api/v1/links/${link.id}` && request.method() === 'GET') {
      await route.fulfill(apiResponse(link));
      return;
    }
    if (path === `/api/v1/links/${link.id}` && request.method() === 'PUT') {
      await route.fulfill(apiResponse(link));
      return;
    }
    if (path === `/api/v1/links/${protectedLink.id}` && request.method() === 'GET') {
      await route.fulfill(apiResponse(protectedLink));
      return;
    }
    if (path === `/api/v1/links/${protectedLink.id}` && request.method() === 'PUT') {
      await route.fulfill(apiResponse({ ...protectedLink, password_protected: false }));
      return;
    }
    if (path === '/api/v1/links/migrate-domain/preview' && request.method() === 'POST') {
      await route.fulfill(
        apiResponse({
          source_domain: 's.y8o.de',
          target_domain: 'go.example.com',
          total: 195,
          target_registered: true,
          items: [
            {
              id: link.id,
              slug: link.slug,
              current_short_url: `https://s.y8o.de/${link.slug}`,
              next_short_url: `https://go.example.com/${link.slug}`,
            },
          ],
        })
      );
      return;
    }
    if (path === '/api/v1/notifications/config' && request.method() === 'GET') {
      await route.fulfill(
        apiResponse({
          channels: ['telegram', 'discord', 'slack', 'feishu', 'dingtalk', 'wecom'].map(
            (provider) => ({
              provider,
              enabled: false,
              configured: false,
              target: '',
            })
          ),
          available_providers: ['telegram', 'discord', 'slack', 'feishu', 'dingtalk', 'wecom'],
        })
      );
      return;
    }
    if (path === '/api/v1/import/preview' && request.method() === 'POST') {
      await route.fulfill(
        apiResponse({
          source: 'generic-csv',
          total: 1,
          valid: 1,
          invalid: 0,
          conflicts: 0,
          preview: [
            {
              slug: 'imported',
              longUrl: 'https://example.com/imported',
              _valid: true,
              _errors: [],
              _conflict: false,
            },
          ],
        })
      );
      return;
    }
    if (path === '/api/v1/import/confirm' && request.method() === 'POST') {
      await route.fulfill(apiResponse({ jobId: 'import_job_1', status: 'pending', total: 0 }));
      return;
    }
    if (path === '/api/v1/import/jobs/import_job_1' && request.method() === 'GET') {
      await route.fulfill(
        apiResponse({
          id: 'import_job_1',
          source: 'generic-csv',
          filename: 'links.csv',
          total_count: 1,
          success_count: 1,
          skipped_count: 0,
          conflict_count: 0,
          failed_count: 0,
          status: 'completed',
          report: null,
          created_at: '2026-07-14T08:00:00.000Z',
          completed_at: '2026-07-14T08:00:01.000Z',
        })
      );
      return;
    }
    if (path === '/api/v1/import/jobs' && request.method() === 'GET') {
      await route.fulfill(apiResponse([]));
      return;
    }
    if (path === '/api/v1/export/backup.json' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"version":1,"links":[]}',
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: '{"error":"mock missing"}',
    });
  });
}

async function authenticate(page: Page, locale: Locale, mode: 'simple' | 'advanced' = 'simple') {
  await page.addInitScript(
    ({ nextLocale, nextMode }) => {
      window.localStorage.setItem('linketry_token', 'smoke-token');
      window.localStorage.setItem('linketry.locale', nextLocale);
      window.localStorage.setItem('linketry_admin_mode', nextMode);
      if (!window.localStorage.getItem('linketry_theme')) {
        window.localStorage.setItem('linketry_theme', 'dark');
      }
    },
    { nextLocale: locale, nextMode: mode }
  );
}

test.beforeEach(async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });
  await mockAdminApi(page);
  await page.exposeFunction('__assertNoBrowserErrors', () => {
    expect(pageErrors).toEqual([]);
  });
});

test('login page switches between English and Simplified Chinese', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: messages.en.signIn })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: messages.en.deploymentAccessTitle })
  ).toBeVisible();
  await expect(page.getByText(messages.en.tokenHowToTitle)).toBeVisible();
  await expect(page.getByRole('button', { name: messages.en.showAdminToken })).toBeVisible();

  await page.getByLabel(messages.en.language).selectOption('zh-CN');

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('button', { name: messages['zh-CN'].signIn })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: messages['zh-CN'].deploymentAccessTitle })
  ).toBeVisible();
  await expect(page.getByText(messages['zh-CN'].tokenHowToTitle)).toBeVisible();
  await expect(page.getByLabel(messages['zh-CN'].language)).toHaveValue('zh-CN');
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

test('English core workflow renders overview, links, create link, and settings', async ({
  page,
}) => {
  await authenticate(page, 'en', 'advanced');
  await page.goto('/overview');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: messages.en.overview })).toBeVisible();
  await expect(page.getByText(messages.en.totalLinks)).toBeVisible();

  await page
    .getByRole('navigation')
    .getByRole('link', { name: messages.en.links, exact: true })
    .click();
  await expect(page.getByRole('heading', { name: messages.en.links })).toBeVisible();
  await expect(page.getByText('/docs', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: messages.en.migrateShortDomain }).click();
  await page.getByLabel(messages.en.sourceShortDomain).fill('s.y8o.de');
  await page.getByRole('button', { name: messages.en.previewMigration }).click();
  await expect(
    page.getByText(messages.en.domainMigrationCount.replace('{count}', '195'))
  ).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('main').getByRole('link', { name: messages.en.createLink }).click();
  await expect(page.getByRole('heading', { name: messages.en.createLink })).toBeVisible();
  await expect(page.getByLabel(messages.en.fallbackUrlOptional)).toBeVisible();
  await page.getByLabel(messages.en.destinationUrl).fill('https://example.com/new');
  await page.getByLabel(messages.en.customSlug).fill('new-docs');
  await page.getByRole('button', { name: messages.en.createLink }).click();
  await expect(page).toHaveURL(/\/links$/);

  await page.getByRole('navigation').getByRole('link', { name: messages.en.settings }).click();
  await expect(page.getByRole('heading', { name: messages.en.settings })).toBeVisible();
  await page.getByRole('button', { name: messages.en.saveSettings }).click();
  await expect(page.getByText(messages.en.settingsSaved)).toBeVisible();
  await expect(page.getByRole('heading', { name: messages.en.notificationChannels })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: messages.en.healthChecks }).click();
  await expect(
    page.getByRole('heading', { name: messages.en.scheduledTargetMonitoring })
  ).toBeVisible();
  await page.getByLabel(messages.en.enableHealthMonitoring).check();
  await page.getByRole('button', { name: messages.en.saveMonitoringSettings }).click();
  await expect(page.getByText(messages.en.monitoringSettingsSaved)).toBeVisible();

  await page
    .getByRole('navigation')
    .getByRole('link', { name: messages.en.operationsDashboard })
    .click();
  await expect(page.getByRole('heading', { name: messages.en.operationsDashboard })).toBeVisible();
  await page.getByRole('button', { name: messages.en.checkNow }).click();
  await expect(
    page.getByText(messages.en.allCheckedTargetsHealthy.replace('{count}', '0'))
  ).toBeVisible();
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

test('Simplified Chinese core workflow renders localized navigation and forms', async ({
  page,
}) => {
  await authenticate(page, 'zh-CN', 'advanced');
  await page.goto('/overview');

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: messages['zh-CN'].overview })).toBeVisible();
  await expect(page.getByText(messages['zh-CN'].totalLinks)).toBeVisible();

  await page
    .getByRole('navigation')
    .getByRole('link', { name: messages['zh-CN'].links, exact: true })
    .click();
  await expect(page.getByRole('heading', { name: messages['zh-CN'].links })).toBeVisible();
  await expect(page.getByText('/docs', { exact: true })).toBeVisible();

  await page.getByRole('main').getByRole('link', { name: messages['zh-CN'].createLink }).click();
  await expect(page.getByRole('heading', { name: messages['zh-CN'].createLink })).toBeVisible();
  await expect(page.getByLabel(messages['zh-CN'].destinationUrl)).toBeVisible();
  await expect(page.getByLabel(messages['zh-CN'].fallbackUrlOptional)).toBeVisible();

  await page
    .getByRole('navigation')
    .getByRole('link', { name: messages['zh-CN'].settings })
    .click();
  await expect(page.getByRole('heading', { name: messages['zh-CN'].settings })).toBeVisible();
  await expect(page.getByRole('main').getByLabel(messages['zh-CN'].language)).toHaveValue('zh-CN');
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

test('display preferences persist density and hide only optional navigation modules', async ({
  page,
}) => {
  await authenticate(page, 'en', 'advanced');
  await page.goto('/settings');

  const shell = page.locator('[data-sidebar-density][data-table-density]');
  await expect(shell).toHaveAttribute('data-sidebar-density', 'comfortable');
  await expect(shell).toHaveAttribute('data-table-density', 'comfortable');

  await page
    .getByRole('button', { name: `${messages.en.sidebarDensity}: ${messages.en.compact}` })
    .click();
  await page
    .getByRole('button', { name: `${messages.en.tableDensity}: ${messages.en.compact}` })
    .click();
  await expect(shell).toHaveAttribute('data-sidebar-density', 'compact');
  await expect(shell).toHaveAttribute('data-table-density', 'compact');

  const preferences = page
    .getByRole('heading', { name: messages.en.displayPreferences })
    .locator('xpath=ancestor::section');
  await preferences.getByRole('checkbox', { name: messages.en.analytics }).uncheck();
  await preferences.getByRole('checkbox', { name: messages.en.backups }).uncheck();
  await page.getByRole('button', { name: messages.en.saveDisplayPreferences }).click();
  await expect(page.getByText(messages.en.displayPreferencesSaved)).toBeVisible();

  const navigation = page.getByRole('navigation');
  await expect(navigation.getByRole('link', { name: messages.en.analytics })).toHaveCount(0);
  await expect(navigation.getByRole('link', { name: messages.en.backups })).toHaveCount(0);
  await expect(
    navigation.getByRole('link', { name: messages.en.links, exact: true })
  ).toBeVisible();
  await expect(navigation.getByRole('link', { name: messages.en.settings })).toBeVisible();

  await page.reload();
  await expect(shell).toHaveAttribute('data-sidebar-density', 'compact');
  await expect(shell).toHaveAttribute('data-table-density', 'compact');
  await expect(navigation.getByRole('link', { name: messages.en.backups })).toHaveCount(0);

  await page.goto('/backups');
  await expect(page.getByRole('heading', { name: messages.en.backups })).toBeVisible();
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

test('theme preference switches color tokens and persists across reloads', async ({ page }) => {
  await authenticate(page, 'en', 'advanced');
  await page.goto('/settings');

  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(root).toHaveAttribute('data-theme-preference', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(2, 6, 23)');

  const themePanel = page
    .getByRole('heading', { name: messages.en.theme })
    .locator('xpath=ancestor::section');
  await themePanel.getByRole('button', { name: new RegExp(`^${messages.en.lightTheme}`) }).click();

  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(root).toHaveAttribute('data-theme-preference', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(248, 250, 252)');
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(15, 23, 42)');
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveCSS('color', 'rgb(67, 56, 202)');
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('linketry_theme')))
    .toBe('light');

  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(root).toHaveAttribute('data-theme-preference', 'light');

  await themePanel.getByRole('button', { name: new RegExp(`^${messages.en.systemTheme}`) }).click();
  await expect(root).toHaveAttribute('data-theme-preference', 'system');
  await expect(root).toHaveAttribute('data-theme', /^(light|dark)$/);
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

test('duplicate destinations warn without blocking create and edit excludes the current link', async ({
  page,
}) => {
  await authenticate(page, 'en', 'advanced');
  await page.goto('/links/create');
  await page.getByLabel(messages.en.destinationUrl).fill(link.long_url);
  await expect(
    page.getByText(messages.en.duplicateDestinationWarning.replace('{count}', '1'))
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /\/docs/ })).toBeVisible();
  await page.getByLabel(messages.en.customSlug).fill('intentional-duplicate');
  await page.getByRole('button', { name: messages.en.createLink }).click();
  await expect(page).toHaveURL(/\/links$/);

  await page.goto(`/links/${link.id}/edit`);
  await expect(page.getByLabel(messages.en.destinationUrl)).toHaveValue(link.long_url);
  await page.waitForTimeout(500);
  await expect(page.getByText(/already used by/)).toHaveCount(0);
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

test('password defaults to empty and editing back to empty clears existing protection', async ({
  page,
}) => {
  await authenticate(page, 'en', 'advanced');
  await page.goto('/links/create');

  const createPassword = page.getByLabel(messages.en.passwordOptional);
  await expect(createPassword).toHaveValue('');
  await expect(createPassword).toHaveAttribute('autocomplete', 'new-password');
  await page.getByLabel(messages.en.destinationUrl).fill('https://example.com/public');
  await page.getByLabel(messages.en.customSlug).fill('public-docs');

  const createRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/links'
  );
  await page.getByRole('button', { name: messages.en.createLink }).click();
  const createBody = (await createRequestPromise).postDataJSON() as Record<string, unknown>;
  expect(createBody).not.toHaveProperty('password');

  await page.goto(`/links/${protectedLink.id}/edit`);
  const editPassword = page.getByLabel(messages.en.newPasswordOptional);
  await expect(editPassword).toHaveValue('');
  await expect(editPassword).toHaveAttribute('autocomplete', 'new-password');
  await editPassword.fill('temporary-password');
  await editPassword.fill('');

  const updateRequestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      new URL(request.url()).pathname === `/api/v1/links/${protectedLink.id}`
  );
  await page.getByRole('button', { name: messages.en.saveChanges }).click();
  const updateBody = (await updateRequestPromise).postDataJSON() as Record<string, unknown>;
  expect(updateBody.password).toBeNull();
  await expect(page).toHaveURL(/\/links$/);
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

test('completed import exits the importing state and clears the finished input', async ({
  page,
}) => {
  await authenticate(page, 'en', 'advanced');
  await page.goto('/import-export');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'links.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('slug,long_url\nimported,https://example.com/imported\n'),
  });
  await page.getByRole('button', { name: messages.en.preview, exact: true }).click();
  await page
    .getByRole('button', { name: messages.en.importLinksCount.replace('{count}', '1') })
    .click();

  await expect(
    page.getByText(
      messages.en.importComplete
        .replace('{success}', '1')
        .replace('{skipped}', '0')
        .replace('{failed}', '0')
    )
  ).toBeVisible();
  await expect(page.getByText(messages.en.importProcessing)).toHaveCount(0);
  await expect(page.getByText('links.csv')).toHaveCount(0);
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

declare global {
  interface Window {
    __assertNoBrowserErrors: () => void;
  }
}
