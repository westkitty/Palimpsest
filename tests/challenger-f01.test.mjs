import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { f01Mask, nextF01Detent } from '../src/vnext/challengerF01.ts';
import { activateSlot, startFolio } from '../src/vnext/folioLogic.ts';

const states = Array.from({length:8}, (_, mask) => mask);
const expected = states.flatMap(lo => [1,2,4].map(bit=>lo^bit).filter(hi=>hi>lo).map(hi=>['F01_ABS_'+lo+'_'+hi,lo,hi]));
const view = (asset, offset, length) => new DataView(asset.buffer, asset.byteOffset + offset, length);
function glb() {
  const asset = readFileSync(new URL('../src/vnext/assets/palimpsest-f01-challenger.glb', import.meta.url));
  const header=view(asset,0,20);
  assert.equal(header.getUint32(0,true), 0x46546c67);
  assert.equal(header.getUint32(4,true),2);
  assert.equal(header.getUint32(8,true),asset.length);
  assert.equal(header.getUint32(16,true),0x4e4f534a);
  const jsonSize = header.getUint32(12,true);
  const data = JSON.parse(asset.subarray(20,20+jsonSize).toString('utf8'));
  const binHeader=view(asset,20+jsonSize,8);
  assert.equal(binHeader.getUint32(4,true),0x004e4942);
  return {asset,data,binStart:28+jsonSize};
}

test('unchanged F01 slots map to independent A=1, B=2, C=4 and every move selects one authored edge',()=>{
  for (const mask of states) {
    let state=startFolio(0);
    for (const [i,slot] of ['A','B','C'].entries()) if(mask & 1<<i) state=activateSlot(state,slot);
    assert.equal(f01Mask(state.f01),mask);
    for (const target of states) {
      let here=mask;
      for (let i=0;i<3 && here!==target;i++) {
        const next=nextF01Detent(here,target);
        assert.ok(expected.some(([,lo,hi])=>lo===Math.min(here,next) && hi===Math.max(here,next)));
        here=next;
      }
      assert.equal(here,target);
    }
  }
});

test('actual local GLB has 12 authored edges, separate actors, no secret, and agreeing poses at every detent',()=>{
  const {asset,data,binStart}=glb();
  assert.ok(asset.length<8*1024*1024,'do not spend 8 MiB on the opening stage');
  assert.deepEqual((data.animations??[]).filter(a=>a.name.startsWith('F01_ABS_')).map(a=>a.name).sort(),expected.map(e=>e[0]).sort());
  assert.ok((data.animations??[]).some(a=>a.name==='F01_ACTOR_IDLE'&&a.channels.length),'actual Blender actor idle must export');
  assert.ok(data.meshes.length>20,'candidate has actual mesh geometry, not one exported video plane');
  assert.ok(!data.buffers.some(b=>b.uri),'no remote dependencies in binary');
  assert.ok(!data.images?.some(i=>i.uri&&!i.uri.startsWith('data:')));
  assert.doesNotMatch(JSON.stringify(data),/he murdered her\.|INSPECTION ONLY/i);
  assert.ok(!data.cameras?.length,'runtime camera is authoritative');
  assert.ok(!data.extensionsUsed?.includes('KHR_lights_punctual'),'runtime lighting is authoritative');

  const anims=new Map(data.animations.map(a=>[a.name,a]));
  const poses=new Map(Array.from({length:8},(_,i)=>[i,[]]));
  const nodes=new Set();
  const idle=new Set(anims.get('F01_ACTOR_IDLE').channels.map(c=>c.target.node+'_'+c.target.path));
  for (const [name,lo,hi] of expected) {
    const action=anims.get(name);
    const begin=new Map(),end=new Map();
    for (const channel of action.channels) {
      const {node,path}=channel.target;
      const s=action.samplers[channel.sampler];
      const a=data.accessors[s.output],b=data.bufferViews[a.bufferView];
      const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
      assert.ok(components&&a.componentType===5126&&a.count>=2);
      const stride=b.byteStride??components*4;
      const start=binStart+(b.byteOffset??0)+(a.byteOffset??0);
      const v=view(asset,start,(a.count-1)*stride+components*4);
      const mul = s.interpolation==='CUBICSPLINE'?3:1;
      const key=node+'_'+path;
      nodes.add(key);
      const first=mul===3?1:0, last=mul===3?a.count-2:a.count-1;
      begin.set(key,Array.from({length:components},(_,i)=>v.getFloat32(first*stride+i*4,true)));
      end.set(key,Array.from({length:components},(_,i)=>v.getFloat32(last*stride+i*4,true)));
      assert.ok(!idle.has(key),'idle may not write the same target as mechanism clips');
    }
    poses.get(lo).push({name,v:begin});poses.get(hi).push({name,v:end});
  }

  const defaultValue = (key) => {
    const [idx,path]=key.split('_');
    const node=data.nodes[Number(idx)];
    assert.ok(!node.matrix,'a node targeted by animation must use TRS');
    return node[path]??(path==='rotation'?[0,0,0,1]:path==='scale'?[1,1,1]:[0,0,0]);
  };
  for (const [mask, endpointPoses] of poses) {
    assert.equal(endpointPoses.length,3);
    for (const key of nodes) {
      const candidate=endpointPoses[0].v.get(key)??defaultValue(key);
      for (const end of endpointPoses.slice(1)) {
        const value=end.v.get(key)??defaultValue(key);
        const sign=key.endsWith('_rotation')&&candidate.reduce((d,c,i)=>d+c*value[i],0)<0?-1:1;
        assert.ok(candidate.every((c,i)=>Math.abs(c-sign*value[i])<.004),`detent ${mask} mismatch ${key} ${endpointPoses[0].name} vs ${end.name}: ${candidate} vs ${value}`);
      }
    }
  }
});
