import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createF11PaperFeet,f11Choreography} from '../src/vnext/f11Choreography.ts';
import {f11WildlifeBeats} from '../src/vnext/f11PaperWildlife.ts';

test('Marcel and Codec step independently before sharing a lean over unbroken stock',()=>{
  const at=f=>f11Choreography(f,false);
  assert.equal(at(40.5).codec.x,at(34).codec.x);
  assert.ok(at(42.6).codec.x>at(34).codec.x);
  assert.ok(at(44).marcel.x<at(38).marcel.x);
  assert.ok(at(47.8).marcel.pitch>.20&&at(47.8).codec.pitch>.20);
  assert.ok(at(47.8).codec.x<-.26&&at(47.8).marcel.x>-.26);
  assert.ok(at(47.8).marcel.yaw<-.8&&at(47.8).codec.yaw>.8);
  assert.ok(at(92).codec.x<at(47.8).codec.x,'leave room for the bloom without shifting the plant');
});

test('the same scene has planted support, an animal stop, and a later interrupted follow',()=>{
  const at=f=>f11Choreography(f,false);
  const records=Array.from({length:181*16},(_,i)=>at(i/16));
  assert.ok(records.some(r=>r.codec.left.lift>.06));
  assert.ok(records.some(r=>r.marcel.right.lift>.06));
  for(const {codec,marcel} of records){
    assert.equal(Math.min(codec.left.lift,codec.right.lift),0);
    assert.equal(Math.min(marcel.left.lift,marcel.right.lift),0);
  }
  assert.equal(at(105).marcel.x,at(108).marcel.x,'Marcel really waits, rather than stepping in place');
  assert.ok(at(111.8).marcel.x>at(108).marcel.x);
  assert.equal(f11WildlifeBeats(105).encounter,'in-path');
  assert.equal(f11WildlifeBeats(108).encounter,'ducking-away');
  assert.ok(at(145).marcel.x>at(126).marcel.x+.28);
  assert.ok(at(136).codec.x>at(126).codec.x+.14);
  assert.equal(at(137).codec.x,at(140).codec.x,'Codec plants the step before withdrawing');
  assert.ok(at(155).codec.x<at(137).codec.x-.25);
});

test('reduced motion keeps the same narrative stations without steps or foot lift',()=>{
  for(let f=0;f<181;f+=.1){
    const reduced=f11Choreography(f,true);
    for(const {left,right,bob} of [reduced.codec,reduced.marcel]) assert.equal(left.lift+right.lift+bob,0);
  }
  assert.equal(f11Choreography(47,true).codec.x,f11Choreography(48,false).codec.x);
  assert.equal(f11Choreography(107,true).marcel.x,f11Choreography(107,false).marcel.x);
  assert.equal(f11Choreography(150,true).marcel.x,f11Choreography(150,false).marcel.x);
});

test('real imported paper shoes move separately, then restore their original silhouette',async()=>{
  const raw=gunzipSync(readFileSync(new URL('../src/vnext/assets/palimpsest-f11-challenger.glb.gz',import.meta.url)));
  const {scene}=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
  const actor=scene.getObjectByName('ACTOR_CODEC');
  const shoe=scene.getObjectByName('PAPER_001');
  const mount=new T.Group();
  actor.position.set(0,0,0);actor.rotation.set(0,0,0);actor.scale.setScalar(1);
  mount.add(actor);
  const feet=createF11PaperFeet(actor,['PAPER_000','PAPER_001']);
  const attr=shoe.geometry.getAttribute('position');
  const original=Array.from(attr.array);
  const pose=f11Choreography(42.00,false).codec;assert.ok(pose.right.lift>.04);
  mount.position.set(pose.x,pose.bob,pose.z);
  feet(pose,()=>0,mount);
  const toeOffset=i=>attr.getY(i)+mount.position.y-original[i*3+1];
  const left=Array.from({length:attr.count},(_,i)=>i).filter(i=>attr.getX(i)>.08&&original[i*3+1]<.035);
  const right=Array.from({length:attr.count},(_,i)=>i).filter(i=>attr.getX(i)<-.08&&original[i*3+1]<.035);
  assert.ok(left.length>0&&right.length>0);
  assert.ok(left.every(i=>Math.abs(toeOffset(i))<.0001),'support side stays on the stock');
  assert.ok(right.every(i=>toeOffset(i)>.04),'swing side actually lifts the authored toe');
  feet(f11Choreography(48,false).codec,()=>0,mount);
  assert.deepEqual(Array.from(attr.array),original);
});
