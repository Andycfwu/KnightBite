// Loaded only by the isolated release/browser harness, never imported by application code.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const root = process.env.KNIGHTBITE_FIXTURE_ROOT;
function block() { throw new Error('External network disabled by KnightBite test harness'); }
for (const mod of [http,https]) { mod.request=block; mod.get=block; }
const fixture = name => fs.readFileSync(path.join(root, 'tests/fixtures/foodpronet',name+'.html'),'utf8');
const nutrients = calories => ({calories,g_protein:calories/12,g_carbs:calories/4,g_fat:0,mg_sodium:0,g_sugar:0});
function entry(id,name,size,info,labels=[]) {return {food:{id,name,serving_size_info:{serving_size_amount:size,serving_size_unit:'cup'},rounded_nutrition_info:info,icons:{food_icons:labels.map(name=>({name}))}}};}
globalThis.fetch=async function(input,init) {
  if(process.env.KNIGHTBITE_SYNTHETIC_MENUS!=='1') return block();
  const url=new URL(String(input));
  if(url.origin==='https://rutgers.api.nutrislice.com') {
    if(url.pathname==='/menu/api/schools/')return Response.json([
      {id:62286,name:'Busch Dining Hall',slug:'busch-dining-hall'},
      {id:68757,name:'Livingston Dining Commons',slug:'livingston-dining-commons'},
      {id:65291,name:'Neilson Dining Hall',slug:'neilson-dining-hall'}
    ]);
    const match=url.pathname.match(/\/weeks\/school\/(62286|68757|65291)\/menu-type\/\d+\/(\d{4})\/(\d{2})\/(\d{2})\/$/);
    if(!match)return block();
    // Neilson supplies the unavailable workflow without any upstream call.
    if(match[1]==='65291')return new Response('Synthetic unavailable',{status:503});
    return Response.json({days:[{date:match.slice(2).join('-'),menu_items:[
      {is_station_header:true,text:match[1]==='62286'?'THE MAIN COURSE':'MAIN COURSE'},
      entry(1,'Synthetic rice',1,nutrients(120),['Gluten Free']),
      entry(1,'Synthetic rice',2,nutrients(240),['Gluten Free']),
      entry(2,'Synthetic partial food',1,{calories:100}),
      entry(3,'Synthetic unknown food',1,null),
      entry(4,'Synthetic zero food',1,nutrients(0))
    ]}]});
  }
  if(url.origin==='https://menuportal23.dining.rutgers.edu') {
    if(url.pathname==='/FoodPronet/pickmenu.aspx') {
      const meal=url.searchParams.get('activeMeal');const date=url.searchParams.get('dtdate');
      const [month,day,year]=date.split('/');const parsed=new Date(Date.UTC(+year,+month-1,+day));
      const label=new Intl.DateTimeFormat('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(parsed);
      return new Response(fixture('observed-lunch').replace(/Tuesday, September 8, 2026/g,label).replace(/9\/8\/2026/g,date).replace(/9%2f8%2f2026/gi,`${month}%2f${day}%2f${year}`).replace(/(<div class="tab active" aria-label=")Lunch(">\s*)Lunch/,`$1${meal}$2${meal}`).replace('mealName=Lunch',`mealName=${meal}`));
    }
    if(url.pathname==='/FoodPronet/label.aspx' && init?.redirect==='manual') return new Response(fixture(url.searchParams.get('RecNumAndPort')==='150157*1'?'observed-dressing-label':'observed-spinach-label'));
  }
  return block();
};
