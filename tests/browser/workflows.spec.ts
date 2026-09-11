import {test,expect} from '@playwright/test';

test.beforeEach(async({context})=>{
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin==='http://127.0.0.1:3217' && url.pathname==='/_vercel/insights/script.js') return route.fulfill({contentType:'application/javascript',body:''});
    if(url.origin!=='http://127.0.0.1:3217' || url.pathname.startsWith('/_vercel/')) {
      await route.abort();throw new Error(`Unexpected external/analytics request: ${url.origin}${url.pathname}`);
    }
    await route.continue();
  });
});

test('menu portions, missing nutrients, plate snapshots and keyboard dialog',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/hall/busch');
  await page.getByRole('button',{name:'Full menu',exact:true}).click();
  const rice=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Synthetic rice',exact:true})});
  await expect(rice).toHaveCount(2);
  await rice.nth(0).getByRole('button').click();await rice.nth(1).getByRole('button').click();
  const opener=page.getByRole('button',{name:'View your plate',exact:true});await opener.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'My Plate'});await expect(dialog).toBeVisible();
  await expect(dialog.getByText('360 kcal',{exact:true})).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Increase quantity of Synthetic rice, 1 cup',exact:true})).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Increase quantity of Synthetic rice, 2 cup',exact:true})).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Close plate',exact:true})).toBeFocused();
  for(let i=0;i<14;i++){await page.keyboard.press(i%2?'Tab':'Shift+Tab');expect(await dialog.evaluate(node=>node.contains(document.activeElement))).toBe(true);}
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(opener).toBeFocused();
  const partial=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Synthetic partial food',exact:true})});
  await expect(partial).toContainText('Unknown');await partial.getByRole('button').click();
  const zero=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Synthetic zero food',exact:true})});await expect(zero).toContainText('0g');await expect(zero).not.toContainText('Nutrition incomplete');
  await opener.click();await expect(dialog).toContainText('Known subtotal: 30g');
  await page.keyboard.press('Escape');
  await page.reload();await opener.click();await expect(dialog).toContainText('Your plate is empty');
  expect(errors).toEqual([]);
});

test('normal preferences persist, have checked state, synchronize tabs and clear without reappearing',async({page,context})=>{
  await page.goto('/profile');
  const vegan=page.getByRole('switch',{name:'Vegan',exact:true});await expect(vegan).toHaveAttribute('aria-checked','false');await vegan.click();
  await page.getByRole('textbox',{name:'Protein goal in grams',exact:true}).fill('120');await expect(page.getByRole('status')).toContainText('saved in this browser');
  await page.reload();await expect(vegan).toHaveAttribute('aria-checked','true');await expect(page.getByRole('textbox',{name:'Protein goal in grams',exact:true})).toHaveValue('120');
  const second=await context.newPage();await second.goto('/profile');await expect(second.getByRole('textbox',{name:'Protein goal in grams',exact:true})).toHaveValue('120');
  await second.getByRole('textbox',{name:'Protein goal in grams',exact:true}).fill('150');await expect(page.getByRole('textbox',{name:'Protein goal in grams',exact:true})).toHaveValue('150');
  await page.getByRole('button',{name:'Clear local data',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('removed');await expect(second.getByRole('switch',{name:'Vegan',exact:true})).toHaveAttribute('aria-checked','false');
  expect(await page.evaluate(()=>localStorage.getItem('knightbite-user-preferences'))).toBeNull();
  await page.reload();expect(await page.evaluate(()=>localStorage.getItem('knightbite-user-preferences'))).toBeNull();
});

for(const failure of ['SecurityError','QuotaExceededError','malformed','legacy'] as const)test(`preferences handle ${failure} safely`,async({page})=>{
  await page.addInitScript(mode=>{
    if(mode==='SecurityError')Object.defineProperty(window,'localStorage',{get(){throw new DOMException('synthetic','SecurityError');}});
    if(mode==='QuotaExceededError')Storage.prototype.setItem=()=>{throw new DOMException('synthetic','QuotaExceededError');};
    if(mode==='malformed')localStorage.setItem('knightbite-user-preferences','{bad');
    if(mode==='legacy')localStorage.setItem('knightbite-user-preferences',JSON.stringify({dietaryPreferences:{vegan:true,vegetarian:false,nutFree:false},macroGoals:{protein:'80',carbs:'',fat:''}}));
  },failure);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/profile');
  await page.getByRole('switch',{name:'Vegetarian',exact:true}).click();
  await expect(page.getByRole('switch',{name:'Vegetarian',exact:true})).toHaveAttribute('aria-checked','true');
  await expect(page.getByRole('status')).toContainText(failure==='legacy'?'saved':failure==='malformed'?'could not be read':'could not be saved');
  if(failure==='malformed')expect(await page.evaluate(()=>localStorage.getItem('knightbite-user-preferences'))).toBe('{bad');
  expect(errors).toEqual([]);
});

test('maps, unavailable status, security headers and small-screen layout',async({page})=>{
  const response=await page.goto('/hall/atrium');
  expect(response?.headers()['x-frame-options']).toBe('DENY');expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response?.headers()['content-security-policy']).not.toContain('unsafe-eval');
  await expect(page.getByRole('heading',{name:'The Atrium',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Lunch',exact:true}).click();
  await page.getByRole('button',{name:'Full menu',exact:true}).click();
  await page.getByRole('searchbox').fill('CHICKEN NOODLE SOUP');await expect(page.getByRole('heading',{name:'CHICKEN NOODLE SOUP',exact:true})).toBeVisible();
  await page.goto('/hall/neilson');await expect(page.getByRole('heading',{name:'Menu unavailable right now.',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/^Add /})).toHaveCount(0);
  await page.setViewportSize({width:320,height:740});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/profile');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('switch',{name:'Vegan',exact:true}).focus();await page.keyboard.press('Space');await expect(page.getByRole('switch',{name:'Vegan',exact:true})).toHaveAttribute('aria-checked','true');
  await page.getByRole('textbox',{name:'Protein goal in grams',exact:true}).fill('1');
  // Text enlargement exercises the same narrow layout constraints as browser zoom.
  await page.addStyleTag({content:'html { font-size: 200%; }'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
