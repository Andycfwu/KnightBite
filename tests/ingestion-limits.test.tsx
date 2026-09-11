import assert from 'node:assert/strict';
import {test} from 'node:test';
import {BoundedPromiseCache,readBoundedText,validateJsonBudget} from '@/lib/providers/ingestion-limits';
test('declared and chunked oversized bodies are rejected and cancelled before buffering',async()=>{
  let cancelled=0;
  const stream=()=>new ReadableStream<Uint8Array>({pull(controller){controller.enqueue(new Uint8Array(10));},cancel(){cancelled++;}});
  await assert.rejects(readBoundedText(new Response(stream(),{headers:{'content-length':'100'}}),20),/response_too_large/);
  await assert.rejects(readBoundedText(new Response(stream()),20),/response_too_large/);
  assert.equal(cancelled,2);
  assert.equal(await readBoundedText(new Response('exactly'),7),'exactly');
});
test('JSON depth, collection and string limits reject excessive work without truncation',()=>{
  for(const value of ['a'.repeat(16385),Array(1801).fill(0),{a:{a:{a:{a:{a:{a:{a:{a:{a:{a:{a:{a:{a:1}}}}}}}}}}}}}]) assert.throws(()=>validateJsonBudget(value),/resource_limit/);
  assert.doesNotThrow(()=>validateJsonBudget({days:[{date:'2026-09-10',menu_items:[]}]}));
});
test('cache shares pending loads, bounds admission and never evicts active work',async()=>{
  const cache=new BoundedPromiseCache<string>(1,100);
  let resolve!:(value:string)=>void,calls=0;
  const loader=()=>{calls++;return new Promise<string>(r=>resolve=r);};
  const first=cache.load('a',loader,()=>1000);
  const second=cache.load('a',loader,()=>1000);
  assert.strictEqual(first,second);
  await assert.rejects(cache.load('b',async()=>'b',()=>1000),/resource_limit/);
  assert.equal(calls,1);resolve('a');await first;
  assert.equal(await cache.load('b',async()=>'b',()=>1000),'b');assert.equal(cache.size,1);
});
test('multi-day cache use plateaus and expires entries while respecting a byte budget',async(t)=>{
  t.mock.timers.enable({apis:['Date'],now:0});
  const cache=new BoundedPromiseCache<string>(8,40);
  for(let day=0;day<100;day++) {
    for(let label=0;label<20;label++) await cache.load(`${day}:${label}`,async()=>'12345',()=>1000);
    assert.ok(cache.size<=4);assert.ok(cache.retainedBytes<=40);
    t.mock.timers.tick(1001);assert.equal(cache.size,0);
  }
});
