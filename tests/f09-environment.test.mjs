import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bindF09CandidateStage,F09_MODEL_CENTER} from '../src/vnext/proof/f09CandidateStage.ts';
import {f09Cue,newF09CollapsingPaperGround} from '../src/vnext/f09EnvironmentalTheatre.ts';
import {newLaterState,operateLater,restoreLaterStudy,serializeLaterStudy} from '../src/vnext/laterFolioState.ts';
const payload=fs.readFileSync(new URL('../src/vnext/assets/palimpsest-f09-challenger.glb',import.meta.url));
const fixture=()=>new GLTFLoader().parseAsync(payload.buffer.slice(payload.byteOffset,payload.byteOffset+payload.byteLength),'');
test('Tension leads three overlapping model-local paper waves, strongest nearest',()=>{
  assert.deepEqual(f09Cue(14).waves,[0,0,0]);assert.equal(f09Cue(14).phase,'tension');
  assert.ok(f09Cue(21).waves[0]>0);assert.equal(f09Cue(21).waves[1],0);
  const max=[0,0,0];
  let all=false;
  for(let f=10;f<70;f+=.25){
    const {waves}=f09Cue(f);waves.forEach((w,i)=>max[i]=Math.max(max[i],w));if(waves.every(w=>w>.1))all=true;
  }
  assert.ok(all);assert.ok(max[0]>max[1]&&max[1]>max[2]);
  const art=new T.Group(),floor=newF09CollapsingPaperGround(art,F09_MODEL_CENTER);
  const sections=art.children[0].children;
  assert.equal(sections.length,18);assert.ok(sections.every(p=>p.position.x<-.25));
  const roots=sections.map(p=>p.position.clone());
  const none=floor.update(70,false);assert.deepEqual(none,[0,0,0]);
  const motion=floor.update(29,false);assert.ok(motion[0]>motion[1]&&motion[1]>motion[2]);
  assert.ok(sections.every((p,i)=>p.position.equals(roots[i])));
  assert.deepEqual(floor.update(34,true),[0,0,0]);
});
test('F09 actual bends radiate around native spokes before the quiet irreversible state',async()=>{
  assert.equal(crypto.createHash('sha256').update(payload).digest('hex'),'1ee0cb650ee4b151a439188cd8bb6b706a8d8fc85fcf46115eb9c9b9d20bc6a3');
  const {scene,animations}=await fixture(), mechanism=bindF09CandidateStage(scene,animations);
  let state=newLaterState(8),proof=mechanism.update(state,0,false);
  assert.equal(proof.environmentalBeat,'rest');
  state=operateLater(state,'A');assert.ok(state.interactions.A.locked);
  let trace=[];
  for(let k=0;k<260;k++){
    if(k===82)state=operateLater(state,'B');
    if(k===125)state=operateLater(state,'C');
    proof=mechanism.update(state,1/60,false);trace.push(proof);
  }
  assert.ok(trace.some(t=>t.environmentalBeat==='tension'&&t.filamentTravel>.06&&t.petalDegrees.every(d=>d<.02)));
  assert.ok(trace.some(t=>t.environmentalBeat==='scored-fold'&&t.petalDegrees[0]>36&&t.petalDegrees[7]<12));
  assert.ok(trace.some(t=>t.gimbal.some(a=>Math.abs(a)>.015)));
  assert.equal(proof.modelState,'matte-absence');assert.equal(proof.authorFrame,70);
  assert.ok(proof.petalDegrees.every(d=>d>101));
  assert.ok(proof.gimbal.every(d=>Math.abs(d)<.00001));
  assert.equal(proof.activeFilamentMorphs,1);
  assert.equal(mechanism.hits[1].visible,false);assert.equal(mechanism.hits[2].visible,true);
  assert.equal(state.interactions.B.step,1);assert.equal(state.interactions.C.active,true);
  state=operateLater(state,'A');assert.equal(mechanism.update(state,0,false).authorFrame,70);
  mechanism.dispose();
  const again=await fixture(),fresh=bindF09CandidateStage(again.scene,again.animations);
  assert.equal(fresh.update(state,0,true).authorFrame,70);
  assert.deepEqual(fresh.update(state,0,true).gimbal,[0,0,0]);
  fresh.dispose();
});
