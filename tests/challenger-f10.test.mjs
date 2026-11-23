import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const b=readFileSync(new URL('../src/vnext/assets/palimpsest-f10-challenger.glb',import.meta.url));
const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
const gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.length),'');
const prefix=key=>gltf.scene.getObjectByName(key);
test('F10 export holds 12 independently keyed rooted paper leaves and exactly one fixed black receiver',()=>{
  assert.equal(gltf.animations.length,12);
  const receiver=prefix('F10_A_RECEIVER_CORE');
  assert.ok(receiver instanceof THREE.Mesh);
  assert.equal(json.nodes.filter(x=>x.name==='F10_A_RECEIVER_CORE').length,1);
  assert.ok(!json.cameras&&!json.images);
  const radius=[];
  for(let i=1;i<=12;i++){
    const id=String(i).padStart(2,'0');
    const [pin,hinge,leaf]=['AXIS','HINGE','LEAF'].map(s=>prefix('F10_A_'+s+'_'+id));
    assert.equal(leaf.parent.name,hinge.name);
    assert.equal(hinge.parent.name,pin.name);
    radius.push(Math.hypot(pin.position.x-receiver.position.x,pin.position.z-receiver.position.z));
    assert.ok(leaf.geometry.getAttribute('position').count>20,'not a proxy fin');
  }
  assert.ok(radius.every(n=>Math.abs(n-.84)<1e-5));
  assert.ok(json.animations.every(a=>a.channels.length===1&&a.channels.every(c=>c.target.path==='rotation'&&json.nodes[c.target.node].name.startsWith('F10_A_HINGE_'))));
});

test('F10 authored transforms lift one hinge before its staggered neighbor, settle upright, then scrub closed',()=>{
  const mix=new THREE.AnimationMixer(gltf.scene);
  const actions=gltf.animations.map(c=>{
    const a=mix.clipAction(c).setLoop(THREE.LoopOnce,1).play();a.clampWhenFinished=true;a.paused=true;return a;
  });
  const set=t=>{actions.forEach(a=>{a.time=Math.min(a.getClip().duration,t);});mix.update(0);};
  const id=new THREE.Quaternion();
  const angle=n=>prefix('F10_A_HINGE_'+n).quaternion.angleTo(id);
  set(.40);assert.ok(angle('01')<1e-3);
  set(.97);assert.ok(angle('01')>angle('06')+.12);
  set(2.4);for(let i=1;i<=12;i++)assert.ok(Math.abs(angle(String(i).padStart(2,'0'))-Math.PI/2)<1e-3);
  set(.40);assert.ok(angle('01')<1e-3);
});
