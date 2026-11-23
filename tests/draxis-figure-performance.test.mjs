import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildDraxisModel} from '../src/engine/drakken/DraxisModels.ts';
import {bindDraxisFigurePerformance} from '../src/vnext/draxisFigurePerformance.ts';

// These tests inspect the real authored geometry. Ink rasterization is immaterial.
const brush=new Proxy({}, {get:(obj,k)=>obj[k]??(()=>({addColorStop(){}}))});
globalThis.document={createElement:()=>({getContext:()=>brush})};
const made=id=>buildDraxisModel(id,new THREE.Texture());
const sample=(p,dt=.04)=>Array.from({length:160},()=>p.update(dt,true,false));
test('the F06 authored Obsidian Gul moves its existing head without sliding the stand or adding eyes',()=>{
  const rig=made('004'), root=rig.group;
  const originalMeshes=[];root.traverse(o=>{if(o.isMesh)originalMeshes.push(o);});
  const p=bindDraxisFigurePerformance(rig);
  const newMeshes=[];root.traverse(o=>{if(o.isMesh)newMeshes.push(o);});
  assert.deepEqual(new Set(originalMeshes),new Set(newMeshes));
  const basePos=root.position.toArray();
  const rest=p.update(.10,false,false);
  assert.equal(rest.age,0);
  assert.equal(rest.optical,null);
  assert.deepEqual(p.update(.10,true,false),rest,'first exposure starts at authored rest');
  const beats=sample(p);
  assert.ok(beats.some(f=>Math.abs(f.yaw)>.025&&f.optical===null));
  assert.deepEqual(root.position.toArray(),basePos);
  assert.deepEqual(p.update(.10,true,true),rest,'reduced motion restores the authored detent');
});
test('the F10 source figures each have a distinct response; only actual optics narrow',()=>{
  const ids=['037','055','044'];
  const groups=ids.map(made).map(rig=>[rig,bindDraxisFigurePerformance(rig)]);
  const output=groups.map(([rig,p])=>{
    const state=sample(p);
    const head=rig.group.getObjectByName('Living DRAXIS grounded head hinge '+rig.id);
    assert.ok(head?.children.length);
    assert.ok(state.some(frame=>Math.abs(frame.pitch)>.025));
    const parked=p.update(.09,false,false);
    assert.equal(parked.age,0);
    assert.equal(parked.pitch,0);
    assert.equal(parked.yaw,0);
    assert.equal(p.update(.09,true,false).age,0,'no unseen pose time crosses the receiver lip');
    return state;
  });
  assert.notDeepEqual(output[0].map(x=>x.yaw),output[1].map(x=>x.yaw));
  assert.ok(output[0].some(x=>x.optical<.59),'Ironcant single existing visor compresses');
  assert.ok(output[1].some(x=>x.optical<.35),'Foldhowl existing pair blinks');
  assert.ok(output[2].every(x=>x.optical===null),'Gorevault has no authored eyes');
});
