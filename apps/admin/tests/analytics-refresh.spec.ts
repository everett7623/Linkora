import { expect, test, type Page } from '@playwright/test';
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

async function prepareAnalytics(page: Page) {
  await page.addInitScript((version) => {
    localStorage.setItem('linketry_token', 'test-token');
    localStorage.setItem('linketry.locale', 'en');
    localStorage.setItem('linketry_admin_mode', 'advanced');
    localStorage.setItem('linketry_analytics_auto_refresh', 'true');
    localStorage.setItem('linketry_analytics_refresh_interval', '10');
    localStorage.setItem(
      'linketry_update_check',
      JSON.stringify({ latestVersion: version, checkedAt: Date.now() })
    );
  }, LINKETRY_VERSION);
}

test('Analytics supports manual refresh and persistent near-real-time controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareAnalytics(page);
  let analyticsRequests = 0;
  let analyticsTimezoneOffset: string | null = null;

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
    if (path === '/api/v1/analytics') {
      analyticsRequests += 1;
      analyticsTimezoneOffset = new URL(route.request().url()).searchParams.get('timezone_offset');
      await route.fulfill(
        apiResponse({
          days: 30,
          timezoneOffsetMinutes: 480,
          rangeStart: '2026-06-21T16:00:00.000Z',
          rangeEnd: '2026-07-21T16:00:00.000Z',
          totalClicks: analyticsRequests,
          botClicks: 0,
          uniqueVisitors: analyticsRequests,
          uniqueLinks: 1,
          eligibleClicks: 25,
          conversionsTotal: 4,
          conversionRate: 16,
          conversionAttributionAvailable: true,
          daily: [
            { date: '2026-07-17', clicks: 12, humanClicks: 11, botClicks: 1, uniqueVisitors: 9 },
            { date: '2026-07-18', clicks: 18, humanClicks: 16, botClicks: 2, uniqueVisitors: 13 },
            { date: '2026-07-19', clicks: 9, humanClicks: 9, botClicks: 0, uniqueVisitors: 7 },
            { date: '2026-07-20', clicks: 21, humanClicks: 19, botClicks: 2, uniqueVisitors: 15 },
            { date: '2026-07-21', clicks: 24, humanClicks: 22, botClicks: 2, uniqueVisitors: 17 },
          ],
          previousPeriod: {
            rangeStart: '2026-05-22T16:00:00.000Z',
            rangeEnd: '2026-06-21T16:00:00.000Z',
            totalClicks: 70,
            humanClicks: 65,
            botClicks: 5,
            uniqueVisitors: 41,
            daily: [
              { date: '2026-06-17', clicks: 10, humanClicks: 9, botClicks: 1, uniqueVisitors: 8 },
              { date: '2026-06-18', clicks: 14, humanClicks: 13, botClicks: 1, uniqueVisitors: 11 },
              { date: '2026-06-19', clicks: 8, humanClicks: 8, botClicks: 0, uniqueVisitors: 7 },
              { date: '2026-06-20', clicks: 20, humanClicks: 18, botClicks: 2, uniqueVisitors: 14 },
              { date: '2026-06-21', clicks: 18, humanClicks: 17, botClicks: 1, uniqueVisitors: 13 },
            ],
          },
          hourlyHeatmap: [
            { weekday: 1, hour: 9, clicks: 18, humanClicks: 17, botClicks: 1 },
            { weekday: 2, hour: 14, clicks: 12, humanClicks: 11, botClicks: 1 },
            { weekday: 5, hour: 20, clicks: 8, humanClicks: 7, botClicks: 1 },
          ],
          topLinks: [],
          topCountries: ['US', 'DE', 'SG', 'GB', 'CA', 'JP', 'AU', 'FR', 'BR', 'IN'].map(
            (country, index) => ({ country, clicks: 20 - index })
          ),
          geography: {
            countries: ['US', 'DE', 'SG', 'GB', 'CA', 'JP', 'AU', 'FR', 'BR', 'IN'].map(
              (country, index) => ({ country, clicks: 20 - index })
            ),
            mappedClicks: 155,
            unknownClicks: 2,
          },
          topReferrers: [],
          topBrowsers: [
            { browser: 'Chrome', clicks: 46 },
            { browser: 'Safari', clicks: 22 },
          ],
          topDevices: [
            { device_type: 'desktop', clicks: 48 },
            { device_type: 'mobile', clicks: 31 },
            { device_type: 'bot', clicks: 5 },
          ],
          topOperatingSystems: [],
          topUtmSources: [],
          topUtmMediums: [],
          topUtmCampaigns: [],
          topUtmTerms: [],
          topUtmContents: [],
          topTargets: [
            {
              target_url:
                'https://example.com/a/very/long/analytics/target?utm_source=linketry&utm_campaign=mobile-overflow-regression',
              clicks: 12,
            },
          ],
          topConversionEvents: [
            {
              event_name: 'signup',
              currency: 'USD',
              conversions: 4,
              value_total: 54,
            },
          ],
          recentVisits: [],
        })
      );
      return;
    }
    if (path === '/api/v1/analytics-views') {
      await route.fulfill(apiResponse({ items: [] }));
      return;
    }
    if (path === '/api/v1/analytics-reports') {
      await route.fulfill(
        apiResponse({
          config: { enabled: false, days: 30, saved_view_id: null },
          records: [],
          r2Configured: false,
        })
      );
      return;
    }
    if (path === '/api/v1/analytics-alerts') {
      await route.fulfill(
        apiResponse({
          config: {
            enabled: false,
            minimumVisits: 50,
            volumeMultiplier: 2,
            botRateDeltaPercentagePoints: 25,
            suppressionMinutes: 1440,
          },
          state: { active: [] },
        })
      );
      return;
    }
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"mock"}' });
  });

  await page.goto('/analytics');
  await expect(
    page.getByRole('heading', { name: messages.en.analytics, exact: true })
  ).toBeVisible();
  await expect.poll(() => analyticsRequests).toBeGreaterThan(0);
  await expect.poll(() => analyticsTimezoneOffset).not.toBeNull();
  await expect(page.getByTestId('traffic-trend-panel')).toBeVisible();
  await expect(page.getByTestId('period-comparison')).toBeVisible();
  await expect(page.getByTestId('activity-heatmap')).toBeVisible();
  await expect(page.getByText(messages.en.previousSeries, { exact: true })).toBeVisible();
  await expect(page.getByTestId('world-traffic-map')).toBeVisible();
  await expect(page.getByTestId('audience-composition')).toBeVisible();
  const areaChart = page.getByRole('button', { name: messages.en.areaChart });
  await areaChart.click();
  await expect(areaChart).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() => page.locator('main').evaluate((main) => main.scrollWidth === main.clientWidth))
    .toBe(true);
  await expect(page.getByLabel(messages.en.country)).toHaveCount(0);
  const advancedFilters = page.getByRole('button', {
    name: messages.en.advancedAnalyticsFilters,
  });
  await expect(advancedFilters).toHaveAttribute('aria-expanded', 'false');
  await advancedFilters.click();
  await expect(page.getByLabel(messages.en.country)).toBeVisible();
  await expect(advancedFilters).toHaveAttribute('aria-expanded', 'true');
  await expect
    .poll(() => page.locator('main').evaluate((main) => main.scrollWidth === main.clientWidth))
    .toBe(true);

  const conversionInsights = page.getByTestId('conversion-insights');
  await expect(
    conversionInsights.getByText(messages.en.humanClicks, { exact: true })
  ).toBeVisible();
  await expect(conversionInsights.getByText('25', { exact: true })).toBeVisible();
  await expect(
    conversionInsights.getByTestId('conversion-values').getByText('$54.00', { exact: true })
  ).toBeVisible();
  await expect(conversionInsights.getByText('signup', { exact: true })).toBeVisible();
  const distributionColors = await page
    .getByTestId('world-traffic-map')
    .getByTestId('traffic-intensity-swatch')
    .evaluateAll((swatches) => swatches.map((swatch) => getComputedStyle(swatch).backgroundColor));
  expect(distributionColors).toHaveLength(10);
  expect(new Set(distributionColors).size).toBe(10);
  await expectNoSeriousAccessibilityViolations(page);
  const requestsBeforeManualRefresh = analyticsRequests;

  await page.getByRole('button', { name: messages.en.refreshAnalyticsNow }).click();
  await expect.poll(() => analyticsRequests).toBe(requestsBeforeManualRefresh + 1);

  const autoRefresh = page.getByRole('checkbox', { name: messages.en.autoRefresh });
  await expect(autoRefresh).toBeChecked();
  await autoRefresh.uncheck();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry_analytics_auto_refresh')))
    .toBe('false');

  await autoRefresh.check();
  const interval = page.getByRole('combobox', { name: messages.en.autoRefreshInterval });
  await interval.selectOption('5');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry_analytics_refresh_interval')))
    .toBe('5');
});
