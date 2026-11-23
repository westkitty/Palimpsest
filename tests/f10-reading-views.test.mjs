import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {f10ReadingView} from '../src/vnext/f10ReadingViews.ts';
test('F10 two camera poses frame the source collar and whichever source ground edition is visible',()=>{
  const wide=1.50, phone=.47;
  const close=f10ReadingView('containment',wide,false);
  const street=f10ReadingView('street',wide,false);
  const horizon=f10ReadingView('street',wide,true);
  const distance=({target,position})=>Math.hypot(...target.map((v,i)=>v-position[i]));
  assert.ok(close.target[0]<-.9&&street.target[0]>1.6);
  assert.ok(horizon.target[0]>.5&&horizon.target[0]<1);
  for(const v of ['containment','street']){
    const a=f10ReadingView(v,wide,false),b=f10ReadingView(v,phone,false);
    assert.deepEqual(a.target,b.target);
    assert.ok(distance(b)>distance(a)*1.4);
  }
  const preview=fs.readFileSync(new URL('../src/vnext/previewV2.ts',import.meta.url),'utf8');
  const choice=preview.split('function chooseF10View(')[1].split('function readF10Pose(')[0];
  assert.match(choice,/beginFlight/);
  assert.doesNotMatch(choice,/goFolio\(|handleAction\(|resetStudy\(/);
});
