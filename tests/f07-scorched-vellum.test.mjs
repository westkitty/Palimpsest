import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Mesh,DoubleSide,MeshBasicMaterial,Raycaster,Vector3} from 'three';
import {f07ScorchCue,makeBurntVellum} from '../src/vnext/proof/f07ScorchedVellum.ts';
test('vellum keeps a physical aperture where the lamp catches the corner',()=>{
  const {geometry}=makeBurntVellum();
  const mesh=new Mesh(geometry,new MeshBasicMaterial({side:DoubleSide}));
  const witness=(x,z)=>new Raycaster(new Vector3(x,1,z),new Vector3(0,-1,0)).intersectObject(mesh).length;
  assert.equal(witness(-1.20,1.39),0);
  assert.ok(witness(-.74,1.16)>0);
  assert.equal(f07ScorchCue(-1,false).cut,false);
  assert.ok(f07ScorchCue(.4,false).flame>.8);
  assert.deepEqual(f07ScorchCue(.92,false),{flame:0,cut:true});
  assert.deepEqual(f07ScorchCue(0,true),{flame:0,cut:true});
});
