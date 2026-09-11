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
  await expect(page.getByRole('heading', { name: /^(Breakfast|Lunch|Dinner) menu unavailable right now\.$/ })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Add / })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Backup menu|Sample menu|Retrieved|Updated recently/);
});

test('6pm entry selects Dinner; manual meal survives search, filters and plate interaction', async ({ page }) => {
  await page.goto('/preview-check/meals');
  await expect(page.getByRole('complementary', { name: 'Controlled Preview scenario' })).toContainText('Controlled 6pm America/New_York');
  const meals = page.getByRole('group', { name: 'Choose a meal' });
  await expect(meals.getByRole('button', { name: 'Dinner', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await meals.getByRole('button', { name: 'Breakfast', exact: true }).click();
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await expect(page.locator('.livi-panelHeading:visible')).toContainText('Breakfast MENU');
  await page.clock.setFixedTime(new Date('2026-09-11T02:00:00Z'));
  await page.getByRole('searchbox').fill('no-such-food');
  await expect(page.getByRole('heading', { name: 'No matching items', exact: true })).toBeVisible();
  await expect(meals.getByRole('button', { name: 'Breakfast', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: 'Add Synthetic rice', exact: true }).first().click();
  await page.getByRole('button', { name: 'View your plate', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'My Plate', exact: true }).getByRole('button', { name: 'Close plate', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(meals.getByRole('button', { name: 'Breakfast', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.livi-panelHeading:visible')).toContainText('Breakfast MENU');
});

test('station statuses use unfiltered meal evidence and empty controls explain on keyboard and touch', async ({ page }) => {
  await page.goto('/preview-check/meals');
  const listed = page.locator('.livi-legend button[data-menu-state="listed"]');
  const listedCount = await listed.count();
  expect(listedCount).toBeGreaterThan(0);
  await page.getByRole('searchbox').fill('no-such-food');
  await expect(listed).toHaveCount(listedCount);
  const empty = page.locator('.livi-legend button[data-menu-state="empty"]').first();
  await expect(empty).toContainText('No items listed for dinner');
  await empty.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'No items listed for dinner', exact: true })).toBeVisible();
  await expect(page.locator('#busch-food-panel:visible')).toBeFocused();
  await expect(empty).toBeEnabled();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Breakfast', exact: true }).click();
  await empty.click();
  await expect(page.getByRole('heading', { name: 'No items listed for breakfast', exact: true })).toBeVisible();
  await expect(empty).toContainText('No items listed for breakfast');
  await page.goto('/hall/neilson');
  await expect(page.locator('.livi-legend button[data-menu-state="empty"]')).toHaveCount(0);
  await expect(page.locator('.livi-legend button[data-menu-state="unavailable"]').first()).toContainText('Menu status unavailable');
});


test('Livingston stale Breakfast hint resolves at 6pm and all three distinct meals survive prop refresh', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/preview-check/meals?hall=livingston');
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Synthetic Livingston dinner roast', exact: true })).toBeVisible();
  for (const [label, dish] of [['Breakfast', 'breakfast omelet'], ['Lunch', 'lunch soup'], ['Dinner', 'dinner roast']] as const) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.getByRole('button', { name: 'Rerender same menu', exact: true }).click();
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.livi-panelHeading:visible')).toContainText(`${label} MENU`);
    await expect(page.getByRole('heading', { name: `Synthetic Livingston ${dish}`, exact: true })).toBeVisible();
    for (const other of ['breakfast omelet', 'lunch soup', 'dinner roast']) {
      if (other !== dish) await expect(page.getByRole('heading', { name: `Synthetic Livingston ${other}`, exact: true })).toHaveCount(0);
    }
  }
  expect(errors).toEqual([]);
});

test('Atrium Nutrislice 6pm selection and manual meal contents survive prop refresh', async ({page})=>{
  await page.goto('/preview-check/meals?hall=atrium');
  await expect(page.getByRole('button',{name:'Dinner',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'List view',exact:true}).click();
  for(const [meal,dish,count] of [['Breakfast','COUNTRY STYLE GRITS',42],['Lunch','CHICKEN NOODLE SOUP',167],['Dinner','CHICKEN NOODLE SOUP',167]] as const){
    await page.getByRole('button',{name:meal,exact:true}).click();
    await page.getByRole('button',{name:'Rerender same menu',exact:true}).click();
    await expect(page.getByRole('button',{name:meal,exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('.livi-panelHeading:visible')).toContainText(`${meal} MENU`);
    await expect(page.getByRole('heading',{name:dish,exact:true})).toBeVisible();
    await expect(page.getByRole('region',{name:'Menu items',exact:true}).locator('.livi-foodRow')).toHaveCount(count);
  }
  expect(await page.locator('script[src*="/_vercel/insights"]').count()).toBe(0);
});

for (const mobile of [false, true]) test(`partial missing Dinner stays selected and retry recovers content without resetting manual choice (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
  if (mobile) await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/preview-check/partial?hall=livingston');
  const controls=page.getByRole('group',{name:'Choose a meal'});
  await expect(controls.getByRole('button')).toHaveCount(3);
  await expect(controls.getByRole('button',{name:'Dinner',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('heading',{name:'Dinner menu unavailable right now.',exact:true})).toBeVisible();
  await expect(page.locator('.livi-source:visible')).not.toContainText(/Retrieved|Listed on Rutgers/);
  await expect(page.getByRole('article')).toHaveCount(0);
  expect((await page.getByRole('button',{name:'Retry Dinner',exact:true}).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Retry Dinner',exact:true}).click();
  await controls.getByRole('button',{name:'Breakfast',exact:true}).click();
  await page.getByRole('button',{name:mobile?'Menu':'List view',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Synthetic Livingston breakfast omelet',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Add Synthetic Livingston breakfast omelet',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'dinner menu loaded.'})).toHaveText('dinner menu loaded.');
  await expect(controls.getByRole('button',{name:'Breakfast',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Rerender partial menu',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Synthetic Livingston breakfast omelet',exact:true})).toBeVisible();
  await controls.getByRole('button',{name:'Dinner',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Synthetic Livingston dinner roast',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Synthetic Livingston breakfast omelet',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:mobile?'Open plate':'View your plate',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Synthetic Livingston breakfast omelet');
  await expect(page.getByRole('dialog').getByRole('button',{name:'Close plate',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');
  await controls.getByRole('button',{name:'Lunch',exact:true}).click();
  await page.getByLabel('Next retry outcome').selectOption('failure');
  await page.getByRole('button',{name:'Retry Lunch',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'lunch menu is still unavailable.'})).toContainText('lunch menu is still unavailable.');
  await expect(page.getByRole('button',{name:'Retry Lunch',exact:true})).toBeDisabled();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.locator('.livi-source:visible')).not.toContainText('Retrieved');
  // Controlled timers, not a real cooldown wait or upstream retry.
  await page.clock.install();await page.clock.fastForward(31_000);
  await page.getByLabel('Next retry outcome').selectOption('empty');
  await page.getByRole('button',{name:'Retry Lunch',exact:true}).click();
  await page.clock.fastForward(1600);
  await expect(page.getByRole('heading',{name:'No items listed for lunch',exact:true})).toBeVisible();
  await expect(page.locator('.livi-foodList:visible')).toContainText('Rutgers returned no items for lunch on this date');
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Backup menu|Sample menu|Updated recently/);
});
