import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Group, Raycaster, Vector3} from 'three';
import {primaryPaperSlot,makePrimaryPaperGrip,invitationFrame} from '../src/vnext/primaryPaperControl.ts';
test('a quiet hand-off belongs to each playable spread, not the closing page',()=>{
  assert.deepEqual(Array.from({length:13},(_,i)=>primaryPaperSlot(i)),['A','A','A','B','B','A','A','A','B','A','A','A',null]);
  assert.equal(invitationFrame(.4,true),0);
  assert.ok(invitationFrame(.16,false)>.45);
  assert.ok(invitationFrame(.53,false)<0,'paper rebounds once');
  assert.equal(invitationFrame(.86,false),0);
});
test('the front cut control actually owns a paper-space hit, and has a reserved accessible resting pose',()=>{
  const g=new Group(), grip=makePrimaryPaperGrip(g,8);
  assert.equal(grip.slot,'B');assert.equal(g.children.length,1);
  grip.update(.16,false);const rose=grip.flap.rotation.x;
  grip.update(.86,false);assert.ok(rose<grip.flap.rotation.x);
  g.updateMatrixWorld(true);
  const pt=grip.hit.getWorldPosition(new Vector3());
  const ray=new Raycaster(pt.clone().add(new Vector3(0,4,0)),new Vector3(0,-1,0));
  assert.equal(ray.intersectObject(grip.hit,false).length,1);
  assert.equal(makePrimaryPaperGrip(g,12),null);
});
