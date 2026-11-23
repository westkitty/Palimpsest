import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {cutF06UnknownLossCells,attachF06AttritionTerrain,resetF06TerrainWear} from '../src/vnext/proof/f06AttritionLayers.ts';

test('each blank account window is a true through-cut over lower unmarked paper',()=>{
  const leaves=Array.from({length:6},()=>{
    const leaf=new THREE.Group();
    const face=new THREE.Mesh(new THREE.BoxGeometry(1.4,.027,.47),new THREE.MeshStandardMaterial({side:THREE.DoubleSide}));
    face.name='Die-cut leaf of original Blender ledger';
    leaf.add(face);
    return leaf;
  });
  assert.equal(cutF06UnknownLossCells(leaves),4);
  for(const leaf of leaves.slice(1,5)){
    const face=leaf.getObjectByName('F06 die-cut blank archival aperture');
    const backing=leaf.getObjectByName('Underlying blank intact account pulp');
    const scan=new THREE.Raycaster(new THREE.Vector3(0,1,.312),new THREE.Vector3(0,-1,0));
    leaf.updateMatrixWorld(true);
    assert.equal(scan.intersectObject(face).length,0);
    assert.ok(scan.intersectObject(backing).some(hit=>hit.point.y<-.02));
    scan.ray.origin.x=.47;
    assert.ok(scan.intersectObject(face).length>0);
  }
});
test('wear is monotone on one campaign relief and restored on a later mount',()=>{
  resetF06TerrainWear();
  const world=new THREE.Group();
  const terrain=attachF06AttritionTerrain(world);
  assert.equal(world.children.length,1);
  assert.equal(terrain.update(0,0,true).wearMask,1);
  assert.equal(terrain.update(1,.06,false).paperRipple>.8,true);
  assert.equal(terrain.update(1,1,false).paperRipple,0);
  assert.equal(terrain.update(2,0,true).routeLayerCount,3);
  assert.equal(terrain.update(3,0,true).routeLayerCount,4);
  assert.equal(terrain.update(0,0,true).wearMask,15);
  const again=attachF06AttritionTerrain(new THREE.Group());
  assert.equal(again.update(0,0,true).wearMask,15);
  resetF06TerrainWear();
  assert.equal(attachF06AttritionTerrain(new THREE.Group()).update(0,0,true).wearMask,1);
});

test('all four selections physically age the same coast, attached crossing and climate stock',()=>{
  resetF06TerrainWear();
  const world=new THREE.Group(), terrain=attachF06AttritionTerrain(world);
  const geography=world.children[0];
  const ribs=geography.children.filter(o=>o.name.includes('same shoreline')||o.name.includes('layered stock rib'));
  const left=world.getObjectByName('Tethered road fold -1');
  const right=world.getObjectByName('Tethered road fold 1');
  const climate=world.getObjectByName('F06 climate stress · hinged archival paper band');
  assert.equal(ribs.length,8);
  const first=terrain.update(0,0,true);
  const start=ribs.map(o=>o.position.toArray());
  const ages=[first,...[1,2,3].map(i=>terrain.update(i,0,true))];
  assert.ok(ages.every((a,i)=>!i||(a.terrainStress>ages[i-1].terrainStress&&a.climateCurl>ages[i-1].climateCurl)));
  assert.equal(ages[3].bridgeFailure,1);
  assert.ok(left.rotation.z<-.60&&right.position.y<-.09&&climate.rotation.x>.90);
  assert.ok(ribs.every((rib,i)=>rib.position.toArray().some((n,j)=>n!==start[i][j])));
  assert.deepEqual(geography.children.filter(o=>o.name.includes('layered stock rib')),ribs);
  const rewind=terrain.update(0,0,true);
  assert.equal(rewind.wearMask,15);
  assert.deepEqual(ribs.map(o=>o.position.toArray()),start);
  resetF06TerrainWear();
});

test('crossing weather has four distinct local readings and a steady reduced-motion pose',async()=>{
  const {f06CrossingAir}=await import('../src/vnext/proof/f06AttritionLayers.ts');
  const modes=[0,1,2,3].map(i=>f06CrossingAir(i,.72,false,0));
  assert.equal(new Set(modes.map(p=>p.kind)).size,4);
  for(let i=0;i<4;i++){
    assert.notEqual(f06CrossingAir(i,.36,false,1).twist,f06CrossingAir(i,1.22,false,1).twist);
    assert.deepEqual(f06CrossingAir(i,0,true,1),f06CrossingAir(i,20,true,1));
  }
});
test('the final-era rupture uses an attached physical flap and rewinds only to its persistent scar',()=>{
  resetF06TerrainWear();
  const world=new THREE.Group(), terrain=attachF06AttritionTerrain(world);
  const flap=world.getObjectByName('F06 torn stock still bonded at outer right crease');
  const parent=flap.parent;
  for(let i=0;i<3;i++){
    const s=terrain.update(i,0,true);
    assert.equal(s.tearOpen,0);assert.equal(s.crossingTorn,false);
  }
  const late=terrain.update(3,0,true);
  assert.equal(late.crossingTorn,true);assert.equal(late.tearOpen,1);
  assert.ok(flap.rotation.z<-1);assert.equal(flap.parent,parent);
  assert.ok(flap.children.filter(n=>n.name.startsWith('One exposed pulp fiber')).every(n=>n.visible));
  const early=terrain.update(0,0,true);
  assert.equal(early.tearOpen,.43);assert.equal(early.crossingTorn,true);
  assert.equal(early.weather,'sheer-air');
  assert.ok(flap.rotation.z<-.42&&flap.rotation.z>-.50);
  assert.equal(attachF06AttritionTerrain(new THREE.Group()).update(0,0,true).crossingTorn,true);
  resetF06TerrainWear();
  assert.equal(attachF06AttritionTerrain(new THREE.Group()).update(0,0,true).crossingTorn,false);
});
