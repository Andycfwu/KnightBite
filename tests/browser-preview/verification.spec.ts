import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://127.0.0.1:3217' || url.pathname.startsWith('/_vercel/')) {
      await route.abort();
      throw new Error(`Unexpected external/analytics request: ${url.origin}${url.pathname}`);
    }
    await route.continue();
  });
});

test('Preview omits analytics on dynamic and static routes and reports runtime/effective headers', async ({ page }) => {
  await page.goto('/preview-check');
  const runtime = JSON.parse(await page.getByLabel('Function runtime evidence').innerText());
  expect(runtime.node).toBe(process.versions.node);
  expect(runtime.environment).toBe('preview');
  expect(Math.abs(Date.now() - Date.parse(runtime.observedAt))).toBeLessThan(10_000);
  await page.getByRole('button', { name: 'Check profile and static headers', exact: true }).click();
  const status = page.getByRole('status');
  await expect(status).toContainText('content-security-policy');
  const records = JSON.parse(await status.innerText());
  expect(records).toHaveLength(2);
  expect(records[0].status).toBe(200);
  expect(records[0].headers['x-frame-options']).toBe('DENY');
  expect(records[0].headers['content-security-policy']).not.toContain('unsafe-eval');
  expect(records[1].path).toMatch(/^\/_next\/static\//);
  expect(records[1].headers['cache-control']).toContain('immutable');
  expect(await page.locator('script[src*="/_vercel/insights"]').count()).toBe(0);
  await page.goto('/profile');
  await page.getByRole('switch', { name: 'Vegan', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Vegan', exact: true })).toHaveAttribute('aria-checked', 'true');
  expect(await page.locator('script[src*="/_vercel/insights"]').count()).toBe(0);
});

test('hosted-check route renders an explicitly controlled unavailable Rutgers date without food', async ({ page }) => {
  await page.goto('/preview-check/unavailable');
  await expect(page.getByRole('complementary', { name: 'Controlled Preview scenario' })).toContainText('2026-09-11T00:30:00Z');
  await expect(page.getByRole('main').getByText('Thursday, September 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Menu unavailable right now.', exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Add / })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Backup menu|Sample menu|Retrieved|Updated recently/);
});
