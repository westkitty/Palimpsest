import fs from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {f02InkRate,f02InkBeat,f02ArmExtensions,f02AnchoredHeight} from '../src/vnext/f02Motion.ts';
import {bindF02AnchoredArms} from '../src/vnext/challengerF02.ts';

test('F02 white → drop → wick → binding dam → faster crossing are explicit monotonic counterparts',()=>{
  const p=[0,.05,.26,.39,.52,.8,1];
  assert.deepEqual(p.map(f02InkBeat),['white-vellum','drop-and-forks','wick','gutter-dam','crossing','soaking','settled']);
  assert.ok(f02InkRate(.39)<f02InkRate(.26)/2);
  assert.ok(f02InkRate(.52)>f02InkRate(.39)*3.5);
  assert.ok(p.every(v=>f02InkRate(v)>0));
  const shader=fs.readFileSync(new URL('../src/vnext/revisionEarlyArt.ts',import.meta.url),'utf8');
  assert.match(shader,/right=max\(\.472,/);
  assert.match(shader,/float safeInterior=smoothstep\(\.059,\.090,tide\)\*step\(\.001,advance\)/);
  assert.match(shader,/paper\+=stellar\*safeInterior/);
  assert.match(shader,/float points=smoothstep\(\.123,\.251,advance\)/);
});
test('F02 deforms the exact four source strips with corresponding five V supports while glue stays fixed',async()=>{
  const bytes=fs.readFileSync(new URL('../src/vnext/assets/palimpsest-f02-challenger.glb',import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
  const stellar=gltf.scene.getObjectByName('F02_STELLAR_C');
  const strip=stellar.getObjectByName('Black_die-cut_spiral_strip_4');
  const ink=stellar.getObjectByName('Printed_ink_face_of_spiral_strip_4');
  const support=stellar.children.filter(n=>/^Folded_black_ribbon_support.*leaf019$/.test(n.name))[0];
  const feet=stellar.children.filter(n=>/^Spiral_ribbon_bond_foot/.test(n.name));
  assert.equal(feet.length,20);
  const parts=[strip,ink,support];
  assert.ok(parts.every(o=>o instanceof THREE.Mesh));
  const read=o=>Array.from(o.geometry.getAttribute('position').array);
  const before=parts.map(read),beforeN=parts.map(o=>Array.from(o.geometry.getAttribute('normal').array));
  const bond=feet.map(o=>o.position.toArray());
  const move=bindF02AnchoredArms(gltf.scene);
  assert.deepEqual(move(82),f02ArmExtensions(82));
  assert.ok(f02ArmExtensions(83)[0]>f02ArmExtensions(83)[3]+.15);
  for(const [j,o] of parts.entries()){
    const after=read(o);
    assert.ok(before[j].some((v,i)=>i%3===1&&v>.040&&Math.abs(v-after[i])>.004),o.name);
    assert.ok(before[j].every((v,i)=>i%3===1?Math.abs(f02AnchoredHeight(v,.21)-after[i])<.000001:v===after[i]),o.name);
  }
  assert.deepEqual(feet.map(o=>o.position.toArray()),bond);
  assert.deepEqual(move(110),[1,1,1,1]);
  assert.deepEqual(parts.map(read),before);
  assert.deepEqual(parts.map(o=>Array.from(o.geometry.getAttribute('normal').array)),beforeN);
});
