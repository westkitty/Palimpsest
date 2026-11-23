import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const read = name => readFileSync(new URL('../src/vnext/assets/'+name,import.meta.url));
const bytes=gunzipSync(read('palimpsest-f11-challenger.glb.gz'));
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
const motion=JSON.parse(read('palimpsest-f11-motion.json'));

test('F11 preserves named Blender pivots, source solid geometry and bounded WebGL draws',()=>{
  assert.equal(bytes.subarray(0,4).toString(),'glTF');
  const names=gltf.nodes.map(n=>n.name);
  assert.equal(names.filter(n=>/^PLANT_\d+$/.test(n)).length,27);
  assert.equal(names.filter(n=>/^STEM_\d+$/.test(n)).length,27);
  assert.equal(names.filter(n=>/^FROND_\d+_\d+$/.test(n)).length,108);
  assert.ok(gltf.meshes.length<=225);
  assert.ok(gltf.meshes.filter(m=>m.primitives.some(p=>'COLOR_0' in p.attributes)).length>=130);
  assert.ok(names.includes('ROOT_REGISTER')&&names.includes('ROOT_TRACE')&&names.includes('MARCEL_EFFECT'));
  assert.ok(!gltf.cameras&&!gltf.images&&!names.some(n=>n.includes('archival')));
  for(const name of ['ACTOR_CODEC','ACTOR_MARCEL','ACTOR_TIGER','CODEC_HEAD_STORY','ROOT_TRACE','STEM_01','FROND_14_1']){
    assert.ok(gltf.animations.some(a=>a.channels.some(c=>gltf.nodes[c.target.node].name===name)),name);
  }
});

test('F11 static paper batches keep identity at every animated hinge',()=>{
  const staticIDs=new Set();
  for(const [i,n] of gltf.nodes.entries()){
    if(!/^(?:PAPER_|TIGER_EYE_)/.test(n.name))continue;
    staticIDs.add(i);
    for(const property of ['matrix','translation','rotation','scale'])assert.ok(!(property in n),[n.name,property].join(' '));
  }
  assert.equal(staticIDs.size,gltf.meshes.length);
  assert.ok(gltf.animations.every(clip=>clip.channels.every(c=>!staticIDs.has(c.target.node))));
});

test('F11 transports exact independent Tiger slit/fold morphs and six actor idle layers',()=>{
  const eyes=gltf.nodes.filter(n=>/^TIGER_EYE_[LR]_(SLIT|UPPER|LOWER)$/.test(n.name));
  assert.equal(eyes.length,6);
  for(const n of eyes)assert.ok(gltf.meshes[n.mesh].primitives.every(p=>p.targets.length===1&&p.targets[0].POSITION!=null),n.name);
  assert.deepEqual(motion.eyes.Blink[7],[1,1]);
  assert.deepEqual(motion.eyes.Wink_L[7],[1,0]);
  assert.deepEqual(motion.eyes.Wink_R[7],[0,1]);
  assert.equal(Object.keys(motion.idles).length,6);
  assert.equal(new Set(Object.entries(motion.idles).filter(([n])=>n.endsWith('BODY_IDLE')).map(([,v])=>v.offset)).size,3);
  assert.equal(motion.idles.TIGER_BODY_IDLE.weights[140],.22);
  assert.equal(motion.idles.TIGER_BODY_IDLE.weights[159],1);
});
