import assert from 'node:assert/strict';
import test from 'node:test';
import {
 INITIAL_MISUNDERSTANDING_STATE, MISUNDERSTANDING_STUDY_KEY, NEW_FOLIO_ACTIONS,
 activateMisunderstanding,restoreMisunderstanding,serializeMisunderstanding,
} from '../src/vnext/greatMisunderstandingState.ts';

test('new F04 preserves three visible and independent editorial mechanisms',()=>{
  assert.equal(NEW_FOLIO_ACTIONS.length,3);
  assert.match(MISUNDERSTANDING_STUDY_KEY,/great-misunderstanding/);
  const a=activateMisunderstanding(INITIAL_MISUNDERSTANDING_STATE,'A');
  assert.deepEqual(a,{eggLanded:true,templeRaised:false,roofLifted:false});
  const b=activateMisunderstanding(a,'B');
  assert.deepEqual(b,{eggLanded:true,templeRaised:true,roofLifted:false});
  const c=activateMisunderstanding(b,'C');
  assert.deepEqual(c,{eggLanded:true,templeRaised:true,roofLifted:true});
  assert.deepEqual(activateMisunderstanding(c,'C'),b);
  assert.deepEqual(activateMisunderstanding(c,'B'),{eggLanded:true,templeRaised:false,roofLifted:false});
  assert.deepEqual(activateMisunderstanding(c,'A'),INITIAL_MISUNDERSTANDING_STATE);
});
test('F04 can be operated in any order and restores only safe bounded state',()=>{
  const c=activateMisunderstanding(INITIAL_MISUNDERSTANDING_STATE,'C');
  assert.deepEqual(c,{eggLanded:true,templeRaised:true,roofLifted:true});
  assert.deepEqual(restoreMisunderstanding(serializeMisunderstanding(c)),c);
  assert.deepEqual(restoreMisunderstanding({version:1,state:{eggLanded:false,templeRaised:true,roofLifted:true}}),INITIAL_MISUNDERSTANDING_STATE);
  assert.deepEqual(restoreMisunderstanding({version:1,state:{eggLanded:true,templeRaised:false,roofLifted:true}}),{eggLanded:true,templeRaised:false,roofLifted:false});
  assert.deepEqual(restoreMisunderstanding({version:2,state:{eggLanded:true}}),INITIAL_MISUNDERSTANDING_STATE);
  assert.throws(()=>activateMisunderstanding(c,'Z'),RangeError);
});
