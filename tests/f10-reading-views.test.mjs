import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {f10ReadingView} from '../src/vnext/f10ReadingViews.ts';
import { ADMINISTRATION_EXTERIOR_ORBIT, isAdministrationExteriorPlate } from '../src/vnext/administrationReadingCamera.ts';
const preview=fs.readFileSync(new URL('../src/vnext/previewV2.ts',import.meta.url),'utf8');
test('F10 wall overview and street frame the original plate from the reader’s inhabited-side margin',()=>{
  const wide=1.50, phone=.47;
  const wall=f10ReadingView('wall',wide,false);
  const street=f10ReadingView('street',wide,false);
  const horizon=f10ReadingView('street',wide,true);
  const distance=({target,position})=>Math.hypot(...target.map((v,i)=>v-position[i]));
  assert.ok(wall.target[0]<-.9&&street.target[0]>1.6);
  assert.ok(horizon.target[0]>.5&&horizon.target[0]<1);
  for(const [view,ground] of [['wall',false],['street',false],['street',true]]){
    const a=f10ReadingView(view,wide,ground),b=f10ReadingView(view,phone,ground);
    assert.deepEqual(a.target,b.target);
    assert.ok(distance(b)>distance(a)*1.4);
    for(const {position:[x,y,z],target:[tx,ty,tz]} of [a,b]){
      assert.ok(x>tx&&x>0&&y>1.7&&z>1.8,'not inside the collar, on the containment side, or at figure height');
      const theta=Math.atan2(x-tx,z-tz);
      const phi=Math.atan2(Math.hypot(x-tx,z-tz),y-ty);
      assert.ok(theta<=ADMINISTRATION_EXTERIOR_ORBIT.maxAzimuthAngle);
      assert.ok(phi<=ADMINISTRATION_EXTERIOR_ORBIT.maxPolarAngle);
    }
  }
  const choice=preview.split('function chooseF10View(')[1].split('function readF10Pose(')[0];
  assert.match(choice,/beginFlight/);
  assert.doesNotMatch(choice,/goFolio\(|handleAction\(|resetStudy\(/);
});
test('Drakken and DRAXIS remain subjects of the Administration plate in F05, F06, and F10',()=>{
  assert.deepEqual(Array.from({length:13},(_,i)=>i).filter(isAdministrationExteriorPlate),[4,5,9]);
  assert.ok(ADMINISTRATION_EXTERIOR_ORBIT.maxAzimuthAngle<Math.PI/2);
  assert.ok(ADMINISTRATION_EXTERIOR_ORBIT.minAzimuthAngle> -Math.PI/2);
  assert.ok(ADMINISTRATION_EXTERIOR_ORBIT.minDistance*Math.cos(ADMINISTRATION_EXTERIOR_ORBIT.maxPolarAngle)>1);
  const miniature=preview.split('function enterMini():void {')[1].split('function leaveMini(')[0];
  assert.match(miniature,/if\(isAdministrationExteriorPlate\(currentFolio\)\)\{[\s\S]*?return;/);
  const html=fs.readFileSync(new URL('../folio-vnext.html',import.meta.url),'utf8');
  assert.match(html,/data-f10-view="wall"[^>]+>Wall overview/);
  assert.doesNotMatch(html,/Containment edge/);
});
