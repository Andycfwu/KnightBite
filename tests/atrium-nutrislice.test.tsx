import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {beforeEach,test,type TestContext} from 'node:test';
import {getHallMenuForDate} from '@/lib/menu';
import {mockMenuProvider} from '@/lib/providers/mock-provider';
import {groupAtriumStations} from '@/lib/atrium-stations';
import {readBoundedText,validateJsonBudget,WEEK_RESPONSE_BYTES,WEEK_JSON_NODES} from '@/lib/providers/ingestion-limits';
import {addPlateItem} from '@/lib/plate';
import {calculatePlateTotals} from '@/lib/nutrition';
import type {MealType} from '@/lib/types';

const root='tests/fixtures/nutrislice/atrium/';
const fixture=(name:string)=>JSON.parse(readFileSync(root+name+'.json','utf8'));
const school=fixture('school');
const date='2026-09-10';
const names:MealType[]=['breakfast','lunch','dinner'];
let counter=0;
beforeEach(context=>{
 const t=context as TestContext;
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.UTC(2026,8,10,22)+ ++counter*14*24*3600000});
 for(const method of ['info','warn','error'] as const)t.mock.method(console,method,()=>{});
 const mock=t.mock.method(mockMenuProvider,'getDailyMenu',async()=>{throw new Error('No sample fallback');});
 t.after(()=>assert.equal(mock.mock.callCount(),0));
});
function transport(t:TestContext,reply:(meal:MealType)=>Response|Promise<Response>=meal=>Response.json(fixture(meal)),index:unknown=[school]) {
 const calls:string[]=[];
 t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=new URL(String(input));calls.push(url.href);
  assert.equal(url.origin,'https://rutgers.api.nutrislice.com','Atrium must never request FoodProNet or another origin');
  assert.equal(init?.redirect,'manual');
  if(url.pathname==='/menu/api/schools/')return Response.json(index);
  const match=url.pathname.match(/^\/menu\/api\/weeks\/school\/71385\/menu-type\/(32934|33316|33318)\/2026\/09\/\d{2}\/$/);
  assert.ok(match,'Only the discovered school, advertised meals and requested date are queried');
  return reply(names[[32934,33316,33318].indexOf(+match[1])]);
 });
 t.after(()=>{for(const call of calls){const url=new URL(call);assert.equal(url.origin,'https://rutgers.api.nutrislice.com');assert.match(url.pathname,/^\/menu\/api\/(schools\/|weeks\/school\/71385\/menu-type\/(32934|33316|33318)\/2026\/09\/\d{2}\/)$/);}});
 return calls;
}
test('Atrium uses discovered Nutrislice identity and all requested-day source foods exactly once',async(t)=>{
 const calls=transport(t);const menu=await getHallMenuForDate('atrium',date);assert.ok(menu?.isLiveData);
 assert.equal(menu.hallName,'The Atrium');assert.equal(menu.date,date);assert.equal(calls.length,4);
 assert.deepEqual(menu.meals.map(m=>m.type),names);
 for(const meal of menu.meals){
  const items=meal.stations.flatMap(s=>s.items);const source=fixture(meal.type).days[0].menu_items.filter((e:{food?:unknown})=>e.food);
  assert.equal(items.length,source.length);assert.equal(new Set(items.map(i=>i.id)).size,items.length);
  assert.deepEqual(items.map(i=>i.name),source.map((e:{food:{name:string}})=>e.food.name.replace(/\s+/g," ").trim()));
  assert.ok(items.every(i=>i.menuDate===date&&i.hallId==='atrium'&&i.mealType===meal.type));
  const grouped=groupAtriumStations(meal.stations);const retained=grouped.flatMap(g=>g.stations).flatMap(s=>s.items);
  assert.equal(retained.length,items.length);assert.deepEqual(new Set(retained),new Set(items));
  const other=grouped.find(g=>g.id==='other')!;
  assert.deepEqual(other.stations.map(s=>s.name),meal.type==='breakfast'?['HOT CEREAL']:['SPECIALTY SANDWICHES','SUSHI & POKE BOWLS','GRAB & GO WARMER']);
 }
 const grits=menu.meals[0].stations[0].items[0];assert.equal(grits.name,'COUNTRY STYLE GRITS');assert.equal(grits.servingSize,'6 oz');
 assert.deepEqual(grits.nutrition,{calories:140,protein:2,carbs:15,fat:0.2,sodium:207,sugar:0});
 const plate=addPlateItem(addPlateItem([],grits),grits);assert.equal(plate.length,1);assert.equal(calculatePlateTotals(plate).calories,280);
});
for(const index of [[],[{...school,slug:'wrong-hall'}],[{...school,name:'Wrong Hall'}],[{...school,id:null}]])test('absent or conflicting Atrium identity never borrows another hall',async(t)=>{
 const calls=transport(t,undefined,index);assert.equal(await getHallMenuForDate('atrium',date),null);assert.equal(calls.length,1);
});
test('unadvertised meal is unavailable without guessing its menu type',async(t)=>{
 const calls=transport(t,undefined,[{...school,active_menu_types:school.active_menu_types.filter((m:{id:number})=>m.id!==33318)}]);
 const menu=await getHallMenuForDate('atrium',date);assert.deepEqual(menu?.meals.map(m=>m.type),['breakfast','lunch']);assert.equal(calls.length,3);
});
for(const failure of ['http','throw','date','meal','shape','redirect'] as const)test(`Atrium ${failure} failure returns unavailable without fallback`,async(t)=>{
 const calls=transport(t,meal=>{
  if(failure==='http')return new Response('unavailable',{status:503});
  if(failure==='throw')throw new Error('Transport unavailable');
  if(failure==='redirect')return new Response(null,{status:302,headers:{Location:'https://menuportal23.dining.rutgers.edu/FoodPronet/pickmenu.aspx'}});
  const x=fixture(meal);if(failure==='date')x.days[0].date='2026-09-09';if(failure==='meal')x.menu_type_id=33385;if(failure==='shape')x.days={};return Response.json(x);
 });assert.equal(await getHallMenuForDate('atrium',date),null);assert.equal(calls.length,4);
});
test('one failed meal stays absent while successful meals keep their actual labels',async(t)=>{
 transport(t,meal=>meal==='breakfast'?new Response('unavailable',{status:503}):Response.json(fixture(meal)));
 assert.deepEqual((await getHallMenuForDate('atrium',date))?.meals.map(m=>m.type),['lunch','dinner']);
});
test('partial, missing and zero nutrition remain distinct; portion variants stay separate',async(t)=>{
 transport(t,meal=>{const x=fixture(meal);const base=x.days[0].menu_items.find((e:{food?:unknown})=>e.food);const partial=structuredClone(base);partial.food.rounded_nutrition_info={calories:100};partial.food.name='Controlled partial';partial.food.use_custom_sizes=false;delete partial.food.food_sizes;
  const unknown=structuredClone(partial);unknown.food.name='Controlled unknown';unknown.food.rounded_nutrition_info=null;
  const zero=structuredClone(partial);zero.food.name='Controlled zero';zero.food.rounded_nutrition_info={calories:0,g_protein:0,g_carbs:0,g_fat:0,mg_sodium:0,g_sugar:0};
  const variant=structuredClone(partial);variant.food.serving_size_info.serving_size_amount='12';variant.serving_size_amount='12';x.days[0].menu_items.push(partial,unknown,zero,variant,structuredClone(variant));return Response.json(x);
 });const menu=await getHallMenuForDate('atrium',date);assert.ok(menu);
 const items=menu.meals[0].stations.flatMap(s=>s.items);const partials=items.filter(i=>i.name==='Controlled partial');assert.equal(partials.length,2);assert.notEqual(partials[0].id,partials[1].id);assert.equal(partials[0].nutrition.protein,null);
 const unknown=items.find(i=>i.name==='Controlled unknown')!;const zero=items.find(i=>i.name==='Controlled zero')!;assert.equal(unknown.nutrition.calories,null);assert.equal(zero.nutrition.calories,0);
 const plate=[...partials,unknown,zero].reduce((p,i)=>addPlateItem(p,i),[] as ReturnType<typeof addPlateItem>);assert.equal(plate.length,4);assert.equal(calculatePlateTotals(plate).calories,200);
});
for(const meal of names)test(`sanitized Atrium ${meal} full week fits unchanged bounds and preserves every accepted day's food`,async(t)=>{
 const body=gunzipSync(readFileSync(root+meal+'-week-2026-09-06.json.gz')).toString();const week=JSON.parse(body);
 assert.equal(await readBoundedText(new Response(body),WEEK_RESPONSE_BYTES),body);assert.doesNotThrow(()=>validateJsonBudget(week,WEEK_JSON_NODES));
 transport(t,type=>Response.json({...week,menu_type_id:{breakfast:32934,lunch:33316,dinner:33318}[type]}));
 for(const day of week.days){t.mock.timers.tick(13*3600000);const menu=await getHallMenuForDate('atrium',day.date);assert.ok(menu);for(const section of menu.meals)assert.equal(section.stations.flatMap(s=>s.items).length,day.menu_items.filter((e:{food?:unknown})=>e.food).length);}
});

