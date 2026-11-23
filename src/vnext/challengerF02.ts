import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const DETENT = [0, 38/24, 64/24, 109/24] as const;
const NATIVE_CLIP = 'F02_ORIGINAL_BLENDER_FOLDS';
type Phase = 'loading' | 'ready' | 'fallback';
export type F02Reveal = 0 | 1 | 2 | 3;

/** Sample the approved Blender timeline, including baked Hook gussets. The
 * runtime shader separately owns the vellum tide and its print-stage masks. */
export function createF02Challenger(initial: F02Reveal, reducedMotion: boolean, report: (phase: Phase) => void) {
  const root = new THREE.Group();
  root.name = 'F02 actual Blender paper loom';
  let model: THREE.Group | null = null;
  let mixer: THREE.AnimationMixer | null = null;
  let action: THREE.AnimationAction | null = null;
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
      model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
      root.add(model);
      mixer=new THREE.AnimationMixer(model);
      action=mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce,1);
      action.clampWhenFinished=true;action.play();action.paused=true;
      t=DETENT[target];sample();setPhase('ready');
    })
    .catch(error=>{if(!disposed){root.userData.failure=String(error);setPhase('fallback');}});
  return {
    root,
    update(reveal: F02Reveal, dt: number, reduce: boolean) {
      target=reveal;reduced=reduce;
      if (!action)return;
      const destination=DETENT[target], delta=destination-t;
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
      root.clear();model=null;action=null;mixer=null;
    },
  };
}
