import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bindF01Mechanisms} from '../src/vnext/challengerF01.ts';

const bytes=fs.readFileSync(new URL('../src/vnext/assets/palimpsest-f01-challenger.glb',import.meta.url));
const fixture=()=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const names=['tiger','wordstreamer','nialbu'];
test('Three original mounted stands rise one at a time and preserve bonded stage seams',async()=>{
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'711d0b7733605dee1ac916d602e15783d0f7b74a0efad15bfc9a9aa4ce7387fe');
  const {scene,animations}=await fixture();
  const mechanism=bindF01Mechanisms(scene,animations);
  const actors=names.map(n=>scene.getObjectByName('palimpsest-original-'+n));
  const hinges=actors.map(n=>n.parent);
  const stations=names.map((_,i)=>scene.getObjectByName('F01 shared-spine foil / '+['Tiger','Wordstreamer','NiAlBu'][i]));
  const arches=[1,2].map(i=>scene.getObjectByName('F01 late arch latch '+i));
  const floorAttributes=()=>stations.map(n=>n.geometry.getAttribute('position'));
  const checkSeam=()=>{
    const attrs=floorAttributes();
    for(let i=0;i<2;i++){
      const [a,b]=attrs.slice(i,i+2);
      for(const [k,j] of [[1,0],[2,3]]) assert.deepEqual(new T.Vector3().fromBufferAttribute(a,k).toArray(),new T.Vector3().fromBufferAttribute(b,j).toArray());
    }
  };
  let s=mechanism.update(0,0,false);assert.deepEqual(s.stage.stations,[0,0,0]);assert.equal(s.stage.archJoin,0);
  const pose=hinges.map(h=>h.quaternion.clone());
  const feet=actors.map(a=>a.position.clone());
  const tick=(mask,count)=>{
    for(let j=0;j<count;j++){s=mechanism.update(mask,.05,false);checkSeam();}
    return s;
  };
  tick(1,21);
  assert.deepEqual(s.stage.stations,[1,0,0]);
  assert.ok(pose[0].angleTo(hinges[0].quaternion)>.45);
  assert.ok(Math.abs(pose[1].dot(hinges[1].quaternion))>.99999);assert.ok(Math.abs(pose[2].dot(hinges[2].quaternion))>.99999);
  assert.equal(s.stage.archJoin,0);assert.ok(!arches.some(x=>x.visible));
  assert.ok(s.stage.territories[0]>s.stage.territories[1]);
  tick(1,22);
  assert.deepEqual(s.stage.stations,[1,1,0]);assert.equal(s.stage.archJoin,0);
  tick(1,24);
  assert.deepEqual(s.stage.stations,[1,1,1]);assert.ok(s.stage.archJoin>0&&s.stage.archJoin<1);
  tick(1,10);
  assert.deepEqual(s.stage.stations,[1,1,1]);assert.equal(s.stage.archJoin,1);
  assert.ok(arches.every(x=>x.visible));
  assert.equal(new Set(s.stage.idleTimes.map(t=>t.toFixed(2))).size,3);
  assert.ok(s.stage.depths.every(v=>v>.12));
  assert.ok(actors.every((actor,i)=>actor.parent===hinges[i]&&actor.position.equals(feet[i])));
  tick(3,18);assert.equal(s.settled,3);assert.equal(s.stage.archJoin,1);
  tick(7,18);assert.equal(s.settled,7);assert.equal(s.stage.archJoin,1);
  tick(6,82);assert.equal(s.settled,6);assert.deepEqual(s.stage.stations,[0,0,0]);assert.equal(s.stage.archJoin,0);
  mechanism.dispose();
});
test('Reduced motion uses the complete authored detents and no idle or fold sweep',async()=>{
  const {scene,animations}=await fixture();
  const mechanism=bindF01Mechanisms(scene,animations);
  const closed=mechanism.update(0,0,true);assert.deepEqual(closed.stage.stations,[0,0,0]);
  const opened=mechanism.update(1,0,true);assert.deepEqual(opened.stage.stations,[1,1,1]);
  assert.equal(opened.stage.archJoin,1);assert.deepEqual(opened.stage.idleTimes,[0,0,0]);
  assert.equal(opened.moving,false);assert.equal(opened.settled,1);
  mechanism.dispose();
});
