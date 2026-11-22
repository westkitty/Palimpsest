import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { FolioActions } from './folioLogic.ts';

const prefix = 'F01_ABS_';
const bits = [1, 2, 4] as const;
const edgeKey = (a: number, b: number) => prefix + Math.min(a,b) + '_' + Math.max(a,b);
export const f01Mask = (s: FolioActions['f01']): number => Number(s.fold) | (Number(s.detail) << 1) | (Number(s.compare) << 2);
export function nextF01Detent(from: number, to: number): number {
  return from ^ (bits.find(bit => (from ^ to) & bit) ?? 0);
}

function disposeModel(model: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach(t => t.dispose());
  materials.forEach(m => m.dispose());
  geometries.forEach(g => g.dispose());
}

type Flight = { from: number; to: number; progress: number; duration: number; action: THREE.AnimationAction };
type Phase = 'loading' | 'ready' | 'fallback';
export type F01Challenger = {
  root: THREE.Group;
  update(state: FolioActions, dt: number, reduced: boolean): void;
  dispose(): void;
};

/** Absolute, authored Blender detents. No mesh or motion substitutes on the success path. */
function keyedMechanisms(model: THREE.Group, clips: THREE.AnimationClip[]) {
  const byName = new Map(clips.map(clip => [clip.name, clip]));
  const mixer = new THREE.AnimationMixer(model);
  let idleMixer: THREE.AnimationMixer | null = null;
  let active: THREE.AnimationAction | null = null;
  let flight: Flight | null = null;
  let shown = 0;
  let hasInitialPose = false;
  let authoredIdle: THREE.AnimationAction | null = null;

  for (let i = 0; i < 8; i++) for (const bit of bits) {
    const j=i^bit;
    if(j<=i)continue;
    const clip=byName.get(edgeKey(i,j));
    if (!clip || !clip.tracks.length || clip.duration <= 0) {
      throw new Error('F01 challenger is missing an authored detent edge: ' + edgeKey(i,j));
    }
  }
  const idle=byName.get('F01_ACTOR_IDLE');
  if (idle && idle.tracks.length && idle.duration > 0) {
    idleMixer=new THREE.AnimationMixer(model);
    authoredIdle=idleMixer.clipAction(idle);
    authoredIdle.play();
  }
  const start=(from:number,to:number,progress:number):Flight=>{
    const name=edgeKey(from,to);
    const clip=byName.get(name)!;
    const action=mixer.clipAction(clip);
    active?.stop();
    action.reset();
    action.setLoop(THREE.LoopOnce,1);
    action.clampWhenFinished=true;
    action.play();
    action.paused=true;
    active=action;
    return {from,to,progress,duration:clip.duration,action};
  };
  const sample=(f:Flight)=>{
    // Manual sampling holds endpoints and allows deterministic, reversible
    // control on either side of the exact same authored Blender keyframes.
    const normalized=f.from<f.to?f.progress:1-f.progress;
    f.action.time=normalized*f.duration;
    mixer.update(0);
  };
  const detent=(value:number)=>{
    flight=null;
    sample(start(value ^ 1,value,1));
    shown=value;
  };
  return {
    get idle() { return Boolean(authoredIdle); },
    update(target:number,dt:number,reduced:boolean) {
      if (reduced || !hasInitialPose) {
        if (!hasInitialPose || target!==shown || flight) detent(target);
        hasInitialPose=true;
      } else {
        if (flight && target===flight.from) {
          [flight.from,flight.to]=[flight.to,flight.from];
          flight.progress=1-flight.progress; // no jump when a reader reverses a moving tab
        }
        if (!flight && target!==shown) flight=start(shown,nextF01Detent(shown,target),0);
        if (flight) {
          flight.progress=Math.min(1,flight.progress+Math.min(Math.max(dt,0),0.07)/flight.duration);
          sample(flight);
          if (flight.progress===1) {
            shown=flight.to;
            flight=null;
          }
        }
      }
      // Idle animates only the separate child track set; it never fights A/B/C.
      if (idleMixer) {
        if (reduced) idleMixer.setTime(0);
        else idleMixer.update(Math.min(Math.max(dt,0),0.07));
      }
      return {settled:shown, clip:flight?.action.getClip().name??active?.getClip().name??'', moving:Boolean(flight)};
    },
    dispose() {
      mixer.stopAllAction();mixer.uncacheRoot(model);
      idleMixer?.stopAllAction();idleMixer?.uncacheRoot(model);
    },
  };
}

export function createF01Challenger(
  initial: FolioActions,
  reducedMotion: boolean,
  onPhase: (phase: Phase) => void,
): F01Challenger {
  const root=new THREE.Group();
  root.name='F01 actual Blender challenger';
  root.userData.status='loading';
  let disposed=false;
  let state=initial;
  let reduced=reducedMotion;
  let model:THREE.Group|null=null;
  let animator:ReturnType<typeof keyedMechanisms>|null=null;
  const report=(phase:Phase)=>{
    root.userData.status=phase;
    if (!disposed) onPhase(phase);
  };
  const accept=(gltf:GLTF)=>{
    if (disposed) {disposeModel(gltf.scene);return;}
    model=gltf.scene;
    try {
      const candidate=keyedMechanisms(model,gltf.animations);
      model.name='F01 exported Blender paper stage';
      model.traverse(node=>{
        if (node instanceof THREE.Mesh) {
          node.castShadow=true;
          node.receiveShadow=true;
        }
      });
      root.add(model);
      animator=candidate;
      root.userData.idle=animator.idle;
      Object.assign(root.userData,animator.update(f01Mask(state.f01),0,reduced));
      report('ready');
    } catch(error) {
      root.remove(model);disposeModel(model);model=null;
      animator?.dispose();animator=null;
      root.userData.failure=(error as Error).message;
      report('fallback');
    }
  };
  // The URL uses Vite's relative, hashed production asset pipeline. It is
  // requested only for F01, is never a remote runtime dependency, and keeps
  // the archival reader entirely outside this path.
  void import('./assets/palimpsest-f01-challenger.glb?url')
    .then(asset=>{
      if (!disposed) return new GLTFLoader().loadAsync(asset.default).then(accept);
    })
    .catch(error=>{
      if(!disposed){root.userData.failure=String(error);report('fallback');}
    });
  return {
    root,
    update(next, dt, motion) {
      state=next;reduced=motion;
      if (animator) Object.assign(root.userData,animator.update(f01Mask(state.f01),dt,reduced));
    },
    dispose() {
      if (disposed) return;
      disposed=true;
      animator?.dispose();
      if (model) disposeModel(model);
      animator=null;model=null;
      root.clear();
    },
  };
}
