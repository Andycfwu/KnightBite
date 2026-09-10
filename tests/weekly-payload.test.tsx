import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {test} from 'node:test';
import {getHallMenuForDate} from '@/lib/menu';
import {readBoundedText,validateJsonBudget,WEEK_RESPONSE_BYTES,WEEK_JSON_NODES} from '@/lib/providers/ingestion-limits';

const body=gunzipSync(readFileSync('tests/fixtures/nutrislice/livingston-lunch-2026-09-07.json.gz')).toString('utf8');
const week=JSON.parse(body);

test('captured sanitized Livingston week fits all ingestion budgets without dropping requested-day food',async(t)=>{
  t.mock.timers.enable({apis:['Date'],now:Date.UTC(2026,8,10,12)});
  for(const method of ['info','warn','error'] as const)t.mock.method(console,method,()=>{});
  assert.ok(Buffer.byteLength(body)>6_000_000);
  assert.equal(await readBoundedText(new Response(body),WEEK_RESPONSE_BYTES),body);
  assert.doesNotThrow(()=>validateJsonBudget(week,WEEK_JSON_NODES));
  const candidateCounts=[179,192,192,203,195,178,176];
  let fullWeek=false;
  let requestedDay=week.days[0];
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=> {
    const url=new URL(String(input));
    assert.equal(url.origin,'https://rutgers.api.nutrislice.com');
    if(url.pathname.endsWith('/schools/')) return Response.json([{id:68757,name:'Livingston Dining Commons',slug:'livingston-dining-commons'}]);
    assert.match(url.pathname,/^\/menu\/api\/weeks\/school\/68757\/menu-type\/\d+\/2026\/09\/\d{2}\/$/);
    return fullWeek ? new Response(body) : Response.json({days:[requestedDay]});
  });
  for(const [index,day] of week.days.entries()) {
    requestedDay=day;fullWeek=false;
    t.mock.timers.tick(13*3600_000);
    const baseline=await getHallMenuForDate('livingston',day.date);
    assert.ok(baseline);
    fullWeek=true;t.mock.timers.tick(13*3600_000);
    const actual=await getHallMenuForDate('livingston',day.date);
    assert.ok(actual?.isLiveData);
    assert.deepEqual(actual.meals,baseline.meals,'the full week must preserve the accepted per-day menu unchanged');
    assert.equal(actual.meals.length,3);
    // All three meal transports deliberately replay this one lunch fixture. This
    // verifies shared normalization, not breakfast/dinner payload coverage.
    for(const meal of actual.meals) {
      const items=meal.stations.flatMap(station=>station.items);
      assert.equal(items.length,candidateCounts[index]);
      assert.equal(new Set(items.map(item=>item.id)).size,items.length);
      assert.ok(items.every(item=>item.menuDate===day.date));
    }
  }
});
