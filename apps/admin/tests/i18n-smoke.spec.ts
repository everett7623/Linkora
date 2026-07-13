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

function apiResponse(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

async function mockAdminApi(page: Page) {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (!path.startsWith('/api/')) {
      await route.fallback();
      return;
    }

    if (path === '/api/auth/login') {
      await route.fulfill(apiResponse({ authenticated: true }));
      return;
    }
    if (path === '/api/auth/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      return;
    }
    if (path === '/api/overview') {
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
    if (path === '/api/settings' && request.method() === 'GET') {
      await route.fulfill(
        apiResponse({
          site_name: 'Linkora',
          default_domain: 'go.example.com',
          default_redirect_type: '302',
          analytics_retention_days: '0',
          backup_retention_days: '30',
          health_monitoring_enabled: 'false',
          health_monitoring_limit: '20',
          health_failure_threshold: '2',
          health_alert_suppression_minutes: '1440',
        })
      );
      return;
    }
    if (path === '/api/settings' && request.method() === 'PUT') {
      await route.fulfill(apiResponse({ message: 'Settings saved' }));
      return;
    }
    if (path === '/api/webhooks/config' && request.method() === 'GET') {
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
    if (path === '/api/links' && request.method() === 'GET') {
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
    if (path === '/api/links' && request.method() === 'POST') {
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
    if (path === '/api/tags') {
      await route.fulfill(apiResponse([]));
      return;
    }
    if (path === '/api/domains') {
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
    if (path === '/api/backups') {
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
    if (path === '/api/system/capabilities') {
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
    if (path === '/api/health-checks/batch' && request.method() === 'POST') {
      await route.fulfill(
        apiResponse({ items: [], total: 0, healthy: 0, warning: 0, broken: 0 })
      );
      return;
    }
    if (path === '/api/health-checks/alerts' && request.method() === 'GET') {
      await route.fulfill(apiResponse({ items: [], last_alert_at: null }));
      return;
    }
    if (path === '/api/health-checks/history' && request.method() === 'GET') {
      await route.fulfill(apiResponse({ items: [] }));
      return;
    }
    if (path.startsWith('/api/public-stats/links/') && request.method() === 'GET') {
      await route.fulfill(apiResponse({ enabled: false }));
      return;
    }
    if (path === '/api/analytics-views' && request.method() === 'GET') {
      await route.fulfill(apiResponse({ items: [] }));
      return;
    }
    if (path === '/api/analytics-reports' && request.method() === 'GET') {
      await route.fulfill(apiResponse({ config: { enabled: false, days: 30, saved_view_id: null }, records: [], r2Configured: true }));
      return;
    }
    if (path === '/api/utm-templates' && request.method() === 'GET') {
      await route.fulfill(apiResponse({ items: [] }));
      return;
    }
    if (path.startsWith('/api/link-notes/') && request.method() === 'GET') {
      await route.fulfill(apiResponse({ note: '' }));
      return;
    }
    if (path === '/api/metadata/preview' && request.method() === 'POST') {
      await route.fulfill(apiResponse({ title: 'Preview', description: 'Preview', image: null, final_url: 'https://example.com' }));
      return;
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock missing"}' });
  });
}

async function authenticate(page: Page, locale: Locale, mode: 'simple' | 'advanced' = 'simple') {
  await page.addInitScript(
    ({ nextLocale, nextMode }) => {
      window.localStorage.setItem('linkora_token', 'smoke-token');
      window.localStorage.setItem('linkora.locale', nextLocale);
      window.localStorage.setItem('linkora_admin_mode', nextMode);
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

  await page.getByLabel(messages.en.language).selectOption('zh-CN');

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('button', { name: messages['zh-CN'].signIn })).toBeVisible();
  await expect(page.getByLabel(messages['zh-CN'].language)).toHaveValue('zh-CN');
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

test('English core workflow renders overview, links, create link, and settings', async ({ page }) => {
  await authenticate(page, 'en', 'advanced');
  await page.goto('/overview');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: messages.en.overview })).toBeVisible();
  await expect(page.getByText(messages.en.totalLinks)).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: messages.en.links, exact: true }).click();
  await expect(page.getByRole('heading', { name: messages.en.links })).toBeVisible();
  await expect(page.getByText('/docs', { exact: true })).toBeVisible();

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

  await page
    .getByRole('navigation')
    .getByRole('link', { name: messages.en.operationsDashboard })
    .click();
  await expect(page.getByRole('heading', { name: messages.en.operationsDashboard })).toBeVisible();
  await page.getByRole('button', { name: messages.en.checkNow }).click();
  await expect(page.getByText(messages.en.allCheckedTargetsHealthy.replace('{count}', '0'))).toBeVisible();
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

test('Simplified Chinese core workflow renders localized navigation and forms', async ({ page }) => {
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

  await page.getByRole('navigation').getByRole('link', { name: messages['zh-CN'].settings }).click();
  await expect(page.getByRole('heading', { name: messages['zh-CN'].settings })).toBeVisible();
  await expect(page.getByRole('main').getByLabel(messages['zh-CN'].language)).toHaveValue('zh-CN');
  await page.evaluate(() => window.__assertNoBrowserErrors());
});

declare global {
  interface Window {
    __assertNoBrowserErrors: () => void;
  }
}
