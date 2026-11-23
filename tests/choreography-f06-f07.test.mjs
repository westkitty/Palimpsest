import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {attachF06AttritionTerrain,resetF06TerrainWear} from '../src/vnext/proof/f06AttritionLayers.ts';
import {createF07ReliefChoreography} from '../src/vnext/f07ReliefChoreography.ts';

const scenario={interactions:{C:{active:false}}};
function step(update,count){for(let i=0;i<count;i++)update(.04);}

test('F06 actors approach before the tear and slide the same dispatch on the actual bonded flap',()=>{
  resetF06TerrainWear();
  const world=new THREE.Group(),terrain=attachF06AttritionTerrain(world);
  assert.equal(terrain.update(0,0,false).crossingDispatch.phase,'off');
  step(dt=>terrain.update(3,dt,false),10);
  let state=terrain.update(3,0,false);
  assert.equal(state.crossingDispatch.phase,'approaching');
  assert.equal(state.tearOpen,0);
  step(dt=>terrain.update(3,dt,false),24);
  state=terrain.update(3,0,false);
  assert.equal(state.crossingDispatch.phase,'rupture');
  assert.ok(state.tearOpen>0);
  step(dt=>terrain.update(3,dt,false),24);
  state=terrain.update(3,0,false);
  assert.equal(state.crossingDispatch.phase,'sliding');
  const slip=world.getObjectByName('F06 paper dispatch on its attached crossing flap');
  const flap=world.getObjectByName('F06 torn stock still bonded at outer right crease');
  assert.equal(slip.parent,flap);
  assert.ok(slip.position.y>0&&slip.position.y<.07);
  const x=slip.position.x;
  step(dt=>terrain.update(3,dt,false),6);
  assert.ok(slip.position.x>x);
  const carried=terrain.update(3,0,false).crossingDispatch.paperX;
  step(dt=>terrain.update(3,dt,false),22);
  state=terrain.update(3,0,false);
  assert.equal(state.crossingDispatch.phase,'received');
  assert.ok(state.crossingDispatch.paperX>carried);
  assert.ok(state.crossingDispatch.banks[0]<-.25&&state.crossingDispatch.banks[1]>.35);
  const rewind=terrain.update(0,0,true);
  assert.equal(rewind.crossingDispatch.phase,'off');
  assert.ok(rewind.crossingTorn&&rewind.tearOpen===.43);
  resetF06TerrainWear();
});

test('F06 reduced motion presents a closed story on the same scar, with no animated handoff',()=>{
  resetF06TerrainWear();
  const world=new THREE.Group(),terrain=attachF06AttritionTerrain(world);
  const atRest=terrain.update(3,0,true);
  assert.equal(atRest.crossingDispatch.phase,'received');
  assert.deepEqual(atRest.crossingDispatch,terrain.update(3,8,true).crossingDispatch);
  assert.equal(atRest.tearOpen,1);
  resetF06TerrainWear();
});

test('F07 workers both hold the parcel during a purposeful pause on a real hinged ramp',()=>{
  const world=new THREE.Group();
  const update=createF07ReliefChoreography(world);
  const relief=world.getObjectByName('F07 · illustrated Administration relief supplies');
  const advance=n=>step(dt=>update(scenario,dt,false),n);
  const read=()=>relief.userData.choreography;
  advance(51);
  const first={...read()};
  assert.equal(first.phase,'carry');
  advance(12);
  const pause={...read()};
  assert.equal(pause.phase,'adjust');
  assert.ok(Math.abs(pause.parcelTilt)>.22);
  assert.ok(pause.rampDeflection>.03);
  assert.ok(pause.contacts.every(x=>x<.005));
  assert.ok(pause.footHeights.flat().every(height=>height===0),'finish both strides before the shared pause');
  assert.ok(pause.shuffler!==first.shuffler||pause.rootX[0]>first.rootX[0]);
  const crease=world.getObjectByName('F07 · actual hinged relief ramp');
  assert.ok(crease.children.some(x=>x.rotation.z!==0));
  for(const part of crease.children.filter(x=>x.name.includes('working ramp stock'))){
    const bounds=new THREE.Box3().setFromObject(part);
    assert.ok(bounds.max.y>.036,'central ramp face remains above the cream stock');
  }
  advance(67);
  assert.equal(read().phase,'set-down');
  assert.ok(read().parcelX>pause.parcelX+.14);
  assert.ok(read().rampDeflection<pause.rampDeflection);
});

test('F07 reduced motion holds the load at its readable endpoint without a loop',()=>{
  const world=new THREE.Group(),update=createF07ReliefChoreography(world);
  const relief=world.getObjectByName('F07 · illustrated Administration relief supplies');
  update(scenario,0,true);
  assert.equal(relief.userData.choreography.phase,'complete');
  const held=relief.userData.choreography;
  update(scenario,20,true);
  assert.deepEqual(relief.userData.choreography,held);
  assert.ok(world.getObjectByName('F07 · actual paper parcel crossing between the hands').visible);
});

test('F07 opening the native supply tab replays delivery, while other tabs do not reset it',()=>{
  const world=new THREE.Group(),update=createF07ReliefChoreography(world);
  const relief=world.getObjectByName('F07 · illustrated Administration relief supplies');
  step(dt=>update(scenario,dt,false),188);
  assert.equal(relief.userData.choreography.phase,'complete');
  update({interactions:{...scenario.interactions,A:{active:true}}},.04,false);
  assert.equal(relief.userData.choreography.phase,'complete');
  update({interactions:{C:{active:true}}},.04,false);
  assert.equal(relief.userData.choreography.phase,'approach');
  assert.equal(relief.userData.passed,false);
});
