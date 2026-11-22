import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { FolioRuntimeState } from '../../types/atlas';
import glb from './assets/palimpsest-f05.glb?url&inline';

const fps=24;
const bFrames=[42,65,85,105,126];
const slots=['A','B','C'] as const;
type Slot=(typeof slots)[number];
const clean=(name:string)=>name.replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
const up=new THREE.Vector3(0,1,0);

export function makeF05CandidateStage(ready:()=>void,failed:()=>void) {
  const root=new THREE.Group();
  root.name='F05 · Blender-authored crimson ring and inspection works';
  const controls:THREE.Mesh[]=[];
  const channels:Record<Slot,THREE.AnimationAction[]>={A:[],B:[],C:[]};
  let disposed=false, failedLoad=false, clock=0, initialized=false;
  let asset:THREE.Group|undefined, mixer:THREE.AnimationMixer|undefined;
  let orbit:THREE.Object3D|undefined, green:THREE.Object3D|undefined, scarred:THREE.Object3D|undefined;
  const markers:{node:THREE.Object3D;step:number}[]=[];
  const draxis:{node:THREE.Object3D;base:THREE.Quaternion}[]=[];
  const ringSurface:{mat:THREE.MeshStandardMaterial;base:number}[]=[];
  let frames=[20,42,132];
  root.userData.assetState='loading';

  function disposeTree(scene:THREE.Object3D):void {
    const geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
    scene.traverse(n=>{if(n instanceof THREE.Mesh){
      geometry.add(n.geometry);
      for(const mat of Array.isArray(n.material)?n.material:[n.material])materials.add(mat);
    }});
    geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    scene.removeFromParent();
  }
  function fail():void {
    if(disposed||failedLoad)return;
    failedLoad=true;root.userData.assetState='unavailable';
    if(asset)disposeTree(asset);
    failed();
  }

  new GLTFLoader().load(glb,data=>{
    if(disposed){disposeTree(data.scene);return;}
    asset=data.scene;
    asset.scale.set(.89,.96,1.035);
    asset.position.y=.07;
    mixer=new THREE.AnimationMixer(asset);
    for(const clip of data.animations){
      const slot=clip.name.slice(0,1) as Slot;
      if(!slots.includes(slot))continue;
      const action=mixer.clipAction(clip).setLoop(THREE.LoopOnce,0);
      action.paused=true;action.clampWhenFinished=true;action.play();
      channels[slot].push(action);
    }
    asset.traverse(n=>{
      const id=clean(n.name);
      if(id.startsWith('aaplanetorbitalcomparisonpivot'))orbit=n;
      if(id.startsWith('afallenstarprimelivingsurface'))green=n;
      if(id.startsWith('afallenstarprimeafterconquest'))scarred=n;
      if(id.startsWith('gorevault044source')||id.startsWith('ringthroat029source'))
        draxis.push({node:n,base:n.quaternion.clone()});
      const mark=/^b(?:documentedmaterialpassagemarker|mechanismstagednumber)([1-4])$/.exec(id);
      if(mark)markers.push({node:n,step:Number(mark[1])});
      if(id.startsWith('aaphysicalopaquecrimsonglassironbloodring')){
        const tagged=new Set<THREE.Material>();
        n.traverse(child=>{
          if(!(child instanceof THREE.Mesh))return;
          for(const mat of Array.isArray(child.material)?child.material:[child.material]){
            if(mat instanceof THREE.MeshStandardMaterial&&!tagged.has(mat)){
              tagged.add(mat);ringSurface.push({mat,base:mat.roughness});
            }
          }
        });
      }
      if(!(n instanceof THREE.Mesh))return;
      n.castShadow=true;n.receiveShadow=true;
      if(id.startsWith('hingedpulltab')&&['a','b','c'].includes(id.at(-1)??'')){
        n.userData.slot=id.at(-1)?.toUpperCase();controls.push(n);
      }
    });
    if(!orbit||!green||!scarred||draxis.length!==2||markers.length!==8||controls.length!==3||
      channels.A.length!==2||channels.B.length!==17||channels.C.length!==2||!ringSurface.length){
      console.error('Incomplete F05 challenger',JSON.stringify({orbit:!!orbit,green:!!green,scarred:!!scarred,draxis:draxis.length,markers:markers.length,controls:controls.length,A:channels.A.length,B:channels.B.length,C:channels.C.length,ringSurface:ringSurface.length}));
      fail();return;
    }
    root.add(asset);
    root.userData.assetState='ready';
    ready();
  },undefined,reason=>{console.error('F05 challenger unavailable',reason);fail();});

  function update(state:FolioRuntimeState,dt:number,reduced:boolean):void{
    if(root.userData.assetState!=='ready'||!mixer||!green||!scarred||!orbit)return;
    const {A,B,C}=state.interactions;
    const delta=Math.min(.06,Math.max(dt,0));
    if(!reduced)clock+=delta;
    const dest=[A.active?38:20,bFrames[B.step]??42,C.active?159:132];
    frames=dest.map((frame,i)=>!initialized||reduced?frame:THREE.MathUtils.damp(frames[i],frame,7,delta));
    initialized=true;
    slots.forEach((slot,i)=>channels[slot].forEach(action=>action.time=(frames[i]-1)/fps));
    mixer.update(0);
    orbit.visible=frames[0]>=21;
    green.visible=frames[0]<30;scarred.visible=!green.visible;
    markers.forEach(({node,step})=>node.visible=frames[1]>=53+(step-1)*20);
    // The baked hinges retain their individual A/B/C poses. Idle axes are local
    // to separate systems: independent axial planet turn versus orbital phase.
    green.rotation.y=scarred.rotation.y=reduced?0:clock*.49;
    orbit.rotateOnAxis(up,reduced?0:clock*.81);
    for(const {mat,base} of ringSurface)mat.roughness=reduced?base:base+.038*Math.sin(clock*1.65);
    draxis.forEach(({node,base},i)=>{
      node.quaternion.copy(base);
      if(!reduced){node.rotation.x+=.021*Math.sin(clock*1.61+i*1.8);node.rotation.z+=.016*Math.sin(clock*1.24+i*.8);}
    });
    Object.assign(root.userData,{ring:orbit.visible,step:markers.filter(m=>m.node.visible).length/2,record:frames[2]>=154,
      planetPhase:green.rotation.y,orbitalPhase:reduced?0:clock*.81});
  }
  function dispose():void {
    disposed=true;mixer?.stopAllAction();if(asset){mixer?.uncacheRoot(asset);disposeTree(asset);}
    controls.length=0;
  }
  return {root,update,dispose,controls};
}
