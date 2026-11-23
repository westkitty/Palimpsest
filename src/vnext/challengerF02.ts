import * as THREE from 'three';
import {f02AnchoredHeight,f02ArmExtensions} from './f02Motion.ts';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const DETENT = [0, 38/24, 64/24, 109/24] as const;
const NATIVE_CLIP = 'F02_ORIGINAL_BLENDER_FOLDS';
type Phase = 'loading' | 'ready' | 'fallback';
export type F02Reveal = 0 | 1 | 2 | 3;

type ArmPart={geometry:THREE.BufferGeometry,position:THREE.BufferAttribute,rest:Float32Array,normals:Float32Array|null};
/** Binds each original die-cut strip, its printed face, and five matching
 * source V supports. Bond feet and the material's planar contact line never move. */
export function bindF02AnchoredArms(model:THREE.Object3D){
  const source=model.getObjectByName('F02_STELLAR_C');
  const arms:ArmPart[][]=Array.from({length:4},()=>[]);
  const seen=new Set<THREE.BufferGeometry>();
  for (const part of source?.children??[]){
    const strip=part.name.match(/^(?:Black_die-cut_spiral_strip|Printed_ink_face_of_spiral_strip)_([1-4])$/);
    const gusset=part.name.match(/^Folded_black_ribbon_support.*leaf(\d{3})?$/);
    if(!strip&&!gusset)continue;
    const index=strip?Number(strip[1])-1:Math.floor(Number(gusset?.[1]??0)/5);
    if(!arms[index])continue;
    part.traverse(child=>{
      if (!(child instanceof THREE.Mesh)||seen.has(child.geometry))return;
      const position=child.geometry.getAttribute('position');
      if(!(position instanceof THREE.BufferAttribute))return;
      seen.add(child.geometry);
      const rest=Float32Array.from({length:position.count},(_,i)=>position.getY(i));
      position.setUsage(THREE.DynamicDrawUsage);
      const norm=child.geometry.getAttribute('normal');
      const normals=norm instanceof THREE.BufferAttribute?Float32Array.from(norm.array):null;
      arms[index].push({geometry:child.geometry,position,rest,normals});
    });
  }
  if(arms.some(a=>a.length<7))throw new Error('F02 original four paper arms and their matched V-joins not found');
  let last=[1,1,1,1];
  return (frame:number)=>{
    const values=f02ArmExtensions(frame);
    arms.forEach((parts,j)=>{
      if(last[j]===values[j])return;
      for(const {position,rest,geometry,normals} of parts){
        // Only compress along the stock normal. Original vertex x/z, thickness
        // inclinations & all glued contact positions are never replaced.
        for(let i=0;i<rest.length;i++)position.setY(i,f02AnchoredHeight(rest[i],values[j]));
        position.needsUpdate=true;
        if(values[j]===1&&normals){
          const normal=geometry.getAttribute('normal');
          normal.array.set(normals);normal.needsUpdate=true;
        }else geometry.computeVertexNormals();
      }
    });
    last=values;
    return values;
  };
}
/** Sample the approved Blender timeline, including baked Hook gussets. The
 * runtime shader separately owns the vellum tide and its print-stage masks. */
export function createF02Challenger(initial: F02Reveal, reducedMotion: boolean, report: (phase: Phase) => void) {
  const root = new THREE.Group();
  root.name = 'F02 actual Blender paper loom';
  let model: THREE.Group | null = null;
  let mixer: THREE.AnimationMixer | null = null;
  let action: THREE.AnimationAction | null = null;
  let armMotion: ReturnType<typeof bindF02AnchoredArms> | null = null;
  let disposed = false, target: F02Reveal = initial, reduced = reducedMotion;
  let t: number = DETENT[initial];
  root.userData.status = 'loading';
  const setPhase = (status: Phase) => { root.userData.status=status; report(status); };
  const sample = () => {
    if (!action || !mixer) return;
    action.time=t;
    mixer.update(0);
    const exact=DETENT.findIndex(d=>Math.abs(t-d)<0.000001);
    root.userData.frame=1+t*24;
    root.userData.armExtensions=armMotion?.(root.userData.frame);
    root.userData.detent=exact;
    root.userData.moving=exact!==target;
    root.userData.clip=NATIVE_CLIP;
  };
  const disposeModel=(m: THREE.Group)=>{
    const geometry=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>();
    m.traverse(o=>{
      if (!(o instanceof THREE.Mesh)) return;
      geometry.add(o.geometry);
      for (const mat of Array.isArray(o.material)?o.material:[o.material]) materials.add(mat);
    });
    geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  };
  void import('./assets/palimpsest-f02-challenger.glb?url')
    .then(async module=>{
      if (disposed) return;
      const gltf=await new GLTFLoader().loadAsync(module.default);
      if (disposed){disposeModel(gltf.scene);return;}
      const clip=gltf.animations.find(c=>c.name===NATIVE_CLIP);
      if (!clip || clip.tracks.length!==12 || Math.abs(clip.duration-DETENT[3])>0.001){
        disposeModel(gltf.scene);throw new Error('F02 source fold / gusset timeline is missing');
      }
      model=gltf.scene;
      armMotion=bindF02AnchoredArms(model);
      model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
      root.add(model);
      mixer=new THREE.AnimationMixer(model);
      action=mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce,1);
      action.clampWhenFinished=true;action.play();action.paused=true;
      t=DETENT[target];sample();setPhase('ready');
    })
    .catch(error=>{if(!disposed){
      if(model){model.removeFromParent();disposeModel(model);model=null;}
      root.userData.failure=String(error);setPhase('fallback');
    }});
  return {
    root,
    update(reveal: F02Reveal, dt: number, reduce: boolean, inkAdvance:number) {
      target=reveal;reduced=reduce;
      if (!action)return;
      // Hold on real pre-reveal Blender frames until the matching ink cue.
      // This does not change the keyed detents or the reversible source motion.
      const foldLimit=inkAdvance<.123?19/24:inkAdvance<.474?43/24:inkAdvance<.692?69/24:DETENT[3];
      const destination=reduced?DETENT[target]:Math.min(DETENT[target],foldLimit), delta=destination-t;
      // Move directly along the same authored curves in either direction.
      // Transit time is independent of the editor's blank pre-roll.
      const step=Math.min(Math.max(dt,0),0.07)*1.78;
      t=reduced||Math.abs(delta)<=step?destination:t+Math.sign(delta)*step;
      sample();
    },
    dispose() {
      if (disposed)return;
      disposed=true;
      if (model){mixer?.stopAllAction();mixer?.uncacheRoot(model);disposeModel(model);}
      root.clear();model=null;action=null;mixer=null;armMotion=null;
    },
  };
}
