# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: meal-selection.spec.ts >> 6pm homepage entry and all meal contents (desktop)
- Location: tests/browser/meal-selection.spec.ts:26:41

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('group', { name: 'Choose a meal' }).getByRole('button', { name: 'Dinner', exact: true })
Expected: "true"
Received: "false"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByRole('group', { name: 'Choose a meal' }).getByRole('button', { name: 'Dinner', exact: true }) with timeout 5000ms
  - waiting for getByRole('group', { name: 'Choose a meal' }).getByRole('button', { name: 'Dinner', exact: true })
    14 × locator resolved to <button type="button" aria-pressed="false">Dinner</button>
       - unexpected value "false"

```

```yaml
- button "Dinner"
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  |
  3  | // The server is fixed at 8am New York by this suite's synthetic-server config.
  4  | // The browser enters at 6pm: a server/prefetched Breakfast hint must expire.
  5  | const sixPm = new Date('2026-09-10T22:00:00Z');
  6  | const dishes = { Breakfast: 'breakfast omelet', Lunch: 'lunch soup', Dinner: 'dinner roast' };
  7  | async function assertMeal(page: Page, hall: string, label: keyof typeof dishes) {
> 8  |   await expect(page.getByRole('group', { name: 'Choose a meal' }).getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
     |                                                                                                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  9  |   await expect(page.locator('.livi-panelHeading:visible')).toContainText(`${label} MENU`);
  10 |   await expect(page.getByRole('heading', { name: `Synthetic ${hall} ${dishes[label]}`, exact: true })).toBeVisible();
  11 |   for (const other of Object.keys(dishes) as Array<keyof typeof dishes>) {
  12 |     if (other !== label) await expect(page.getByRole('heading', { name: `Synthetic ${hall} ${dishes[other]}`, exact: true })).toHaveCount(0);
  13 |   }
  14 | }
  15 | test.beforeEach(async ({ context, page }) => {
  16 |   await context.route('**/*', async route => {
  17 |     const url = new URL(route.request().url());
  18 |     if (url.origin === 'http://127.0.0.1:3217' && url.pathname === '/_vercel/insights/script.js') return route.fulfill({ contentType: 'application/javascript', body: '' });
  19 |     if (url.origin !== 'http://127.0.0.1:3217' || url.pathname.startsWith('/_vercel/')) {
  20 |       await route.abort(); throw new Error('Unexpected external/analytics request');
  21 |     }
  22 |     await route.continue();
  23 |   });
  24 |   await page.clock.setFixedTime(sixPm);
  25 | });
  26 | for (const mobile of [false, true]) test(`6pm homepage entry and all meal contents (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
  27 |   if (mobile) await page.setViewportSize({ width: 375, height: 812 });
  28 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  29 |   await page.goto('/');
  30 |   await page.getByRole('link', { name: 'Explore Livingston Dining Commons map and menu', exact: true }).click();
  31 |   await page.getByRole('button', { name: 'List view', exact: true }).click();
  32 |   await assertMeal(page, 'Livingston', 'Dinner');
  33 |   for (const label of ['Breakfast', 'Lunch', 'Dinner'] as const) {
  34 |     await page.getByRole('button', { name: label, exact: true }).click();
  35 |     await assertMeal(page, 'Livingston', label);
  36 |   }
  37 |   await page.getByRole('button', { name: 'Lunch', exact: true }).focus();
  38 |   await page.keyboard.press('Enter');
  39 |   await page.clock.setFixedTime(new Date('2026-09-11T00:30:00Z')); // still Sept 10 in Rutgers
  40 |   await page.getByRole('searchbox').fill('lunch soup');
  41 |   await assertMeal(page, 'Livingston', 'Lunch');
  42 |   await page.getByRole('button', { name: 'Add Synthetic Livingston lunch soup', exact: true }).click();
  43 |   await page.getByRole('button', { name: 'View your plate', exact: true }).click();
  44 |   await page.keyboard.press('Escape');
  45 |   await page.getByRole('searchbox').fill('');
  46 |   await assertMeal(page, 'Livingston', 'Lunch');
  47 |   expect(errors).toEqual([]);
  48 | });
  49 | test('direct entry, hall navigation, and unavailable menus retain honest content', async ({ page }) => {
  50 |   await page.goto('/hall/busch');
  51 |   await page.getByRole('button', { name: 'List view', exact: true }).click();
  52 |   await assertMeal(page, 'Busch', 'Dinner');
  53 |   await page.getByRole('button', { name: 'Breakfast', exact: true }).click();
  54 |   await assertMeal(page, 'Busch', 'Breakfast');
  55 |   await page.locator('.livi-hallPicker summary').click();
  56 |   await page.locator('.livi-hallOptions').getByRole('link', { name: 'Livingston Dining Commons', exact: true }).click();
  57 |   await page.getByRole('button', { name: 'List view', exact: true }).click();
  58 |   await assertMeal(page, 'Livingston', 'Dinner');
  59 |   await page.locator('.livi-hallPicker summary').click();
  60 |   await page.locator('.livi-hallOptions').getByRole('link', { name: 'Neilson Dining Hall', exact: true }).click();
  61 |   await expect(page.getByRole('heading', { name: 'Menu unavailable right now.', exact: true })).toBeVisible();
  62 |   await expect(page.getByRole('article')).toHaveCount(0);
  63 |   await expect(page.locator('body')).not.toContainText(/Backup menu|Sample menu|Updated recently/);
  64 | });
  65 |
```
