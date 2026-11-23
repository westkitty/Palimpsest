import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {f02DepthRead,makeF02DepthField} from '../src/vnext/f02DepthField.ts';

test('F02 separates physical birth from both white stock and the ink-bound stars',()=>{
 assert.deepEqual(f02DepthRead(0,1),{lift:0,wake:0,depthBeat:'sealed'});
 assert.equal(f02DepthRead(.31,39).lift,0);
 assert.equal(f02DepthRead(.66,65).lift,0);
 assert.equal(f02DepthRead(1,69).lift,0,'soaked stock cannot race ahead of the physical strips');
 assert.equal(f02DepthRead(.66,110).lift,0,'raised strips alone cannot birth the scene before ink');
 assert.equal(f02DepthRead(.84,90).depthBeat,'lifting-veils');
 assert.deepEqual(f02DepthRead(1,110),{lift:1,wake:1,depthBeat:'deep-field'});
});
test('F02 added veils are world-space geometry, with stable reduced endpoint and no pre-reveal drawing',()=>{
 const stage=new THREE.Group();const field=makeF02DepthField(stage);
 const depth=stage.children[0];
 assert.equal(depth.visible,false);
 field.update(.66,65,0,true);assert.equal(depth.visible,false);
 const veils=depth.children.filter(o=>o instanceof THREE.Mesh);
 assert.equal(veils.length,12);
 for(const veil of veils){
   const p=veil.geometry.getAttribute('position');assert.ok(p.count>400);
   let hi=-99,lo=99;
   for(let i=0;i<p.count;i++){hi=Math.max(hi,p.getY(i));lo=Math.min(lo,p.getY(i));}
   assert.ok(hi-lo>.75,'physical curved stock at varied heights, not a flat billboard');
   assert.equal(veil.material.depthWrite,false);assert.equal(veil.material.depthTest,true);
 }
 field.update(1,110,10,true);assert.equal(depth.visible,true);
 assert.equal(veils[0].material.uniforms.clock.value,0);
 field.update(1,110,.04,false);assert.equal(veils[0].material.uniforms.clock.value,.04);
 field.dispose();assert.equal(stage.children.length,0);
});
