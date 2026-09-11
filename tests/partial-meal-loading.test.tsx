import assert from 'node:assert/strict';
import { beforeEach, test, type TestContext } from 'node:test';
import { rutgersMenuProvider } from '@/lib/providers/rutgers-provider';
import { getDefaultMealType } from '@/lib/menu-helpers';
import type { MealType } from '@/lib/types';
const date='2026-09-10';
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
let sequence=0;
beforeEach(context=>{
  const t=context as TestContext;
  t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,8,10,22)+ ++sequence*14*86400000});
  for(const level of ['info','warn','error'] as const) t.mock.method(console,level,()=>{});
});
function stub(t:TestContext) {
  const calls:Record<MealType,number>={breakfast:0,lunch:0,dinner:0};
  let recover=false;
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>{
    const url=new URL(String(input));
    assert.equal(url.origin,'https://rutgers.api.nutrislice.com');
    if(url.pathname.endsWith('/schools/')) return Response.json([{id:68757,name:'Livingston Dining Commons',slug:'livingston-dining-commons'}]);
    const id=url.pathname.match(/menu-type\/(\d+)/)?.[1];
    const meal=({'32934':'breakfast','33316':'lunch','33318':'dinner'} as const)[id as '32934'];
    calls[meal]++;
    if(meal!=='breakfast'&&!recover) return new Promise<Response>(()=>{});
    return Response.json({days:[{date,menu_items:[{is_station_header:true,text:'Fixture station',station_id:'fixture'},...[1,2].map(id=>({food:{id,name:`${meal} food ${id}`,rounded_nutrition_info:{calories:100,g_protein:10,g_carbs:10,g_fat:1}}}))]}]});
  });
  return {calls,recover:()=>{recover=true;}};
}
test('partial timeout recovers only missing meals after cooldown, without waiting fifteen minutes',async t=>{
  const network=stub(t);
  const loading=rutgersMenuProvider.getDailyMenu('livingston',date);
  await flush();t.mock.timers.tick(4500);
  const partial=await loading;
  assert.deepEqual(partial?.meals.map(m=>m.type),['breakfast']);
  const breakfast=partial!.meals[0];
  network.recover();t.mock.timers.tick(30_001);
  const recovered=await rutgersMenuProvider.getDailyMenu('livingston',date);
  assert.deepEqual(recovered?.meals.map(m=>m.type),['breakfast','lunch','dinner']);
  assert.deepEqual(network.calls,{breakfast:1,lunch:2,dinner:2});
  assert.strictEqual(recovered!.meals[0],breakfast);
});
test('evening entry keeps scheduled Dinner selected when only Breakfast was retrieved',async t=>{
  stub(t);const loading=rutgersMenuProvider.getDailyMenu('livingston',date);
  await flush();t.mock.timers.tick(4500);const partial=await loading;
  assert.equal(getDefaultMealType(partial!,new Date('2026-09-10T22:00:00Z')),'dinner');
});

test('concurrent targeted retries share one bounded attempt and preserve successful food/plate identities',async t=>{
  const { retryRutgersMeal }=await import('@/lib/providers/rutgers-provider');
  const { plateItemIdentity }=await import('@/lib/plate');
  const network=stub(t);
  const loading=rutgersMenuProvider.getDailyMenu('livingston',date);
  await flush();t.mock.timers.tick(4500);const partial=(await loading)!;
  const breakfast=partial.meals[0];const identity=plateItemIdentity(breakfast.stations[0].items[0]);
  const cooling=await retryRutgersMeal('livingston',date,'dinner');
  assert.equal(cooling.status.state,'unavailable');assert.ok(cooling.status.retryAt!>Date.now());
  assert.deepEqual(network.calls,{breakfast:1,lunch:1,dinner:1});
  t.mock.timers.tick(30_000);
  const retries=Array.from({length:8},()=>retryRutgersMeal('livingston',date,'dinner'));
  await flush();assert.equal(network.calls.dinner,2);
  t.mock.timers.tick(4500);const failures=await Promise.all(retries);
  assert.ok(failures.every(x=>x.status.state==='unavailable'&&x.section===null));
  assert.ok(failures.every(x=>x.status.retryAt===Date.now()+30_000));
  network.recover();t.mock.timers.tick(30_000);
  const successes=await Promise.all(Array.from({length:8},()=>retryRutgersMeal('livingston',date,'dinner')));
  assert.equal(network.calls.dinner,3);
  assert.ok(successes.every(x=>x.section===successes[0].section));
  assert.equal(successes[0].section?.type,'dinner');
  const next=(await rutgersMenuProvider.getDailyMenu('livingston',date))!;
  assert.strictEqual(next.meals[0],breakfast);
  assert.equal(plateItemIdentity(next.meals[0].stations[0].items[0]),identity);
  assert.equal(next.meals.find(m=>m.type==='dinner'),successes[0].section);
  assert.deepEqual(network.calls,{breakfast:1,lunch:2,dinner:3});
});

