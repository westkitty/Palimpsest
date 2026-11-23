import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const glb=fs.readFileSync(new URL('../src/vnext/proof/assets/palimpsest-f08-challenger.glb',import.meta.url));
const json=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)));
const {scene,animations}=await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
const mixer=new T.AnimationMixer(scene);
const actions=animations.map(x=>{
  const a=mixer.clipAction(x).setLoop(T.LoopOnce,1).play();a.paused=true;a.clampWhenFinished=true;return a;
});
const byName=n=>scene.getObjectByName(n);
const meshes=(r,fn)=>{const nodes=[];r.traverse(n=>{if(fn(n))nodes.push(n);});return nodes;};
const pick=n=>meshes(scene,x=>x.name.includes(n))[0];
const pose=(a,b,c)=>{[a,b,c].forEach((f,i)=>actions[i].time=(f-1)/24);mixer.update(0);scene.updateMatrixWorld();};
const near=(x,y,eps=.00001)=>assert.ok(Math.abs(x-y)<eps,[x,y]);
const wide=v=>Math.abs(v.quaternion.y);
test('F08 disjoint approved actions, no hidden text or runtime replacement actors',()=>{
  assert.deepEqual(animations.map(a=>a.name),['F08_BLENDER_SLOT_A','F08_BLENDER_SLOT_B','F08_BLENDER_SLOT_C']);
  assert.deepEqual(animations.map(a=>a.tracks.length),[2,22,5]);
  const tracks=animations.flatMap(a=>a.tracks.map(x=>x.name));
  assert.equal(tracks.length,new Set(tracks).size);
  assert.equal(json.images,undefined);
  assert.equal(json.cameras,undefined);
  assert.ok(!json.nodes.some(n=>/testimony|inspection|secret|Marcel|Codec|Shard.God/i.test(n.name)));
});
test('F08 real shutters open independently, B replaces gold with physical broken ring',()=>{
  pose(1,1,1);
  let l=byName('F08_SHUTTER_L'),r=byName('F08_SHUTTER_R');
  near(wide(l),Math.sin(11.5*Math.PI/360));near(l.quaternion.y,-r.quaternion.y);
  const gold=pick('B_whole_gold_circle');
  const shards=meshes(scene,x=>/^B_low_crimson_fracture_band_fragment/.test(x.name)&&x.parent?.name.startsWith('F08_B_VIS_'));
  assert.equal(shards.length,3);
  const parents=shards.map(s=>s.parent);
  assert.equal(gold.parent.scale.x,1);assert.ok(parents.every(n=>n.scale.x===0));
  pose(40,1,1);
  near(wide(l),Math.sin(87.1*Math.PI/360));near(l.quaternion.y,-r.quaternion.y);
  assert.equal(gold.parent.scale.x,1);assert.ok(parents.every(n=>n.scale.x===0));
  pose(1,88,1);
  near(wide(l),Math.sin(11.5*Math.PI/360));
  assert.equal(gold.parent.scale.x,0);assert.ok(parents.every(n=>n.scale.x===1));
  assert.ok(byName('F08_B_SLIDER').position.x>.45);
  pose(1,1,1);assert.ok(byName('F08_B_SLIDER').position.x<-.45);
});
test('F08 twenty distinct volumetric Blood Rings on four genuinely serial hinges',()=>{
  const leaves=[1,2,3,4].map(i=>byName('F08_C_LEAF_'+i));
  for(let i=1;i<4;i++)assert.equal(leaves[i].parent,leaves[i-1]);
  pose(1,1,1);const folded=leaves[3].getWorldPosition(new T.Vector3()).x;
  pose(1,1,153);
  const open=leaves[3].getWorldPosition(new T.Vector3()).x;
  assert.ok(open-folded>.80);
  const ringNames=[];
  for(const [i,leaf] of leaves.entries()){
    const set=meshes(leaf,n=>/^C_world_\d\d.*opaque_crimson_Blood_Ring/.test(n.name)).filter(o=>o.parent===leaf);
    assert.equal(set.length,5);
    set.forEach(r=>{
      ringNames.push(r.name);
      const box=new T.Box3().setFromObject(r), dims=box.getSize(new T.Vector3());
      assert.ok(Math.min(dims.x,dims.y,dims.z)>0.010);
      assert.ok(meshes(r,n=>n instanceof T.Mesh).reduce((sum,m)=>sum+m.geometry.index.count,0)>=300);
    });
    const a=new T.Vector3(.875,0,0).applyMatrix4(leaf.matrixWorld);
    if(i<3)near(a.distanceTo(leaves[i+1].getWorldPosition(new T.Vector3())),0);
  }
  assert.equal(ringNames.length,new Set(ringNames).size);
});
