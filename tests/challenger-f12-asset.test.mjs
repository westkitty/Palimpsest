import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const f=(s)=>new URL('../'+s,import.meta.url);
const data=readFileSync(f('src/vnext/proof/assets/palimpsest-f12.glb'));
const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString('utf8'));
const node=(name)=>json.nodes.find(n=>n.name===name);
function finalSamples(name) {
  const clip=json.animations.find(a=>a.name===name);
  assert.equal(clip.channels.length,1);
  const ch=clip.channels[0];
  const sampler=clip.samplers[ch.sampler];
  const val=json.accessors[sampler.output];
  const buffer=json.bufferViews[val.bufferView];
  const count={VEC3:3,VEC4:4}[val.type];
  const start=28+data.readUInt32LE(12)+(val.byteOffset??0)+(buffer.byteOffset??0);
  const read=(i)=>Array.from({length:count},(_,j)=>data.readFloatLE(start+i*(buffer.byteStride??count*4)+j*4));
  return {type:ch.target.path,name:json.nodes[ch.target.node].name,start:read(0),end:read(val.count-1)};
}

test('F12 source asset keeps six cut separate horizons, two cards and a public physical archive',()=>{
  assert.equal(json.asset.version,'2.0');
  assert.ok(json.asset.generator.includes('Blender'));
  assert.equal(json.cameras,undefined);
  assert.equal(json.extensions?.KHR_lights_punctual,undefined);
  const leaves=json.nodes.filter(n=>/^F12__SignedNotJoinedLeaf/.test(n.name));
  assert.ok(leaves.length===6&&leaves.every(n=>n.children.length===2));
  assert.equal(leaves.filter(n=>n.translation[0]<=-2.09).length,3);
  assert.equal(leaves.filter(n=>n.translation[0]>=2.09).length,3);
  for(const n of ['TouchTab_A_I','TouchTab_A_II','TouchTab_B','TouchTab_C','TouchSurface_C','C__PublicSyrinRecord','C__FixedOriginalPin']){
    assert.ok(Number.isInteger(node(n)?.mesh),n);
  }
  assert.doesNotMatch(JSON.stringify(json),/\bkail\b|surviving initiate|closing (?:inset|slogan|imprint)|your fate is in our hands/i);
});

test('actual separate plates move apart; original 105 degree crease rotates without moving its fixed hinge',()=>{
  const l=finalSamples('A__ClaimI'),r=finalSamples('A__ClaimII'),c=finalSamples('C__ArchivalCrease');
  assert.equal(l.type,'translation');assert.equal(r.type,'translation');
  assert.equal(c.type,'rotation');assert.equal(c.name,'C__ArchivalCrease');
  assert.ok(l.end[0]<-.21&&r.end[0]>.21);
  assert.ok(Math.abs(c.start[0])<.00001);
  assert.ok(Math.abs(2*Math.atan2(c.end[0],c.end[3])-(-105*Math.PI/180))<.0001);
  assert.ok(!json.animations.some(a=>a.channels.some(ch=>json.nodes[ch.target.node].name==='C__FixedOriginalPin')));
});
