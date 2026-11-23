import * as THREE from 'three';
import { getOpenPageY as pageY } from '../../engine/BookAndDeskRig';
import type { FolioRuntimeState } from '../../types/atlas';
import { authoredSlotMixer,createPortedPaperAsset } from './portedPaperAsset.ts';

const name='F09_A_Authored_Model_Star_Extraction';
const FPS=18, HELD_FRAME=70;
const SIZE=.60;
// Keep the reviewed instrument on the model side. Match its physical paper foot,
// not its studio camera, to the binding of the existing book.
const centerX=-1.16,centerZ=-.37, footY=pageY(centerX)+.006;
export const F09_MODEL_CENTER=new THREE.Vector3(centerX,footY+(.94-.191)*SIZE,centerZ);

export function makeF09CandidateStage(onReady:(pull: THREE.Object3D,star:THREE.Object3D,absence:THREE.Object3D)=>void,onFail:()=>void){
  let localHit:[THREE.Object3D,THREE.Object3D,THREE.Object3D]|undefined;
  const staged=createPortedPaperAsset<FolioRuntimeState>(
    'F09 · reviewed Blender model-star extraction',
    ()=>import('../assets/palimpsest-f09-challenger.glb?url'),
    gltf=>{
      const model=gltf.scene;
      const root=model.getObjectByName('F09_A_Approved_Blender_Source');
      const star=root?.getObjectByName('F09_A_MODEL');
      const absence=root?.getObjectByName('F09_A_MATTE_ABSENCE');
      const pull=root?.getObjectByName('F09_A_PULL_RING');
      const filament=root?.getObjectByName('F09_A_FILAMENT');
      const dry=absence?.getObjectByName('F09_Dry_obsidian_model_mark');
      const spokes=Array.from({length:8},(_,i)=>root?.getObjectByName('F09_A_SPOKE_'+String(i+1).padStart(2,'0')));
      const clip=gltf.animations.find(c=>c.name===name);
      if(!root||!star||!absence||!pull||!(filament instanceof THREE.Mesh)
        ||!(dry instanceof THREE.Mesh)||!(dry.material instanceof THREE.MeshBasicMaterial)
        ||!clip||clip.tracks.length!==11||spokes.some(n=>!n)
        ||(filament.morphTargetInfluences?.length??0)!==44){
        throw new Error('Missing authored F09 armillary, poses, filament morphs or unlit aperture');
      }
      localHit=[pull,star,absence];
      model.scale.setScalar(SIZE);
      // Blender center (-1.95,.42,.94) was converted by its glTF exporter to (-1.95,.94,-.42).
      model.position.set(centerX+1.95*SIZE,footY-.191*SIZE,centerZ+.42*SIZE);
      model.traverse(node=>{
        if(node instanceof THREE.Mesh){
          node.castShadow=node!==filament;
          node.receiveShadow=true;
        }
      });
      const mixer=authoredSlotMixer<'A'>(root,gltf.animations,c=>c.name===name?'A':undefined,FPS);
      let shown=false,frame=1;
      return {
        update(state,dt,reduced){
          const a=state.interactions.A,locked=a.active||a.locked;
          if(!shown||reduced) frame=locked?HELD_FRAME:1;
          else if(locked) frame=Math.min(HELD_FRAME,frame+Math.min(.1,Math.max(0,dt))*FPS);
          shown=true;
          mixer.sample([['A',frame]]);
          star.visible=frame<49;
          absence.visible=frame>=44;
          model.parent!.userData.authorFrame=frame;
          model.parent!.userData.modelState=star.visible?(frame<10?'star':'extraction'):'matte-absence';
          model.parent!.userData.foldDegrees=THREE.MathUtils.radToDeg(2*Math.acos(THREE.MathUtils.clamp(spokes[0]!.quaternion.w,-1,1)));
          model.parent!.userData.filamentTravel=-(pull.position.x+.96);
          model.parent!.userData.activeFilamentMorphs=filament.morphTargetInfluences!.filter(x=>x>.03).length;
        },dispose:()=>mixer.dispose(),
      };
    },
    phase=>{
      if(phase==='ready'&&localHit)onReady(...localHit);
      if(phase==='fallback')onFail();
    },
  );
  return staged;
}
