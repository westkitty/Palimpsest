import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

test('F07 ships independent Blender plan, cost, and support transforms and real translucent vellum',()=>{
  const bytes=readFileSync(new URL('../src/vnext/proof/assets/palimpsest-f07.glb',import.meta.url));
  assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
  const jsonSize=bytes.readUInt32LE(12);
  const j=JSON.parse(bytes.subarray(20,20+jsonSize).toString());
  assert.match(j.asset.generator,/Blender/);assert.ok(j.meshes.length>=200&&bytes.length<2*1024*1024);
  assert.doesNotMatch(JSON.stringify(j),/he murdered her|inspection only|relief worker|anonymous recipient/i);
  assert.ok(!j.cameras?.length&&!j.extensionsUsed?.includes('KHR_lights_punctual'));
  const vellum=j.materials.find(m=>m.name==='F07 visible warm vellum substrate');
  assert.equal(vellum.alphaMode,'BLEND');assert.ok(vellum.doubleSided&&vellum.pbrMetallicRoughness.baseColorFactor[3]>.4&&vellum.pbrMetallicRoughness.baseColorFactor[3]<.5);
  const frames=new Map(j.animations.map(a=>[a.name,a]));
  assert.deepEqual([...frames.keys()].sort(),['A__PlanHinge','B__OutcomeRise','C__SupplyArm','C__SupplyGear']);
  const byName=new Map(j.nodes.map((node,i)=>[node.name,i]));
  assert.ok(byName.has('F07_PlanVellum')&&j.nodes.some(n=>n.name==='Exact source overlay scale qualifier'));
  assert.equal([...byName.keys()].filter(n=>/^TouchTab_[ABC]$/.test(n)).length,3);
  function frame(name,k){
    const clip=frames.get(name),c=clip.channels[0];assert.equal(clip.channels.length,1);
    assert.equal(c.target.node,byName.get(name));
    const a=j.accessors[clip.samplers[c.sampler].output],b=j.bufferViews[a.bufferView];
    assert.equal(a.count,66);assert.equal(a.componentType,5126);
    const count=a.type==='VEC4'?4:3;
    const offset=28+jsonSize+(b.byteOffset??0)+(a.byteOffset??0)+(k-1)*count*4;
    return Array.from({length:count},(_,i)=>bytes.readFloatLE(offset+i*4));
  }
  const angle=(q,i)=>2*Math.atan2(q[i],q[3]);
  const almost=(a,b)=>assert.ok(Math.abs(a-b)<.002,`expected ${b}, got ${a}`);
  almost(angle(frame('A__PlanHinge',1),0),0);almost(angle(frame('A__PlanHinge',35),0),-.76);
  almost(angle(frame('A__PlanHinge',66),0),0);
  almost((frame('B__OutcomeRise',33)[1]-frame('B__OutcomeRise',1)[1])*1.51,.28);
  almost(angle(frame('C__SupplyArm',33),1),-.45);almost(angle(frame('C__SupplyGear',33),1),-.90);
});
