import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const glb=fs.readFileSync(new URL('../src/vnext/assets/palimpsest-f02-challenger.glb',import.meta.url));
const binaryJ=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)));
const model=await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
const mixer=new THREE.AnimationMixer(model.scene);
const action=mixer.clipAction(model.animations[0]).setLoop(THREE.LoopOnce,1);
action.play();action.paused=true;
const node=name=>model.scene.getObjectByName(name);
const frames=[1,39,65,110];
function pose(frame){
  action.time=(frame-1)/24;mixer.update(0);model.scene.updateMatrixWorld(true);
}
test('F02 clean binary retains authored stage without the original Geode gate, private words or shared book',()=>{
  const names=binaryJ.nodes.map(n=>n.name??'');
  assert.ok(names.some(n=>n==='Zentrum landmark plaque'));
  assert.equal(names.filter(n=>n.startsWith('Black die-cut spiral strip')).length,4);
  assert.equal(names.filter(n=>n.startsWith('Spiral ribbon bond foot')).length,20);
  assert.ok(!names.some(n=>/testimony|inside|NiAlBu|Geode|Desk|Black book board|Black paper pull tab/i.test(n)));
  assert.equal(binaryJ.images,undefined);
  assert.equal(binaryJ.cameras,undefined);
  assert.equal(binaryJ.extras,undefined);
  assert.equal(binaryJ.animations[0].name,'F02_ORIGINAL_BLENDER_FOLDS');
  assert.equal(model.animations[0].tracks.length,12);
});
test('F02 exact staged non-coplanar plates and their morphing physical supports',()=>{
  for (const [stage,frame] of frames.entries()){
    pose(frame);
    const heights=[];
    for (const [i,k] of [...'ABC'].entries()){
      const hinge=node('F02_HINGE_'+k);
      const leaf=hinge.children.find(o=>o.name.startsWith('Dyed-through'));
      const bbox=new THREE.Box3().setFromObject(leaf);
      const rise=bbox.max.y-bbox.min.y;
      heights.push(rise);
      assert.equal(node('F02_STELLAR_'+k).scale.x,i<stage?1:0);
      assert.ok(i<stage ? rise>.7 : (rise>.03&&rise<.06),[k,frame,rise]);
      assert.ok(bbox.min.y>.20, [k,frame,bbox.min.y]); // no mirrored fold under the leaves
    }
    if(stage===3) assert.ok(heights[2]>heights[1]&&heights[1]>heights[0]);
    for(let i=0;i<6;i++){
      const x=node('F02_GUSSET_'+i);
      assert.ok(x.morphTargetInfluences.length>=7);
      assert.equal(x.morphTargetInfluences.reduce((a,b)=>a+b,0),Math.floor(i/2)<stage?1:0);
    }
  }
});
