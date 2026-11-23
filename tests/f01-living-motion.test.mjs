import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bindF01Mechanisms} from '../src/vnext/challengerF01.ts';

const bytes=fs.readFileSync(new URL('../src/vnext/assets/palimpsest-f01-challenger.glb',import.meta.url));
const fixture=()=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const names=['tiger','wordstreamer','nialbu'];

test('Each editorial figure has a fresh idle only after its station stands exposed',async()=>{
  const {scene,animations}=await fixture();
  const m=bindF01Mechanisms(scene,animations);
  const refs=names.map(n=>scene.getObjectByName('palimpsest-original-'+n));
  const mount=refs.map(n=>n.parent);
  const positions=refs.map(n=>n.position.clone());
  const maxMotion=[0,0,0];const firstSeen=[false,false,false];
  let s=m.update(0,.05,false);
  for(let frame=0;frame<125;frame++){
    const before=s.stage.stations;
    assert.ok(s.stage.attention, "stage supplies per-figure exposure");
    s=m.update(1,.05,false);
    s.stage.stations.forEach((station,i)=>{
      const {visibleAge,yaw}=s.stage.attention[i];
      if(station<1){assert.equal(s.stage.idleTimes[i],0);assert.equal(visibleAge,0);assert.equal(yaw,0);}
      else if(before[i]<1){
        firstSeen[i]=true;
        assert.equal(s.stage.idleTimes[i],0);
        assert.equal(visibleAge,0);
      }else maxMotion[i]=Math.max(maxMotion[i],Math.abs(yaw));
    });
    assert.ok(refs.every((n,i)=>n.parent===mount[i]&&n.position.equals(positions[i])));
  }
  assert.ok(firstSeen.every(Boolean));
  assert.ok(maxMotion.every(y=>y>.075),'all three visibly acknowledge another figure');
  assert.ok(s.stage.idleTimes.every(t=>t>0));
  m.dispose();
});

test('Only existing facial ink is narrowed; Tiger mouth reads as dark occlusion and keeps original solid eye geometry',async()=>{
  const {scene,animations}=await fixture();
  const m=bindF01Mechanisms(scene,animations);
  const eyes=['L','R'].map(side=>scene.getObjectByName('F01_Tiger_|_existing_cyan_slit_'+side));
  const band=scene.getObjectByName('Mesh199');
  const plate=scene.getObjectByName('NiAlBu_|_head_plate_pitch');
  const originalBand=band.scale.y;
  const jaw=scene.getObjectByName('Mesh131');
  const mouth=scene.getObjectByName('F01 Tiger cyan inner mouth ink');
  assert.equal(scene.getObjectByName('Mesh133').material,jaw.material);
  assert.equal(scene.getObjectByName('Mesh136').material,jaw.material);
  assert.ok(mouth,'continuous color behind the dark existing cuts');
  assert.ok(eyes.every(e=>e?.material===mouth.material),'original solid cyan eye stock');
  scene.updateMatrixWorld(true);
  const face=jaw.parent;
  const ray=new T.Raycaster();
  const direction=new T.Vector3(0,0,-1).applyQuaternion(face.getWorldQuaternion(new T.Quaternion()));
  const projected=Array.from({length:31},(_,i)=>{
    ray.set(face.localToWorld(new T.Vector3((i-15)*.0032,-.043,.29)),direction);
    const lead=ray.intersectObjects(face.children).at(0)?.object;
    return lead===mouth?'C':lead?.name==='Mesh133'||lead?.name==='Mesh136'?'D':' ';
  }).join('');
  assert.match(projected,/C+D+C+/,'at least one dark mineral cut visibly interrupts the cyan behind it');
  const start=plate.quaternion.clone();
  const min=[1,1,1];let plateMotion=0;
  m.update(1,0,false);
  for(let i=0;i<190;i++){
    m.update(1,.037,false);
    [eyes[0].scale.y,eyes[1].scale.y,band.scale.y/originalBand].forEach((v,j)=>min[j]=Math.min(min[j],v));
    plateMotion=Math.max(plateMotion,start.angleTo(plate.quaternion));
  }
  assert.ok(min.every(v=>v<.4));
  assert.ok(plateMotion>.02,'existing NiAlBu head plate responds without added anatomy');
  const s=m.update(1,.08,true);
  assert.ok(s.stage.attention.every(x=>x.visibleAge===0&&x.yaw===0));
  assert.deepEqual(s.stage.idleTimes,[0,0,0]);
  assert.equal(band.scale.y,originalBand);
  const unhidden=m.update(1,.08,false,false);
  assert.ok(unhidden.stage.attention.every(x=>x.visibleAge===0));
  assert.ok(m.update(1,.08,false).stage.attention.every(x=>x.visibleAge===0),'no hidden time carried into first open frame');
  m.dispose();
});
