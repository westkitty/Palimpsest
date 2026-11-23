import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { factoryStroke, makeFactoryFloor } from './f05FactoryFloor.ts';
import type { FolioRuntimeState } from '../../types/atlas';

const fps=24;
const bFrames=[42,65,85,105,126];
const slots=['A','B','C'] as const;
type Slot=(typeof slots)[number];
const clean=(name:string)=>name.replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
const up=new THREE.Vector3(0,1,0);

// Standing archive rigs keep a small individual paper-body motion even when
// their machine line is held. The grounded pivot and source details stay put.
export function draxisIdlePose(bay:number,clock:number,reduced:boolean){
  if(reduced)return {pitch:0,roll:0};
  if(bay===1)return {pitch:.024*Math.sin(clock*1.12),roll:-.011*Math.sin(clock*.79+.4)};
  return {pitch:-.018*Math.sin(clock*.87+1.7),roll:.022*Math.sin(clock*1.36+.9)};
}

export function makeF05CandidateStage(ready:()=>void,failed:()=>void) {
  const root=new THREE.Group();
  root.name='F05 · Blender-authored crimson ring and inspection works';
  const controls:THREE.Mesh[]=[];
  const channels:Record<Slot,THREE.AnimationAction[]>={A:[],B:[],C:[]};
  let disposed=false, failedLoad=false, clock=0, initialized=false;
  let asset:THREE.Group|undefined, mixer:THREE.AnimationMixer|undefined;
  let orbit:THREE.Object3D|undefined, green:THREE.Object3D|undefined, scarred:THREE.Object3D|undefined;
  const markers:{node:THREE.Object3D;step:number}[]=[];
  const draxis:{node:THREE.Object3D;base:THREE.Quaternion;bay:number}[]=[];
  const inspectionBoards:{node:THREE.Object3D;bay:number}[]=[];
  let nativeFeedCursor:THREE.Object3D|undefined;
  const ringSurface:{mat:THREE.MeshStandardMaterial;base:number}[]=[];
  let frames=[20,42,132];
  let line:ReturnType<typeof makeFactoryFloor>|undefined;
  const paperFilingLabels:THREE.Object3D[]=[];
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

  void import('./assets/palimpsest-f05.glb?url').then(async glb=>{
    if(disposed)return;
    const data=await new GLTFLoader().loadAsync(glb.default);
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
        draxis.push({node:n,base:n.quaternion.clone(),bay:id.startsWith('gorevault')?1:2});
      const board=/^bbaperture([1-4])rotatingpunchedboard$/.exec(id);
      if(board)inspectionBoards.push({node:n,bay:Number(board[1])-1});
      if(id==='bcutawayredslurrycursor')nativeFeedCursor=n;
      if(/^creamtypedbaylabel|^bayheading|^baydescriptor/.test(id))paperFilingLabels.push(n);
      // Reuse the actual authored records as part of the station, not as a
      // separate form strip. C still controls the original folding pivots.
      if(id.startsWith('ccattributedquotationpaperfold'))n.position.set(-.70,n.position.y,-1.78);
      if(id.startsWith('ccarchiverecordpaperfold'))n.position.set(2.23,n.position.y,.66);
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
    if(!orbit||!green||!scarred||draxis.length!==2||inspectionBoards.length!==4||!nativeFeedCursor||markers.length!==8||controls.length!==3||
      channels.A.length!==2||channels.B.length!==17||channels.C.length!==2||!ringSurface.length){
      console.error('Incomplete F05 challenger',JSON.stringify({orbit:!!orbit,green:!!green,scarred:!!scarred,draxis:draxis.length,markers:markers.length,controls:controls.length,articulatedBoards:inspectionBoards.length,feedCursor:!!nativeFeedCursor,A:channels.A.length,B:channels.B.length,C:channels.C.length,ringSurface:ringSurface.length}));
      fail();return;
    }
    line=makeFactoryFloor(asset);
    root.add(asset);
    root.userData.assetState='ready';
    ready();
  }).catch(reason=>{if(!disposed){console.error('F05 challenger unavailable',reason);fail();}});

  function update(state:FolioRuntimeState,dt:number,reduced:boolean):void{
    if(root.userData.assetState!=='ready'||!mixer||!green||!scarred||!orbit)return;
    const {A,B,C}=state.interactions;
    const delta=Math.min(.06,Math.max(dt,0));
    if(!reduced)clock+=delta;
    const factory=line?.(B.step,delta,reduced);
    const rhythm=factory?.rhythm;
    const dest=[A.active?38:20,bFrames[B.step]??42,C.active?159:132];
    frames=dest.map((frame,i)=>!initialized||reduced?frame:
      i===1&&rhythm?.arrested?frames[i]:THREE.MathUtils.damp(frames[i],frame,7,delta));
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
    // Blend on top of the real B tracks after the mixer samples them. The
    // pulse passes from the first punched board through the two existing
    // Draxis to the outlet. Neither the A orbital clock nor C records use it.
    const working=B.step>0&&!reduced&&rhythm;
    const stroke=(bay:number)=>working?factoryStroke(rhythm.phase,bay):0;
    inspectionBoards.forEach(({node,bay})=>{
      if(frames[1]>53+bay*20)node.rotateX(.086*stroke(bay));
    });
    draxis.forEach(({node,base,bay})=>{
      const a=stroke(bay);
      const idle=draxisIdlePose(bay,clock,reduced);
      node.quaternion.copy(base);
      node.rotateX(idle.pitch+.095*a);
      node.rotateZ(idle.roll+(bay===1?-1:1)*.047*a);
    });
    if(nativeFeedCursor)nativeFeedCursor.position.y+=.026*stroke(1.55);
    for(const item of paperFilingLabels)item.visible=B.step===0;
    Object.assign(root.userData,{factory,ring:orbit.visible,step:markers.filter(m=>m.node.visible).length/2,record:frames[2]>=154,
      planetPhase:green.rotation.y,orbitalPhase:reduced?0:clock*.81,nativeLineFrame:frames[1]});
  }
  function dispose():void {
    disposed=true;mixer?.stopAllAction();if(asset){mixer?.uncacheRoot(asset);disposeTree(asset);}
    controls.length=0;
  }
  return {root,update,dispose,controls};
}
