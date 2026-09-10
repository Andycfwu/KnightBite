import assert from 'node:assert/strict';
import {test} from 'node:test';
import {clearPreferences,decodePreferences,defaultPreferences,PREFERENCES_KEY,readPreferences,savePreferences} from '@/lib/preferences-storage';
function storage(initial:string|null=null) {
  let value=initial;
  return {getItem:(_key:string)=>value,setItem:(_key:string,next:string)=>{value=next;},removeItem:(_key:string)=>{value=null;}};
}
for(const name of ['SecurityError','QuotaExceededError']) test(`storage ${name} keeps preferences usable without claiming a save`,()=>{
  const denied = () => {throw new DOMException('synthetic',name);};
  assert.equal(readPreferences(denied).status,'unavailable');
  assert.equal(savePreferences(denied,defaultPreferences()),'unavailable');
  const full = storage(); full.setItem=denied;
  assert.equal(savePreferences(()=>full,defaultPreferences()),'unavailable');
  assert.equal(clearPreferences(denied),'clear_failed');
});
for(const raw of ['{bad','null','[]','{"version":2}','{"dietaryPreferences":{"vegan":"false"}}','{"macroGoals":{"protein":-3}}','x'.repeat(4097)]) test(`unreadable preferences are preserved: ${raw.slice(0,60)}`,()=>{
  const store=storage(raw);
  assert.equal(decodePreferences(raw),null);
  assert.equal(readPreferences(()=>store).status,'invalid');
  assert.equal(savePreferences(()=>store,defaultPreferences()),'invalid');
  assert.equal(store.getItem(PREFERENCES_KEY),raw);
});
test('valid legacy values read without rewriting and migrate on an explicit edit',()=>{
  const legacy={...defaultPreferences(),macroGoals:{protein:'125',carbs:'',fat:''}};
  const raw=JSON.stringify(legacy); const store=storage(raw);
  assert.deepEqual(readPreferences(()=>store).preferences,legacy);
  assert.equal(store.getItem(PREFERENCES_KEY),raw);
  assert.equal(savePreferences(()=>store,legacy),'saved');
  assert.equal(JSON.parse(store.getItem(PREFERENCES_KEY)!).version,1);
  assert.deepEqual(readPreferences(()=>store).preferences,legacy);
  assert.equal(clearPreferences(()=>store),'cleared');
  assert.equal(store.getItem(PREFERENCES_KEY),null);
});
