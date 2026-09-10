import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beforeEach,test,type TestContext} from 'node:test';
import {getHallMenuForDate} from '@/lib/menu';
import {addPlateItem} from '@/lib/plate';
import {calculatePlateTotals} from '@/lib/nutrition';
import {WEEK_RESPONSE_BYTES} from '@/lib/providers/ingestion-limits';
const date='2026-09-08';let number=0;
const fixture=(name:string)=>readFileSync(`tests/fixtures/foodpronet/${name}.html`,'utf8');
const page=(meal:string)=>fixture('observed-lunch').replace(/(<div class="tab active" aria-label=")Lunch(">\s*)Lunch/,`$1${meal}$2${meal}`).replace('mealName=Lunch',`mealName=${meal}`);
beforeEach(context=>{
  const t=context as TestContext;
  t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,8,8)+ ++number*13*3600000});
  const env=process.env.NODE_ENV;Object.assign(process.env,{NODE_ENV:'production'});
  t.after(()=>{if(env===undefined)Reflect.deleteProperty(process.env,"NODE_ENV");else Object.assign(process.env,{NODE_ENV:env});});
  for(const method of ['info','warn','error'] as const)t.mock.method(console,method,()=>{});
  t.mock.method(globalThis,'fetch',async()=>{throw new Error('No live requests allowed');});
});
for(const link of ['http://127.0.0.1/label.aspx','https://evil.example/label.aspx','//evil.example/label.aspx','../label.aspx','https://user@menuportal23.dining.rutgers.edu/FoodPronet/label.aspx'])test(`unsafe upstream link never reaches fetch: ${link}`,async(t)=>{
  const calls:string[]=[];
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
    const url=new URL(String(input));calls.push(url.href);
    assert.equal(url.origin,'https://menuportal23.dining.rutgers.edu');
    assert.equal(url.pathname,'/FoodPronet/pickmenu.aspx');assert.equal(init?.redirect,'manual');
    return new Response(page(url.searchParams.get('activeMeal')!).replace(/href='label.aspx[^']*'/g,`href='${link}?locationNum=13&dtdate=9/8/2026&RecNumAndPort=1*1'`));
  });
  await getHallMenuForDate('atrium',date);assert.equal(calls.length,3);
});
test('redirects are rejected without making a request to the Location destination',async(t)=>{
  let labels=0;
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
    const url=new URL(String(input));assert.equal(url.origin,'https://menuportal23.dining.rutgers.edu');
    if(url.pathname.endsWith('/pickmenu.aspx')) return new Response(page(url.searchParams.get('activeMeal')!));
    labels++;assert.equal(init?.redirect,'manual');return new Response(null,{status:302,headers:{Location:'http://127.0.0.1/private'}});
  });
  await getHallMenuForDate('atrium',date);assert.ok(labels>0);
});
function entry(size:number,calories:unknown,icons:unknown[]=[]){return {food:{id:1,name:'Rice',serving_size_info:{serving_size_amount:size,serving_size_unit:'cup'},rounded_nutrition_info:{calories},icons:{food_icons:icons}}};}
test('real loader preserves calorie-only values and distinct Nutrislice portions',async(t)=>{
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>String(input).endsWith('/schools/')?Response.json([{id:62286,name:'Busch Dining Hall',slug:'busch-dining-hall'}]):Response.json({days:[{date,menu_items:[{is_station_header:true,text:'Rice'},entry(1,120,[{name:'Gluten Free'}]),entry(2,240),entry(1,120,[{name:'Gluten Free'}])]}]}));
  const menu=await getHallMenuForDate('busch',date);assert.ok(menu);
  const items=menu.meals[0].stations[0].items;assert.equal(items.length,2);assert.notEqual(items[0].id,items[1].id);
  assert.equal(items[0].nutrition.protein,null);assert.deepEqual(items[0].tags,['gluten-free']);assert.equal(items[0].allergens,undefined);
  const plate=addPlateItem(addPlateItem([],items[0]),items[1]);assert.equal(plate.length,2);assert.equal(calculatePlateTotals(plate).calories,360);
});
for(const bad of [-1,999999,'12not-a-number',null])test(`invalid calories remain unknown: ${bad}`,async(t)=>{
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>String(input).endsWith('/schools/')?Response.json([{id:62286,name:'Busch',slug:'busch-dining-hall'}]):Response.json({days:[{date,menu_items:[entry(1,120),entry(2,240),entry(3,bad)]}]}));
  const menu=await getHallMenuForDate('busch',date);assert.ok(menu);assert.equal(menu.meals[0].stations[0].items[2].nutrition.calories,null);
});
test('oversized menus reject while independent hall loads remain usable',async(t)=>{
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>{
    const url=String(input);
    if(url.endsWith('/schools/')) return Response.json([{id:62286,name:'Busch',slug:'busch-dining-hall'},{id:65291,name:'Neilson',slug:'neilson-dining-hall'}]);
    if(url.includes('/62286/'))return new Response('x'.repeat(WEEK_RESPONSE_BYTES+1));
    return Response.json({days:[{date,menu_items:[entry(1,120),entry(2,240)]}]});
  });
  const [oversized,normal]=await Promise.all([getHallMenuForDate('busch',date),getHallMenuForDate('neilson',date)]);
  assert.equal(oversized,null);assert.ok(normal);
});