test('successful meal cache expires from its original retrieval, not a later sibling retry',async t=>{
  const { retryRutgersMeal }=await import('@/lib/providers/rutgers-provider');
  const network=stub(t);const loading=rutgersMenuProvider.getDailyMenu('livingston',date);
  await flush();t.mock.timers.tick(4500);const original=(await loading)!;
  network.recover();t.mock.timers.tick(30_000);
  await retryRutgersMeal('livingston',date,'dinner');
  const merged=(await rutgersMenuProvider.getDailyMenu('livingston',date))!;
  assert.equal(merged.mealStatus?.breakfast?.retrievedAt,original.mealStatus?.breakfast?.retrievedAt);
  t.mock.timers.tick(15*60_000-34_500);
  const fresh=(await rutgersMenuProvider.getDailyMenu('livingston',date))!;
  assert.equal(network.calls.breakfast,2);assert.equal(network.calls.dinner,2);
  assert.notEqual(fresh.mealStatus?.breakfast?.retrievedAt,original.mealStatus?.breakfast?.retrievedAt);
  assert.deepEqual(fresh.meals[0],original.meals[0]);
});

test('verified empty, malformed, missing-date and successful meals remain distinct',async t=>{
  const { retryRutgersMeal }=await import('@/lib/providers/rutgers-provider');
  const origins:string[]=[];
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>{
    const url=new URL(String(input));origins.push(url.origin);
    if(url.pathname.endsWith('/schools/'))return Response.json([{id:62286,name:'Busch Dining Hall',slug:'busch-dining-hall'}]);
    const requested=url.pathname.match(/(\d{4})\/(\d{2})\/(\d{2})\/$/)!.slice(1).join('-');
    if(requested==='2026-09-11')return Response.json({days:[{date:requested,menu_items:['malformed entry']}]});
    if(url.pathname.includes('/32934/'))return Response.json({days:[{date:requested,menu_items:[]}]});
    if(url.pathname.includes('/33316/'))return Response.json({days:[{date:requested,menu_items:{}}]});
    return Response.json({days:[{date:'2026-09-09',menu_items:[]}]});
  });
  const empty=await retryRutgersMeal('busch',date,'breakfast');
  assert.equal(empty.status.state,'empty');assert.ok(empty.status.retrievedAt);assert.equal(empty.section,null);
  for(const meal of ['lunch','dinner'] as const){const failed=await retryRutgersMeal('busch',date,meal);assert.equal(failed.status.state,'unavailable');assert.equal(failed.status.retrievedAt,undefined);}
  assert.equal((await retryRutgersMeal('busch','2026-09-11','breakfast')).status.state,'unavailable');
  assert.deepEqual([...new Set(origins)],['https://rutgers.api.nutrislice.com']);
});

test('retry cache keys never cross Rutgers dates or halls and validation rejects invalid destinations before requests',async t=>{
  const { retryRutgersMeal }=await import('@/lib/providers/rutgers-provider');
  const { parseMealRequest }=await import('@/lib/meal-request');
  const calls:string[]=[];
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>{
    const url=new URL(String(input));calls.push(url.pathname);
    if(url.pathname.endsWith('/schools/'))return Response.json([{id:62286,name:'Busch Dining Hall',slug:'busch-dining-hall'},{id:68757,name:'Livingston Dining Commons',slug:'livingston-dining-commons'}]);
    const requested=url.pathname.match(/(\d{4})\/(\d{2})\/(\d{2})\/$/)!.slice(1).join('-');
    return Response.json({days:[{date:requested,menu_items:[]}]});
  });
  const a=await retryRutgersMeal('busch',date,'dinner');const b=await retryRutgersMeal('busch','2026-09-11','dinner');const c=await retryRutgersMeal('livingston',date,'dinner');
  assert.deepEqual([a.date,b.date,c.hallId],[date,'2026-09-11','livingston']);
  assert.equal(calls.filter(x=>x.includes('/weeks/')).length,3);
  assert.ok(parseMealRequest('busch',date,'dinner','2026-09-11'));
  for(const input of [['busch','2026-02-30','dinner'],['busch','2026-08-01','dinner'],['https://evil.test',date,'dinner'],['busch',date,'late-night']])assert.equal(parseMealRequest(...input as [string,string,string],'2026-09-11'),null);
  assert.equal(getDefaultMealType({hallId:'busch',hallName:'Busch',date,meals:[]},new Date('2026-09-11T00:30Z')),'dinner');
});

test('cold targeted retry remains bounded through discovery and meal body, with no automatic retry loop',async t=>{
  const { retryRutgersMeal }=await import('@/lib/providers/rutgers-provider');
  const signals:AbortSignal[]=[];const paths:string[]=[];
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
    paths.push(new URL(String(input)).pathname);signals.push(init!.signal!);
    return new Promise<Response>(()=>{});
  });
  const request=retryRutgersMeal('busch',date,'dinner');await flush();
  assert.deepEqual(paths,['/menu/api/schools/']);
  t.mock.timers.tick(4500);await flush();
  assert.equal(paths.length,2);assert.match(paths[1],/menu-type\/33318\//);
  t.mock.timers.tick(4500);const result=await request;
  assert.equal(result.status.state,'unavailable');assert.equal(result.section,null);
  assert.ok(signals.every(signal=>signal.aborted));
  t.mock.timers.tick(60_000);await flush();assert.equal(paths.length,2,'No retry without new demand');
});
