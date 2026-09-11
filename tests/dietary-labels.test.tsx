import assert from 'node:assert/strict';
import {test} from 'node:test';
import {classifyDietaryLabels} from '@/lib/providers/dietary-labels';
import {matchesMenuFilter} from '@/lib/menu-filters';
import type {MenuItem} from '@/lib/types';
test('explicit free-from labels are not allergens; contains and may-contain keep their meaning',()=>{
  const result=classifyDietaryLabels(['Gluten Free','Milk-Free','Nut Free','Contains Egg','May contain sesame','Vegan','Low carbon footprint']);
  assert.deepEqual(result.tags,['gluten-free','milk-free','nut-free','vegan']);
  assert.deepEqual(result.allergens,['contains egg','may contain sesame']);
  assert.deepEqual(result.sourceLabels,['Low carbon footprint']);
  assert.equal(matchesMenuFilter({...result} as MenuItem,'gluten-free'),true);
});
test('unknown/missing labels never become dietary guarantees and conflicting labels do not pass filters',()=>{
  assert.deepEqual(classifyDietaryLabels([]),{tags:undefined,allergens:undefined,sourceLabels:undefined});
  const unknown=classifyDietaryLabels(['Gluten friendly','Not vegan','No allergen data']);
  assert.equal(unknown.tags,undefined);assert.equal(unknown.allergens,undefined);assert.equal(unknown.sourceLabels!.length,3);
  const conflict=classifyDietaryLabels(['Gluten Free','Contains Wheat','No Milk','Milk','Nut Free','Peanuts']);
  assert.equal(conflict.tags,undefined);
  assert.equal(conflict.allergens!.length,3);
  assert.equal(matchesMenuFilter({...conflict} as MenuItem,'gluten-free'),false);
});
