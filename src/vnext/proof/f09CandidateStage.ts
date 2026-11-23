import * as THREE from 'three';
import { getOpenPageY as pageY } from '../../engine/BookAndDeskRig';
import type { FolioRuntimeState } from '../../types/atlas';
import { authoredSlotMixer,createPortedPaperAsset } from './portedPaperAsset.ts';
import { f09Cue } from '../f09EnvironmentalTheatre.ts';

const name='F09_A_Authored_Model_Star_Extraction';
const FPS=18, HELD_FRAME=70;
const SIZE=.60;
// Keep the reviewed instrument on the model side. Match its physical paper foot,
// not its studio camera, to the binding of the existing book.
const centerX=-1.16,centerZ=-.37, footY=pageY(centerX)+.006;
export const F09_MODEL_CENTER=new THREE.Vector3(centerX,footY+(.94-.191)*SIZE,centerZ);

export function bindF09CandidateStage(model:THREE.Group,animations:THREE.AnimationClip[]){
      const root=model.getObjectByName('F09_A_Approved_Blender_Source');
      const star=root?.getObjectByName('F09_A_MODEL');
      const absence=root?.getObjectByName('F09_A_MATTE_ABSENCE');
      const pull=root?.getObjectByName('F09_A_PULL_RING');
      const filament=root?.getObjectByName('F09_A_FILAMENT');
      const dry=absence?.getObjectByName('F09_Dry_obsidian_model_mark');
      const arm=root?.getObjectByName('F09_A_ARMILLARY');
      const gimbals=arm?.children.filter(n=>n.name.startsWith('F09_Bonded_gimbal_ring'))??[];
      const spokes=Array.from({length:8},(_,i)=>root?.getObjectByName('F09_A_SPOKE_'+String(i+1).padStart(2,'0')));
      const clip=animations.find(c=>c.name===name);
      if(!root||!star||!absence||!pull||!(filament instanceof THREE.Mesh)||gimbals.length!==3
        ||!(dry instanceof THREE.Mesh)||!(dry.material instanceof THREE.MeshBasicMaterial)
        ||!clip||clip.tracks.length!==11||spokes.some(n=>!n)
        ||(filament.morphTargetInfluences?.length??0)!==44){
        throw new Error('Missing authored F09 armillary, poses, filament morphs or unlit aperture');
      }
      model.scale.setScalar(SIZE);
      // Blender center (-1.95,.42,.94) was converted by its glTF exporter to (-1.95,.94,-.42).
      model.position.set(centerX+1.95*SIZE,footY-.191*SIZE,centerZ+.42*SIZE);
      model.traverse(node=>{
        if(node instanceof THREE.Mesh){
          node.castShadow=node!==filament;
          node.receiveShadow=true;
        }
      });
      const iris=clip.tracks.filter(track=>/^F09_A_SPOKE_/.test(track.name));
      if(iris.length!==8)throw new Error('Missing F09 native petal tracks');
      const sourceTracks=clip.tracks.filter(track=>!iris.includes(track));
      const native=[new THREE.AnimationClip('extraction',clip.duration,sourceTracks),
        ...iris.map(t=>new THREE.AnimationClip(t.name.split('.')[0],clip.duration,[t]))];
      const mixer=authoredSlotMixer<string>(root,native,c=>c.name,FPS);
      const q0=gimbals.map(n=>n.quaternion.clone()),adjust=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0);
      let shown=false,frame=1;
      const update=(state:FolioRuntimeState,dt:number,reduced:boolean)=>{
        const a=state.interactions.A,locked=a.active||a.locked;
        if(!shown||reduced) frame=locked?HELD_FRAME:1;
        else if(locked) frame=Math.min(HELD_FRAME,frame+Math.min(.1,Math.max(0,dt))*FPS);
        shown=true;
        const cue=f09Cue(frame);
        // Keep the native filament and scored hinges. Resample the leaves so
        // eight successive catches close around the imported armature rather than swapping a star image.
        // Only the dry endpoint becomes visible at the final catch, without a lingering flash.
        const held=frame>=49;
        const moment=held?HELD_FRAME:frame;
        mixer.sample([['extraction',moment],...iris.map((t,i)=>[t.name.split('.')[0],cue.petals[i]] as [string,number])]);
        star.visible=!held;
        absence.visible=held;
        gimbals.forEach((n,i)=>n.quaternion.copy(q0[i]).multiply(adjust.setFromAxisAngle(axis,reduced?0:cue.gimbal[i])));
        const petalDegrees=spokes.map(s=>THREE.MathUtils.radToDeg(2*Math.acos(THREE.MathUtils.clamp(s!.quaternion.w,-1,1))));
        return {authorFrame:frame,modelState:held?'matte-absence':frame<10?'star':'extraction',
          environmentalBeat:cue.phase,foldDegrees:petalDegrees[0],petalDegrees,
          gimbal:reduced?[0,0,0]:cue.gimbal,
          filamentTravel:-(pull.position.x+.96),
          activeFilamentMorphs:filament.morphTargetInfluences!.filter(x=>x>.03).length};
      };
      return {update,hits:[pull,star,absence] as const,dispose:()=>mixer.dispose()};
}

export function makeF09CandidateStage(onReady:(pull:THREE.Object3D,star:THREE.Object3D,absence:THREE.Object3D)=>void,onFail:()=>void){
  let localHit:readonly [THREE.Object3D,THREE.Object3D,THREE.Object3D]|undefined;
  return createPortedPaperAsset<FolioRuntimeState>(
    'F09 · reviewed Blender model-star extraction',
    ()=>import('../assets/palimpsest-f09-challenger.glb?url'),
    gltf=>{
      const model=gltf.scene,mechanism=bindF09CandidateStage(model,gltf.animations);
      localHit=mechanism.hits;
      return {update(state,dt,reduced){
        Object.assign(model.parent!.userData,mechanism.update(state,dt,reduced));
      },dispose:mechanism.dispose};
    },
    phase=>{
      if(phase==='ready'&&localHit)onReady(...localHit);
      if(phase==='fallback')onFail();
    },
  );
}
