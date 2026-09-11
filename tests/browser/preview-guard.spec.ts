import { test, expect } from '@playwright/test';

test('normal production build does not expose Preview verification pages', async ({ page, context, baseURL }) => {
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== baseURL || url.pathname.startsWith('/_vercel/')) return route.abort();
    return route.continue();
  });
  for (const path of ['/preview-check', '/preview-check/unavailable', '/preview-check/meals']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).not.toContainText(/Function runtime evidence|Controlled Preview check|Preview release verification/);
  }
});
