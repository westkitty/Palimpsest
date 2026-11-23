import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import { createF04Environment, f04Detents, f04EnvironmentalRead } from '../src/vnext/proof/f04Environment.ts';
import { nextExpansionFrame } from '../src/vnext/proof/f04CandidateStage.ts';

test('F04 light leaves the colony before the first relay; each detent is ordered and the terminal lane is left dark',()=>{
 const closed=f04EnvironmentalRead(1);assert.equal(closed.segment,-1);assert.equal(closed.colonySignal,false);
 assert.deepEqual(closed.relays,[0,0,0,0,0]);
 const first=f04EnvironmentalRead(5);assert.equal(first.segment,0);assert.ok(first.along>0&&first.along<1);assert.equal(first.colonySignal,true);
 for(let i=1;i<5;i++){
   const p=f04EnvironmentalRead(f04Detents[i]+2);
   assert.equal(p.segment,i);
   assert.deepEqual(p.relays,Array.from({length:5},(_,k)=>Number(k<i)));
 }
 const final=f04EnvironmentalRead(38);assert.equal(final.segment,-1);assert.deepEqual(final.relays,[1,1,1,1,1]);
 const sampled=nextExpansionFrame(18.4,false,.07,false);assert.equal(sampled,18.4);
 assert.deepEqual(f04EnvironmentalRead(sampled),f04EnvironmentalRead(18.4));
});
test('F04 actual dock flaps follow the same B clock and the colony lantern mounts on the existing A pivot',()=>{
 const scene=new THREE.Group(),colony=new THREE.Group();scene.add(colony);
 const lamps=Array.from({length:5},(_,i)=>{const n=new THREE.Group();n.position.set(-.52+i*.26,.243+(i%2)*.08,-.76);return n});
 const field=createF04Environment(scene,colony,lamps);
 assert.deepEqual(field.update(1),{colonySignal:false,pulseSegment:-1,pulseAlong:0,relaysUnfolded:0,unfinishedLaneDark:true});
 assert.ok(colony.getObjectByName('Paper first lamp amber insert'));
 const pause=field.update(18.2);assert.equal(pause.relaysUnfolded,2);assert.equal(pause.pulseSegment,2);
 assert.deepEqual(field.update(18.2),pause);
 const final=field.update(38);assert.equal(final.relaysUnfolded,5);assert.equal(final.unfinishedLaneDark,true);
 assert.ok(scene.getObjectByName('Unfinished dark lane, no destination represented'));
 field.dispose();assert.equal(colony.children.length,0);assert.equal(scene.children.length,1);
});
