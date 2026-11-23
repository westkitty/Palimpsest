import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {makeF03PaperWorkshop} from '../src/vnext/proof/f03PaperWorkshop.ts';
import {foldedGlobe} from '../src/vnext/revisionEarlyArt.ts';

test('F03 the struck flat stock, rise, wrap and closed world are the exact same physical gores',()=>{
  const old=globalThis.performance;
  let time=12;
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>time}});
  const workshop=makeF03PaperWorkshop();
  try{
    const {root,update}=workshop;
    const state={template:0,vaultOpen:true,generation:0};
    update(state,0,false);
    update({...state,generation:1},.03,false);
    const study=[];
    const world=root.getObjectByName('Notebook output • Syrrian IV');
    const gore=world.getObjectByName('Scored and folded cardstock gore 1');
    const mesh=gore.geometry.attributes.position;
    const plot=()=>[...mesh.array];
    assert.equal(root.userData.phase,'impress');
    for(let i=0;i<106;i++){
      time+=43;update({...state,generation:1},.043,false);
      if(!study.some(b=>b.phase===root.userData.phase))
        study.push({phase:root.userData.phase,shape:plot()});
    }
    assert.deepEqual(study.map(s=>s.phase),['impress','draw','score','wrap','seat','rest']);
    for(const i of [0,1,2])assert.equal(study[1].shape[i*3+1],0);
    assert.notDeepEqual(study[3].shape,study[1].shape);
    assert.equal(root.getObjectByName('Notebook output • Syrrian IV'),world);
    assert.equal(world.getObjectByName('Scored and folded cardstock gore 1'),gore);
    const exact=foldedGlobe(new THREE.Group(),0,1,.236,false);
    assert.deepEqual(plot(),[...exact.getObjectByName(gore.name).geometry.attributes.position.array]);
    assert.ok(world.quaternion.angleTo(exact.quaternion)<1e-6);
  }finally{workshop.dispose();Object.defineProperty(globalThis,'performance',{configurable:true,value:old});}
});

test('F03 all three original visual families survive their keyed press and reduced-motion rest',()=>{
  const workshop=makeF03PaperWorkshop();
  try{
    const names=['Syrrian IV','Nimbus III','Cirrus I'];
    const physical=['Suspended island, visible paper cut edge','Print-lit bioluminescent mark','Translucent continent facets'];
    const keys=['1001','0110','1100'];
    const signatures=[];
    for(let i=0;i<3;i++){
      workshop.update({vaultOpen:true,template:i,generation:1},0,true);
      const {root}=workshop,output=root.getObjectByName('Notebook output • '+names[i]);
      assert.ok(output.getObjectByName(physical[i]));
      assert.equal(root.userData.phase,'rest');
      assert.equal(root.userData.profileKey,keys[i]);
      assert.equal(root.userData.outputVisible,true);
      assert.ok(root.userData.printedProfileVertices>=10);
      signatures.push(root.userData.geometrySignature);
    }
    assert.equal(new Set(signatures).size,3);
  }finally{workshop.dispose();}
});