test('a conflicting returned label identity cannot populate the requested food',async(t)=>{
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>{
    const url=new URL(String(input));
    if(url.pathname.endsWith('/pickmenu.aspx')) return new Response(page(url.searchParams.get('activeMeal')!));
    const dressing=url.searchParams.get('RecNumAndPort')==='150157*1';
    return new Response((dressing?'<input name="RecNumAndPort" value="999*1">':'')+fixture(dressing?'observed-dressing-label':'observed-spinach-label'));
  });
  const menu=await getHallMenuForDate('atrium',date);assert.ok(menu);
  const items=menu.meals[0].stations.flatMap(station=>station.items);
  assert.equal(items.length,2);
  assert.equal(items[0].nutrition.calories,null);
  assert.equal(items[1].nutrition.calories,26);
});
test('a menu of supplied all-zero foods remains a real menu',async(t)=>{
  const zero={calories:0,g_protein:0,g_carbs:0,g_fat:0,mg_sodium:0,g_sugar:0};
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>String(input).endsWith('/schools/')?Response.json([{id:62286,name:'Busch',slug:'busch-dining-hall'}]):Response.json({days:[{date,menu_items:[1,2].map(id=>({food:{id,name:`Water ${id}`,rounded_nutrition_info:zero}}))}]}));
  const menu=await getHallMenuForDate('busch',date);assert.ok(menu?.isLiveData);
  assert.equal(menu.meals[0].stations[0].items[0].nutrition.protein,0);
});
test('excess food candidates reject a meal instead of truncating it',async(t)=>{
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>String(input).endsWith('/schools/')?Response.json([{id:62286,name:'Busch',slug:'busch-dining-hall'}]):Response.json({days:[{date,menu_items:Array.from({length:1501},(_,i)=>entry(i+1,120))}]}));
  assert.equal(await getHallMenuForDate('busch',date),null);
});

test('a large seven-day response preserves every requested-day item within the weekly budget',async(t)=>{
  // Synthetic repeat-heavy weekly metadata exceeds the former per-meal byte/node
  // caps without fetching or redistributing live provider bodies.
  const weekly={days:Array.from({length:7},(_,day)=>({date:`2026-09-${String(day+8).padStart(2,'0')}`,menu_items:Array.from({length:400},(_,id)=>({food:{id,name:`Synthetic food ${id}`,rounded_nutrition_info:{calories:120},description:'Synthetic source metadata. '.repeat(24),metadata:Object.fromEntries(Array.from({length:24},(_,n)=>[`field${n}`,n]))}}))}))};
  const body=JSON.stringify(weekly);
  assert.ok(Buffer.byteLength(body)>2*1024*1024);assert.ok(Buffer.byteLength(body)<WEEK_RESPONSE_BYTES);
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>String(input).endsWith('/schools/')?Response.json([{id:62286,name:'Busch',slug:'busch-dining-hall'}]):new Response(body));
  const menu=await getHallMenuForDate('busch',date);assert.ok(menu);
  for(const meal of menu.meals) assert.equal(meal.stations.flatMap(station=>station.items).length,400);
  assert.equal(menu.meals.length,3);
});
