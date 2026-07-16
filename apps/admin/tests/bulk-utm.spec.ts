import { expect, test } from '@playwright/test';
import { LINKETRY_VERSION } from '../../../packages/shared/src/version';
import { messages } from '../src/i18n/messages';

const link = {
  id: 'link_1',
  slug: 'docs',
  domain: 'go.example.com',
  long_url: 'https://example.com/docs?a=%2f',
  title: 'Docs',
  description: null,
  tags: null,
  status: 'active',
  redirect_type: 302,
  clicks: 1,
  source: null,
  source_id: null,
  created_at: '2026-07-15T00:00:00.000Z',
  updated_at: '2026-07-15T00:00:00.000Z',
  last_clicked_at: null,
  expires_at: null,
  max_clicks: null,
  password_hash: null,
  password_protected: false,
  warning_enabled: 0,
  fallback_url: null,
  archived: 0,
};

function ok(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  };
}

test('filtered bulk UTM requires preview and downloads the confirmed change record', async ({
  page,
}) => {
  let previewBody: Record<string, unknown> | null = null;
  let confirmBody: Record<string, unknown> | null = null;
  await page.addInitScript((currentVersion) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_admin_mode', 'advanced');
    localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: currentVersion, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);
  await page.route('**/*', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!path.startsWith('/api/v1/')) return route.fallback();
    if (path === '/api/v1/auth/me')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"success":true}',
      });
    if (path === '/api/v1/settings') return route.fulfill(ok({ default_domain: 'go.example.com' }));
    if (path === '/api/v1/links' && request.method() === 'GET') {
      return route.fulfill(ok({ items: [link], total: 1, page: 1, pageSize: 20, totalPages: 1 }));
    }
    if (path === '/api/v1/links/bulk-utm/preview') {
      previewBody = request.postDataJSON();
      return route.fulfill(
        ok({
          scope: { type: 'filtered', total: 1, requested: 1, not_found: 0 },
          items: [
            {
              id: link.id,
              slug: link.slug,
              current_url: link.long_url,
              next_url: `${link.long_url}&utm_source=newsletter`,
              status: 'ready',
              conflicts: [],
              error: null,
            },
          ],
          ready: 1,
          unchanged: 0,
          invalid: 0,
          conflicts: 0,
          limit: 100,
          limit_exceeded: false,
        })
      );
    }
    if (path === '/api/v1/links/bulk-utm/confirm') {
      confirmBody = request.postDataJSON();
      return route.fulfill(
        ok({
          changed: 1,
          skipped: 0,
          change_csv: 'id,slug,old_url,new_url,mode,parameters,changed_at\r\n',
        })
      );
    }
    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: '{"error":"missing mock"}',
    });
  });

  await page.goto('/links?tag=docs');
  await page.getByRole('button', { name: messages.en.bulkUtm }).click();
  await expect(page.getByRole('heading', { name: messages.en.bulkUtmTitle })).toBeVisible();
  await page.getByLabel('utm_source', { exact: true }).fill('newsletter');
  await page.getByRole('button', { name: messages.en.previewChanges }).click();
  await expect(
    page.getByText(
      messages.en.bulkUtmPreviewSummary
        .replace('{total}', '1')
        .replace('{ready}', '1')
        .replace('{unchanged}', '0')
        .replace('{invalid}', '0')
    )
  ).toBeVisible();
  await page.getByRole('button', { name: messages.en.bulkUtmApply }).click();
  await expect(
    page.getByText(messages.en.bulkUtmComplete.replace('{changed}', '1').replace('{skipped}', '0'))
  ).toBeVisible();

  expect(previewBody).toMatchObject({
    mode: 'add_missing',
    parameters: ['utm_source'],
    values: { utm_source: 'newsletter' },
    scope: { type: 'filtered', filters: { tag: 'docs' } },
  });
  expect(confirmBody).toMatchObject({ mode: 'add_missing', parameters: ['utm_source'] });
});