test('failed school discovery cannot use static mappings or FoodProNet for Atrium',async(t)=>{
 const calls:string[]=[];t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>{calls.push(String(input));throw new Error('index unavailable');});
 assert.equal(await getHallMenuForDate('atrium',date),null);assert.deepEqual(calls,['https://rutgers.api.nutrislice.com/menu/api/schools/']);
});

test('Atrium oatmeal uses published matching 6 oz nutrition, not conflicting top-level values',async(t)=>{
 transport(t);const menu=await getHallMenuForDate('atrium',date);assert.ok(menu);
 const oats=menu.meals[0].stations.flatMap(s=>s.items).find(i=>i.name==='OATMEAL')!;
 assert.equal(oats.servingSize,'6 oz');assert.equal(oats.nutrition.calories,80);assert.equal(oats.nutrition.protein,3);assert.equal(oats.nutrition.sugar,0);
});
for(const kind of ['absent','ambiguous','partial','entry override'] as const)test(`Atrium size nutrition ${kind} cannot borrow another portion`,async(t)=>{
 transport(t,meal=>{const x=fixture(meal);const oats=x.days[0].menu_items.find((e:{food?:{name:string}})=>e.food?.name==='OATMEAL');
  if(oats){if(kind==='absent')oats.food.food_sizes=[];
   if(kind==='ambiguous')oats.food.food_sizes.push(structuredClone(oats.food.food_sizes[0]));
   if(kind==='partial')oats.food.food_sizes[0].nutrition_info={calories:80};
   if(kind==='entry override'){oats.serving_size_amount='3';oats.serving_size_unit='oz';}}
  return Response.json(x);
 });const menu=await getHallMenuForDate('atrium',date);assert.ok(menu);const oats=menu.meals[0].stations.flatMap(s=>s.items).find(i=>i.name==='OATMEAL')!;
 assert.equal(oats.nutrition.calories,kind==='entry override'?40:kind==='partial'?80:null);
 assert.equal(oats.nutrition.protein,kind==='entry override'?2:null);
 if(kind==='entry override')assert.equal(oats.servingSize,'3 oz');
});
