import * as THREE from 'three';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeF05Offcut,offcutRead } from '../src/vnext/proof/f05Offcut.ts';

test('F05 single rare ~second episode enters and exits heat, reduced motion goes to still scar',()=>{
  assert.deepEqual(offcutRead(false,1,false),{phase:'paper',elapsed:0,heat:0,curl:0,fall:0,gone:false});
  assert.equal(offcutRead(true,-1,false).phase,'paper');
  assert.equal(offcutRead(true,.61,false).phase,'flame');
  assert.ok(offcutRead(true,.61,false).heat>.8);
  const after=offcutRead(true,1.04,false);
  assert.deepEqual(after,{phase:'aftermath',elapsed:1.04,heat:0,curl:1,fall:1,gone:true});
  assert.deepEqual(offcutRead(true,0,true),after);
  const untouched=makeF05Offcut(new THREE.Group(),.8);
  for(let i=0;i<30;i++)assert.equal(untouched.update(true,.051,false).phase,'paper');
  const lucky=makeF05Offcut(new THREE.Group(),.01);
  assert.equal(lucky.update(false,.05,false).phase,'paper');
  assert.equal(lucky.update(true,.05,false).phase,'flame');
  for(let i=0;i<40;i++)lucky.update(i<8,.051,false);
  assert.deepEqual(lucky.update(true,0,false),after);
});

test('F05 a real corner falls off; the hole does not fake it with paint or opacity',()=>{
  const made=makeF05Offcut(new THREE.Group(),0);
  const root=made.root;
  const ray=new THREE.Raycaster(new THREE.Vector3(3.47+.197,2,.267+.076),new THREE.Vector3(0,-1,0));
  root.updateMatrixWorld(true);
  const corner=root.getObjectByName('The cut corner that can curl and drop');
  const body=root.getObjectByName('Offcut body with actual diagonally cut corner');
  assert.ok(ray.intersectObject(corner).length>0);
  assert.equal(ray.intersectObject(body).length,0);
  const light=root.getObjectByName('One brief warm pool on neighbouring paper and machinery');
  made.update(true,0,false);
  for(let i=0;i<6;i++)made.update(true,.05,false);
  assert.ok(light.intensity>1.18);
  for(let i=0;i<20;i++)made.update(true,.05,false);
  root.updateMatrixWorld(true);
  assert.equal(light.intensity,0);
  assert.equal(ray.intersectObjects([corner,body]).length,0);
  assert.equal(root.getObjectByName('Exposed char on the diagonal remaining edge').visible,true);
  assert.ok(corner.position.y<-.04);
});
