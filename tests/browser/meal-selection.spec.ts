import { test, expect, type Page } from '@playwright/test';

// The server is fixed at 8am New York by this suite's synthetic-server config.
// The browser enters at 6pm: a server/prefetched Breakfast hint must expire.
const sixPm = new Date('2026-09-10T22:00:00Z');
const dishes = { Breakfast: 'breakfast omelet', Lunch: 'lunch soup', Dinner: 'dinner roast' };
async function assertMeal(page: Page, hall: string, label: keyof typeof dishes) {
  await expect(page.getByRole('group', { name: 'Choose a meal' }).getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.livi-panelHeading:visible')).toContainText(`${label} MENU`);
  await expect(page.getByRole('region', { name: 'Menu items', exact: true }).getByRole('heading', { name: `Synthetic ${hall} ${dishes[label]}`, exact: true })).toBeVisible();
  for (const other of Object.keys(dishes) as Array<keyof typeof dishes>) {
    if (other !== label) await expect(page.getByRole('region', { name: 'Menu items', exact: true }).getByRole('heading', { name: `Synthetic ${hall} ${dishes[other]}`, exact: true })).toHaveCount(0);
  }
}
test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:3217' && url.pathname === '/_vercel/insights/script.js') return route.fulfill({ contentType: 'application/javascript', body: '' });
    if (url.origin !== 'http://127.0.0.1:3217' || url.pathname.startsWith('/_vercel/')) {
      await route.abort(); throw new Error('Unexpected external/analytics request');
    }
    await route.continue();
  });
  await page.clock.setFixedTime(sixPm);
});
for (const mobile of [false, true]) test(`6pm homepage entry and all meal contents (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
  if (mobile) await page.setViewportSize({ width: 375, height: 812 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore Livingston Dining Commons map and menu', exact: true }).click();
  await page.getByRole('button', { name: mobile ? 'Menu' : 'List view', exact: true }).click();
  await assertMeal(page, 'Livingston', 'Dinner');
  for (const label of ['Breakfast', 'Lunch', 'Dinner'] as const) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await assertMeal(page, 'Livingston', label);
  }
  await page.getByRole('button', { name: 'Lunch', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.clock.setFixedTime(new Date('2026-09-11T00:30:00Z')); // still Sept 10 in Rutgers
  await page.getByRole('searchbox').fill('lunch soup');
  await assertMeal(page, 'Livingston', 'Lunch');
  await page.getByRole('button', { name: 'Add Synthetic Livingston lunch soup', exact: true }).click();
  await page.getByRole('button', { name: mobile ? 'Open plate' : 'View your plate', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'My Plate', exact: true }).getByRole('button', { name: 'Close plate', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'My Plate', exact: true })).not.toBeVisible();
  await page.getByRole('searchbox').fill('');
  await assertMeal(page, 'Livingston', 'Lunch');
  expect(errors).toEqual([]);
});
test('direct entry, hall navigation, and unavailable menus retain honest content', async ({ page }) => {
  await page.goto('/hall/busch');
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await assertMeal(page, 'Busch', 'Dinner');
  await page.getByRole('button', { name: 'Breakfast', exact: true }).click();
  await assertMeal(page, 'Busch', 'Breakfast');
  await page.locator('.livi-hallPicker summary').click();
  await page.locator('.livi-hallOptions').getByRole('link', { name: 'Livingston Dining Commons', exact: true }).click();
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await assertMeal(page, 'Livingston', 'Dinner');
  await page.locator('.livi-hallPicker summary').click();
  await page.locator('.livi-hallOptions').getByRole('link', { name: 'Neilson Dining Hall', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Menu unavailable right now.', exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Backup menu|Sample menu|Updated recently/);
});

for (const mobile of [false, true]) test(`Atrium Nutrislice homepage entry, meal contents and plate (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
  if (mobile) await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore The Atrium map and menu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Dinner', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: mobile ? 'Menu' : 'List view', exact: true }).click();
  const foods = page.getByRole('region', { name: 'Menu items', exact: true });
  for (const label of ['Breakfast', 'Lunch', 'Dinner'] as const) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('.livi-panelHeading:visible')).toContainText(`${label} MENU`);
    await expect(foods.getByRole('heading', { name: label === 'Breakfast' ? 'COUNTRY STYLE GRITS' : 'CHICKEN NOODLE SOUP', exact: true })).toBeVisible();
    await expect(foods.getByRole('heading', { name: label === 'Breakfast' ? 'CHICKEN NOODLE SOUP' : 'COUNTRY STYLE GRITS', exact: true })).toHaveCount(0);
    await expect(foods.locator('.livi-foodRow')).toHaveCount(label === 'Breakfast' ? 42 : 167);
  }
  // The captured Rutgers Lunch and Dinner genuinely list the same dishes.
  // Meal-specific item identity still prevents one meal being mislabeled as another.
  await page.getByRole('button', { name: 'Breakfast', exact: true }).click();
  await page.getByRole('searchbox').fill('COUNTRY STYLE GRITS');
  await page.getByRole('button', { name: 'Add COUNTRY STYLE GRITS', exact: true }).click();
  await page.getByRole('button', { name: 'Add COUNTRY STYLE GRITS, 1 already on plate', exact: true }).click();
  await page.getByRole('button', { name: mobile ? 'Open plate' : 'View your plate', exact: true }).click();
  const dialog=page.getByRole('dialog',{name:'My Plate',exact:true});
  await expect(dialog.getByRole('button',{name:'Close plate',exact:true})).toBeFocused();
  await expect(dialog).toContainText('280');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Breakfast',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(foods.getByRole('heading',{name:'COUNTRY STYLE GRITS',exact:true})).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Backup menu|Sample menu|Updated recently/);
});
