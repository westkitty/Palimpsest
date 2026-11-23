import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createF11PaperWildlife,F11_MOTH_FROND,f11WildlifeBeats} from '../src/vnext/f11PaperWildlife.ts';
const b=gunzipSync(readFileSync(new URL('../src/vnext/assets/palimpsest-f11-challenger.glb.gz',import.meta.url)));
const {scene,animations}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
test('wildlife is absent on bare stock and neither reaction takes attention from the final actors',()=>{
 for(const f of [1,44,61,71,82,88]){
   assert.equal(f11WildlifeBeats(f).moth,'absent');assert.equal(f11WildlifeBeats(f).bird,'absent');
 }
 assert.equal(f11WildlifeBeats(92).moth,'flying');
 assert.equal(f11WildlifeBeats(94).bird,'approach');
 assert.ok(f11WildlifeBeats(101).bow>.95);
 assert.deepEqual([f11WildlifeBeats(113).moth,f11WildlifeBeats(113).bird,f11WildlifeBeats(113).bow],['perched','still',0]);
});
test('six-legged moth lands on actual paper geometry and tracks that frond when it moves',()=>{
 const field=new T.Group();field.add(scene);
 const mixer=new T.AnimationMixer(scene);
 for(const c of animations){
   if(!/^(?:PLANT_26|STEM_26|FROND_26_3)$/.test(c.name))continue;
   const a=mixer.clipAction(c).play();a.paused=true;a.time=105/24;
 }
 mixer.update(0);
 const frond=scene.getObjectByName(F11_MOTH_FROND),wild=createF11PaperWildlife(field,frond);
 const moth=field.getObjectByName('F11 paper moth, lands on a borrowed leaf face');
 const bird=field.getObjectByName('F11 compact paper ground bird');
 wild.update(80,false);assert.ok(!moth.visible&&!bird.visible);
 wild.update(93,false);assert.ok(moth.visible&&bird.visible);
 const a=wild.update(105,false);assert.deepEqual([a.moth,a.perch,a.boundToFrond],['perched',F11_MOTH_FROND,true]);
 const p=moth.position.clone();
 frond.position.x+=.250;wild.update(108,false);
 assert.ok(moth.position.distanceTo(p)>.150,'moth does not float independently of the plant');
 assert.ok(wild.update(110.39,false).birdBlink>.95);
 assert.deepEqual([wild.update(125,false).birdBlink,wild.update(125,false).birdIdle],[0,0],'Tiger’s beat is left still');
 let restingHasBlink=false,restingHasIdle=false;
 for(let t=0;t<8;t+=.03){
   const state=wild.update(180,false,t);
   restingHasBlink ||= state.birdBlink>.6;
   restingHasIdle ||= Math.abs(state.birdIdle)>.05;
 }
 assert.ok(restingHasBlink&&restingHasIdle);
 assert.deepEqual([wild.update(180,true,8).birdBlink,wild.update(180,true,9).birdIdle],[0,0]);
 wild.update(170,true);assert.ok(moth.visible&&bird.visible);
 wild.dispose();assert.ok(!field.getObjectByName(moth.name));
});
