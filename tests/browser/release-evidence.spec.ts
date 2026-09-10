import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// CI uses a transparent transport probe, not a claimed copy of Vercel's service.
// A separately captured public script can be replayed offline for release evidence.
const capturedScript=process.env.KNIGHTBITE_ANALYTICS_SCRIPT_FIXTURE;
const transportProbe=`(() => {
  const script=document.currentScript;
  function command(type, data) {
    if(type==='pageview') fetch('/_vercel/insights/view', {
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({o:location.origin+data.path,dp:data.route,sdkn:script.dataset.sdkn,sdkv:script.dataset.sdkv})
    });
  }
  window.va=command;
  (window.vaq||[]).forEach(args=>command(...args));
})();`;

test(`analytics-enabled bundle and CSP: ${capturedScript?'captured Vercel script':'synthetic transport probe'}`,async({page,context,baseURL},testInfo)=>{
  const manifest=JSON.parse(readFileSync('test-results/isolated-build.json','utf8'));
  expect(manifest.analyticsEnabled,'rebuild with analytics enabled before this test').toBe(true);
  const script=capturedScript?readFileSync(capturedScript,'utf8'):transportProbe;
  const requests:Array<{path:string;body:Record<string,unknown>}>=[];
  const unexpected:string[]=[];
  let scriptRequests=0;
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==baseURL) {unexpected.push(url.origin+url.pathname);return route.abort();}
    if(url.pathname==='/_vercel/insights/script.js') {
      scriptRequests++;return route.fulfill({contentType:'application/javascript',body:script});
    }
    if(url.pathname.startsWith('/_vercel/')) {
      requests.push({path:url.pathname,body:route.request().postDataJSON()??{}});
      return route.fulfill({status:200,contentType:'application/json',body:'{}'});
    }
    return route.continue();
  });
  const violations:string[]=[];
  await page.exposeFunction('captureCspViolation',(value:string)=>violations.push(value));
  await page.addInitScript(()=>{
    // The captured service intentionally ignores automated browsers. Enable it
    // only inside this intercepted loopback context to exercise real transport.
    Object.defineProperty(navigator,'webdriver',{get:()=>false});
    Object.defineProperty(navigator,'userAgent',{get:()=> 'Mozilla/5.0 KnightBiteOfflineVerification'});
    document.addEventListener('securitypolicyviolation',event=>{
      void (window as unknown as {captureCspViolation:(value:string)=>Promise<void>}).captureCspViolation(event.violatedDirective+':'+event.blockedURI);
    });
  });
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto('/profile');
  expect(response?.headers()['content-security-policy']).not.toContain('unsafe-eval');
  await expect.poll(()=>requests.length).toBeGreaterThan(0);
  await page.getByRole('switch',{name:'Vegan',exact:true}).click();
  await page.getByRole('textbox',{name:'Protein goal in grams',exact:true}).fill('9876');
  await page.getByRole('link',{name:'View your plate',exact:true}).click();
  await expect(page.getByRole('heading',{name:'My Plate Summary',exact:true})).toBeVisible();
  await page.goto('/hall/busch');
  await page.getByRole('button',{name:'Full menu',exact:true}).click();
  const rice=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Synthetic rice',exact:true})});
  await rice.nth(0).getByRole('button').click();
  await page.getByRole('link',{name:'Your profile',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Protein goal in grams',exact:true})).toHaveValue('9876');
  await expect.poll(()=>requests.some(request=>request.body.dp==='/hall/[hallId]')).toBe(true);
  expect(scriptRequests).toBeGreaterThan(0);
  expect(unexpected).toEqual([]);
  expect(errors).toEqual([]);
  expect(violations).toEqual([]);
  for(const request of requests) {
    expect(request.path).toBe('/_vercel/insights/view');
    expect(Object.keys(request.body).every(key=>['o','sv','sdkn','sdkv','ts','dp','r','f'].includes(key))).toBe(true);
    const values=Object.values(request.body).filter(value=>typeof value==='string').join(' ');
    for(const canary of ['9876','Synthetic rice','dietaryPreferences','macroGoals','vegan']) expect(values).not.toContain(canary);
  }
  await testInfo.attach('analytics-intercept-evidence',{contentType:'application/json',body:JSON.stringify({
    scriptMode:capturedScript?'captured-platform-script':'synthetic-transport-probe',
    scriptSha256:createHash('sha256').update(script).digest('hex'),buildId:manifest.buildId,
    scriptRequests,interceptedRequests:requests,externalRequests:unexpected,deliveredAnalyticsEvents:0
  },null,2)});
});

test('plate dialog has a complete forward/backward keyboard cycle and named quantity actions',async({page,context,baseURL})=>{
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==baseURL)return route.abort();
    if(url.pathname.startsWith('/_vercel/'))return route.fulfill({contentType:'application/javascript',body:''});
    return route.continue();
  });
  await page.goto('/hall/busch');
  await page.getByRole('button',{name:'Full menu',exact:true}).click();
  await page.getByRole('article').filter({has:page.getByRole('heading',{name:'Synthetic rice',exact:true})}).nth(0).getByRole('button').click();
  const opener=page.getByRole('button',{name:'View your plate',exact:true});
  await opener.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'My Plate',exact:true});
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-describedby',/\S+/);
  const focusable=dialog.locator('button:visible:not(:disabled):not([tabindex="-1"]), a[href]:visible, input:visible:not(:disabled), select:visible, textarea:visible, [tabindex="0"]:visible');
  const count=await focusable.count();expect(count).toBeGreaterThan(3);
  await expect(focusable.nth(0)).toBeFocused();
  for(let index=1;index<=count;index++) {await page.keyboard.press('Tab');await expect(focusable.nth(index%count)).toBeFocused();}
  for(let index=count-1;index>=0;index--) {await page.keyboard.press('Shift+Tab');await expect(focusable.nth(index)).toBeFocused();}
  await dialog.getByRole('button',{name:'Increase quantity of Synthetic rice, 1 cup',exact:true}).focus();
  await page.keyboard.press('Space');await expect(dialog).toContainText('240 kcal');
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(opener).toBeFocused();
  await page.getByRole('link',{name:'Your profile',exact:true}).click();
  for(const name of ['Vegetarian','Vegan','Nut-Free']) {
    const control=page.getByRole('switch',{name,exact:true});await control.focus();await page.keyboard.press('Space');
    await expect(control).toHaveAttribute('aria-checked','true');await expect(page.getByRole('status')).toContainText('saved in this browser');
  }
});
