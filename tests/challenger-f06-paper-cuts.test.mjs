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
