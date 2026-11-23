import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const data=readFileSync(new URL('../src/vnext/proof/assets/palimpsest-f06.glb',import.meta.url));
const model=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString('utf8'));
const binaryOffset=20+data.readUInt32LE(12)+8;
function track(clip,name,kind){
  const c=model.animations.find(a=>a.name===clip);
  return c?.channels.find(ch=>model.nodes[ch.target.node].name===name&&ch.target.path===kind);
}
function rows(clip,channel) {
  const sample=model.animations.find(a=>a.name===clip).samplers[channel.sampler];
  const extract=id=>{
    const a=model.accessors[id], bv=model.bufferViews[a.bufferView];
    assert.equal(a.componentType,5126);
    const components={SCALAR:1,VEC3:3,VEC4:4}[a.type];
    const start=binaryOffset+(bv.byteOffset??0)+(a.byteOffset??0);
    return Array.from({length:a.count},(_,i)=>Array.from({length:components},(_,j)=>
      data.readFloatLE(start+i*(bv.byteStride??components*4)+j*4)));
  };
  return [extract(sample.input).flat(),extract(sample.output)];
}

test('actual reviewed F06 GLB carries mechanism geometry and no proof-only specimens',()=>{
  assert.equal(data.toString('ascii',0,4),'glTF');
  assert.equal(model.asset.version,'2.0');
  assert.ok(data.length<1_400_000);
  assert.equal(model.cameras,undefined);
  assert.equal(model.extensions?.KHR_lights_punctual,undefined);
  for(const name of ['C__BlankCasualtyCell','TouchTab_A_Wheel','TouchTab_B_Cradle','TouchTab_C_Pull']){
    assert.ok(Number.isInteger(model.nodes.find(n=>n.name===name)?.mesh),name);
  }
  for(const name of ['A__LiveEraSlipAnchor','C__LiveEraInkAnchor','B__SourceSpecimenSeat','B__LiveSpecimenNameAnchor']){
    assert.ok(model.nodes.some(n=>n.name===name),name);
  }
  assert.ok(!model.nodes.some(n=>n.name.startsWith('F06 runtime authored specimen')));
  assert.ok(track('A__ChronologyWheel','A__ChronologyWheel','rotation'));
  assert.ok(track('B__SpecimenCradle','B__SpecimenCradle','rotation'));
});

test('all six candidate hinge transforms are baked and preserve paper linkage at arrival, intermediate motion and open state',()=>{
  function interpolate(clip,kind,frame,initial){
    const channel=track(clip,clip,kind);
    if(!channel)return initial;
    const [time,values]=rows(clip,channel);
    const t=(frame-1)/18;
    const i=time.reduce((ii,v,j)=>Math.abs(v-t)<Math.abs(time[ii]-t)?j:ii,0);
    assert.ok(Math.abs(time[i]-t)<.001,clip+' '+kind);
    return values[i];
  }
  for(const frame of [69,86,111]){
    const joints=[];
    for(let i=1;i<=6;i++){
      const name='C__LedgerLeaf0'+i;
      const n=model.nodes.find(n=>n.name===name);
      const rotation=interpolate(name,'rotation',frame,n.rotation);
      const location=interpolate(name,'translation',frame,n.translation);
      const [x,, ,w]=rotation;
      const theta=2*Math.atan2(x,w);
      joints.push({location,theta});
    }
    for(let i=0;i<5;i++){
      const a=joints[i],b=joints[i+1];
      assert.ok(Math.abs(a.location[1]-Math.sin(a.theta)*.47-b.location[1])<.001);
      assert.ok(Math.abs(a.location[2]+Math.cos(a.theta)*.47-b.location[2])<.001);
    }
  }
});
