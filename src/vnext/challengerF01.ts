import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { FolioActions } from './folioLogic.ts';
import { bindF01EnvironmentalStage,f01CreaseProgress } from './f01EnvironmentalStage.ts';
import { bindF01FigurePerformance } from './f01FigurePerformance.ts';

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

type Flight = { from:number;to:number;progress:number;duration:number;name:string;actions:THREE.AnimationAction[] };
type Phase = 'loading' | 'ready' | 'fallback';
export type F01Challenger = {
  root: THREE.Group;
  update(state: FolioActions, dt: number, reduced: boolean): void;
  dispose(): void;
};

/** Every track still comes from the actual authored clips. Only station timing is staged. */
export function bindF01Mechanisms(model: THREE.Group, clips: THREE.AnimationClip[]) {
  const byName=new Map(clips.map(clip=>[clip.name,clip]));
  const mixer=new THREE.AnimationMixer(model);
  const layer=bindF01EnvironmentalStage(model);
  const cache=new Map<string,THREE.AnimationClip[]>();
  const station=(track:THREE.KeyframeTrack)=>Number(/^F01_(?:HINGE|GUSSET|DETAIL)_([123])(?:[_.]|$)/.exec(track.name)?.[1]??0)-1;
  for(let i=0;i<8;i++)for(const bit of bits){
    const j=i^bit;if(j<=i)continue;
    const name=edgeKey(i,j),clip=byName.get(name);
    if(!clip||!clip.tracks.length||clip.duration<=0)throw new Error('F01 challenger is missing authored detent: '+name);
    const split=[0,1,2].map(s=>clip.tracks.filter(t=>station(t)===s));
    if(split.some(group=>group.length!==10))throw new Error('F01 authored hinge/gusset station incomplete: '+name);
    cache.set(name,split.map((tracks,s)=>new THREE.AnimationClip(name+'_station_'+s,clip.duration,tracks)));
  }

  const performance=bindF01FigurePerformance(model,byName.get('F01_ACTOR_IDLE'));
  let active:Flight|null=null,flight:Flight|null=null,shown=0,hasInitialPose=false;
  const isA=(f:Flight)=>Boolean((f.from^f.to)&1);
  const normalize=(f:Flight)=>f.from<f.to?f.progress:1-f.progress;
  const aDuration=(to:number)=>to&1?3.65:1.55;
  const start=(from:number,to:number,progress:number):Flight=>{
    const name=edgeKey(from,to), authored=cache.get(name)!;
    active?.actions.forEach(a=>a.stop());
    const a=authored.map(c=>{
      const action=mixer.clipAction(c);
      action.reset().setLoop(THREE.LoopOnce,1).play();
      action.clampWhenFinished=true;action.paused=true;return action;
    });
    return active={from,to,progress,name,duration:((from^to)&1)?aDuration(to):authored[0].duration,actions:a};
  };
  const sample=(f:Flight)=>{
    const normalized=normalize(f);
    const phase=isA(f)?f01CreaseProgress(normalized):[normalized,normalized,normalized];
    f.actions.forEach((a,i)=>a.time=phase[i]*a.getClip().duration);
    mixer.update(0);
  };
  const detent=(value:number)=>{
    flight=null;sample(start(value^1,value,1));shown=value;
  };
  return {
    get idle(){return true;},
    update(target:number,dt:number,reduced:boolean,stageVisible=true){
      const step=Math.min(Math.max(dt,0),.09);
      if(reduced||!hasInitialPose){
        if(!hasInitialPose||target!==shown||flight)detent(target);
        hasInitialPose=true;
      }else{
        if(flight&&target===flight.from){
          [flight.from,flight.to]=[flight.to,flight.from];
          flight.progress=1-flight.progress;
          if(isA(flight))flight.duration=aDuration(flight.to);
        }
        if(!flight&&target!==shown)flight=start(shown,nextF01Detent(shown,target),0);
        if(flight){
          flight.progress=Math.min(1,flight.progress+step/flight.duration);
          sample(flight);
          if(flight.progress===1){shown=flight.to;flight=null;}
        }
      }
      const stage=layer.update(flight&&isA(flight)?normalize(flight):Number(Boolean(shown&1)));
      const figure=performance.update(stage.stations,step,reduced,stageVisible);
      return {settled:shown,clip:flight?.name??active?.name??'',moving:Boolean(flight),stage:{...stage,...figure}};
    },
    dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);performance.dispose();},
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
  let animator:ReturnType<typeof bindF01Mechanisms>|null=null;
  const report=(phase:Phase)=>{
    root.userData.status=phase;
    if (!disposed) onPhase(phase);
  };
  const accept=(gltf:GLTF)=>{
    if (disposed) {disposeModel(gltf.scene);return;}
    model=gltf.scene;
    try {
      const candidate=bindF01Mechanisms(model,gltf.animations);
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
      if (animator) {
        let visible=true;
        for(let node:THREE.Object3D|null=root;node&&visible;node=node.parent)visible=node.visible;
        Object.assign(root.userData,animator.update(f01Mask(state.f01),dt,reduced,visible));
      }
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
