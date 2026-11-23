import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nextExpansionFrame } from '../src/vnext/proof/f04CandidateStage.ts';

test('F04 expansion advances only while B is on, reaches a finite frame, and can hold at any partial stage',()=>{
  const partial=nextExpansionFrame(10,true,.05,false);
  assert.ok(partial>10&&partial<12);
  assert.equal(nextExpansionFrame(partial,false,.2,false),partial);
  assert.equal(nextExpansionFrame(partial,false,.2,true),partial);
  assert.equal(nextExpansionFrame(partial,true,.02,true),38);
  assert.equal(nextExpansionFrame(38,true,.1,false),38);
  assert.equal(nextExpansionFrame(38,false,.1,true),38);
});

test('Blender export has real tripartite geometry, no Codec, and five identical authored route/echo schedules',()=>{
  const bytes=readFileSync(new URL('../src/vnext/proof/assets/palimpsest-f04.glb',import.meta.url));
  assert.equal(bytes.readUInt32LE(0),0x46546c67);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.ok(bytes.length<2*1024*1024);
  const jsonLength=bytes.readUInt32LE(12), binStart=28+jsonLength;
  const json=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
  assert.match(json.asset.generator,/Blender/);
  assert.ok(json.meshes.length>100,'authored book, scene geometry and reliefs');
  assert.doesNotMatch(JSON.stringify(json),/Codec|He murdered her\./i);
  assert.ok(!json.cameras?.length&&!json.extensionsUsed?.includes('KHR_lights_punctual'));
  assert.ok(!json.buffers.some(b=>b.uri));
  const nodes=json.nodes.map(n=>n.name);
  assert.deepEqual(nodes.filter(n=>/^TouchTab_[ABC]$/.test(n)),['TouchTab_A','TouchTab_B','TouchTab_C']);
  const clips=new Map(json.animations.map(a=>[a.name,a]));
  assert.equal(clips.size,20);
  assert.equal(clips.get('A__ColonyCardAndLift').channels.length,2);
  for(let n=1;n<=6;n++)assert.ok(clips.has('C__Leaf0'+n));
  function scale(name){
    const clip=clips.get(name),target=clip.channels[0].target;
    assert.equal(target.path,'scale');
    assert.equal(nodes[target.node],name);
    const a=json.accessors[clip.samplers[0].output],r=json.bufferViews[a.bufferView];
    assert.deepEqual([a.count,a.type,a.componentType],[66,'VEC3',5126]);
    const off=binStart+(r.byteOffset??0)+(a.byteOffset??0);
    return Array.from({length:a.count},(_,i)=>bytes.readFloatLE(off+12*i));
  }
  let previous=0;
  for(let i=1;i<=5;i++){
    const route=scale('B__Lamp0'+i),echo=scale('B__Echo0'+i);
    assert.deepEqual(route,echo);
    assert.ok(route[0]<.004&&route.at(-1)===1);
    assert.ok(route.every((v,i)=>v>=(route[i-1]??0)));
    const full=route.findIndex(v=>v>.9);
    assert.ok(full>previous&&full<38);
    previous=full;
  }
});
