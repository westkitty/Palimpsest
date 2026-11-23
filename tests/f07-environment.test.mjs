import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {createF07Environment,f07EnvironmentalRead,f07FieldHeight,f07Route} from '../src/vnext/proof/f07Environment.ts';

test('F07 overlays do not lift the stock or the cost record in place of the native vellum',()=>{
  assert.deepEqual(f07EnvironmentalRead(0,0),{open:0,cost:0,shadow:0});
  const opening=f07EnvironmentalRead(-.34,0);
  assert.ok(opening.open>.4&&opening.open<.6&&opening.shadow>0&&opening.shadow<1);
  assert.deepEqual(f07EnvironmentalRead(-.76,.28),{open:1,cost:1,shadow:1});
  assert.deepEqual(f07EnvironmentalRead(0,.28),{open:0,cost:1,shadow:0});
});
test('F07 printed route and cost register to a single physical relief underneath the exact GLB',()=>{
  const scene=new THREE.Group(),env=createF07Environment(scene);
  const objects=scene.children[0].children;
  assert.equal(f07Route.length,2);
  assert.equal(objects.filter(n=>n.name.startsWith('Vellum vector')).length,2);
  assert.equal(objects.filter(n=>n.name.startsWith('Interrupted cost')).length,2);
  const field=objects.find(n=>n.name.startsWith('Low folded relief'));
  const attr=field.geometry.getAttribute('position');
  for(let i=0;i<attr.count;i++){
    assert.ok(Math.abs(attr.getY(i)-f07FieldHeight(attr.getX(i),attr.getZ(i)))<.0001);
    assert.ok(attr.getY(i)<.38,'under the actual closing vellum, local y=.398');
  }
  assert.ok(f07FieldHeight(-.62,-.28)<.31,'leave original ruby marker visibly seated');
  assert.deepEqual(env.update(-.76,.28),{open:1,cost:1,shadow:1});
  env.dispose();assert.equal(scene.children.length,0);
});
