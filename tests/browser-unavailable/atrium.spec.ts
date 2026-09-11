import { test, expect } from '@playwright/test';

test('Atrium failure settles with the requested Rutgers date and usable mobile navigation', async ({ page, context }) => {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:3217' && url.pathname === '/_vercel/insights/script.js') {
      return route.fulfill({ contentType: 'application/javascript', body: '' });
    }
    if (url.origin !== 'http://127.0.0.1:3217' || url.pathname.startsWith('/_vercel/')) {
      await route.abort();
      throw new Error(`Unexpected external/analytics request: ${url.origin}${url.pathname}`);
    }
    await route.continue();
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/hall/atrium');
  await expect(page.getByRole('heading', { name: /^(Breakfast|Lunch|Dinner) menu unavailable right now\.$/ })).toBeVisible();
  await expect(page.getByRole('main').getByText('Tuesday, September 8', { exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByText(/We couldn’t load (breakfast|lunch|dinner) for this hall on the requested date\./)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Add / })).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Backup menu|Sample menu|Retrieved|Updated recently|Wednesday, September 9|Loading your dining hall/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const navigation = page.getByRole('navigation', { name: 'Dining navigation', exact: true });
  await navigation.getByRole('button', { name: 'My plate', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'My Plate', exact: true })).toContainText('Your plate is empty');
  await page.keyboard.press('Escape');
  await navigation.getByRole('link', { name: 'Halls', exact: true }).click();
  await expect(page.getByRole('main').getByText('2 menus confirmed for today', { exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByText('Menu status unavailable', { exact: true })).toHaveCount(2);
  expect(errors).toEqual([]);
});
