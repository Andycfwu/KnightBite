// Read-only regression probes. Every fetch is replaced locally; no network requests occur.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
process.env.NODE_ENV = 'production';
const { rutgersMenuProvider } = require('../../../../lib/providers/rutgers-provider.ts');
const { matchesMenuFilter } = require('../../../../lib/menu-filters.ts');
const { hasMeaningfulNutrition } = require('../../../../lib/nutrition.ts');
const log = console.log.bind(console);
console.info = console.warn = console.error = () => {};
const results = [];
(async () => {
  const lunch = fs.readFileSync('tests/fixtures/foodpronet/observed-lunch.html', 'utf8');
  let blockedOriginCalls = 0;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/pickmenu.aspx')) {
      const meal = url.searchParams.get('activeMeal');
      const page = lunch.replace(/(<div class="tab active" aria-label=")Lunch(">\s*)Lunch/, `$1${meal}$2${meal}`)
        .replace('mealName=Lunch', `mealName=${meal}`)
        .replace(/href=(["'])label\.aspx/g, 'href=$1http://127.0.0.1:9/label.aspx');
      return new Response(page);
    }
    if (url.origin === 'http://127.0.0.1:9') blockedOriginCalls++;
    return new Response(fs.readFileSync('tests/fixtures/foodpronet/observed-spinach-label.html','utf8'));
  };
  const atrium = await rutgersMenuProvider.getDailyMenu('atrium', '2026-09-08');
  assert.ok(atrium);
  assert.ok(blockedOriginCalls > 0);
  results.push({probe:'Atrium off-origin label link', outcome:'CONFIRMED DEFECT', attemptedMockRequests:blockedOriginCalls, actualNetworkRequests:0});

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/schools/')) return Response.json([{id:62286,slug:'busch-dining-hall'}]);
    return Response.json({days:[{date:'2026-09-08',menu_items:[
      {is_station_header:true,station_id:'fixture',text:'Fixture Station'},
      {food:{id:1,name:'Synthetic Food',serving_size_info:{serving_size_amount:1,serving_size_unit:'cup'},rounded_nutrition_info:{calories:120},icons:{food_icons:[{name:'Gluten Free'}]}}},
      {food:{id:1,name:'Synthetic Food',serving_size_info:{serving_size_amount:2,serving_size_unit:'cup'},rounded_nutrition_info:{calories:240}}}
    ]}]});
  };
  const busch = await rutgersMenuProvider.getDailyMenu('busch','2026-09-08');
  const items = busch.meals[0].stations[0].items;
  assert.equal(items.length,2);
  assert.equal(items[0].id,items[1].id);
  results.push({probe:'Nutrislice portions sharing provider food ID',outcome:'CONFIRMED DEFECT',portions:items.map(i=>i.servingSize),distinctPlateIds:new Set(items.map(i=>i.id)).size});
  assert.equal(items[0].nutrition.protein,0);
  assert.equal(hasMeaningfulNutrition(items[0].nutrition),true);
  results.push({probe:'Missing macros on calorie-only item',outcome:'CONFIRMED DEFECT',unknownProteinShownAs:items[0].nutrition.protein,consideredMeaningful:hasMeaningfulNutrition(items[0].nutrition)});
  assert.equal(matchesMenuFilter(items[0],'gluten-free'),false);
  results.push({probe:'Explicit Nutrislice Gluten Free icon',outcome:'CONFIRMED DEFECT',passedGlutenFreeFilter:false,classifiedAsAllergen:items[0].allergens.includes('gluten free')});

  const realLoad = Module._load;
  const effects=[];
  Module._load = function(request,parent,isMain) {
    if(request==='react') return {createContext:()=>({Provider:()=>null}),useState:(initial)=>[initial===false?true:initial,()=>{}],useEffect:fn=>effects.push(fn),useMemo:fn=>fn(),useContext:()=>null};
    return realLoad.call(this,request,parent,isMain);
  };
  const {UserPreferencesProvider}=require('../../../../hooks/useUserPreferences.tsx');
  globalThis.window={localStorage:{getItem:()=>null,setItem:()=>{throw new DOMException('Storage disabled','SecurityError');}}};
  UserPreferencesProvider({children:null});
  assert.equal(effects.length,2);
  assert.throws(effects[1],{name:'SecurityError'});
  Module._load=realLoad;
  results.push({probe:'Preferences write denied by browser',outcome:'CONFIRMED DEFECT',errorEscapesEffect:'SecurityError',scope:'Isolated hook-effect simulation; browser recovery not exercised'});
  log(JSON.stringify({date:'2026-09-10',results},null,2));
})().catch(error=>{log(error.stack);process.exitCode=1;});
