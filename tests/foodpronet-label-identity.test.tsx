import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assertLabelIdentity} from '@/lib/providers/foodpronet-label-identity';
const href='label.aspx?locationNum=13&dtdate=9/8/2026&RecNumAndPort=150157*1';
test('explicit returned recipe, portion and date must agree before nutrition is used',()=>{
  for(const [name,value] of [['RecNumAndPort','other*1'],['RecNumAndPort','150157*2'],['locationNum','1'],['dtdate','9/9/2026']]) {
    assert.throws(()=>assertLabelIdentity(`<input value="${value}" name="${name}">`,href,'2026-09-08'),/parse_error/);
  }
  assert.doesNotThrow(()=>assertLabelIdentity('<input name="RecNumAndPort" value="150157*1"><input name="locationNum" value="13"><input name="dtdate" value="9/8/2026">',href,'2026-09-08'));
});
test('ambiguous fields reject; absent fields, scripts and ingredients supply no identity claim',()=>{
  assert.throws(()=>assertLabelIdentity('<input name="RecNumAndPort" value="150157*1"><input name="RecNumAndPort" value="150157*1">',href,'2026-09-08'));
  assert.throws(()=>assertLabelIdentity('<input name="RecNumAndPort" value="150157*1" value="wrong">',href,'2026-09-08'));
  assert.doesNotThrow(()=>assertLabelIdentity('<p>Ingredients: rice</p><!-- <input name="RecNumAndPort" value="wrong"> -->',href,'2026-09-08'));
});
