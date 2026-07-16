import { expect, test } from '@playwright/test';
import { supportedLocales } from '../src/i18n/locales';

test('registered locale options update and persist document language metadata', async ({
  page,
}) => {
  await page.goto('/');

  const language = page.getByLabel('Language');
  await expect(language.locator('option')).toHaveText(
    supportedLocales.map(({ nativeName }) => nativeName)
  );

  await language.selectOption('zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('linketry.locale')))
    .toBe('zh-CN');

  await page.reload();
  await expect(page.getByLabel('语言')).toHaveValue('zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
});
