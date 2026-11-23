import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

export const paperKey=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
type Phase='loading'|'ready'|'fallback';
export type PaperSource={default:string};

export function disposePaperModel(model:THREE.Object3D):void{
  const geom=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>(),maps=new Set<THREE.Texture>();
  model.traverse(n=>{
    if(!(n instanceof THREE.Mesh))return;
    geom.add(n.geometry);
    (Array.isArray(n.material)?n.material:[n.material]).forEach(m=>{
      mats.add(m);
      Object.values(m).forEach(x=>{if(x instanceof THREE.Texture)maps.add(x);});
    });
  });
  model.removeFromParent();
  geom.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());maps.forEach(t=>t.dispose());
}

export function createPortedPaperAsset<T>(
  name:string,
  source:()=>Promise<PaperSource>,
  bind:(gltf:GLTF)=>{update:(state:T,dt:number,reduced:boolean)=>void;dispose?:()=>void},
  phase:(value:Phase)=>void,
){
  const root=new THREE.Group();root.name=name;root.userData.assetState='loading';
  let mounted:GLTF|undefined,timeline:ReturnType<typeof bind>|undefined,dead=false,shown=false;
  void source().then(async payload=>{
    if(dead)return;
    const scene=await new GLTFLoader().loadAsync(payload.default);
    if(dead){disposePaperModel(scene.scene);return;}
    mounted=scene;
    timeline=bind(scene);
    scene.scene.visible=false;
    root.add(scene.scene);
    root.userData.assetState='ready';phase('ready');
  }).catch(reason=>{
    if(dead)return;
    if(mounted)disposePaperModel(mounted.scene);
    root.userData.assetState='fallback';
    console.warn(name,'Blender asset unavailable; retaining the prior stage.',reason);
    phase('fallback');
  });
  return {root,update(state:T,dt:number,reduced:boolean){
    if(!timeline||!mounted)return;
    timeline.update(state,dt,reduced);
    if(!shown){shown=true;mounted.scene.visible=true;}
  },dispose(){
    if(dead)return;dead=true;
    timeline?.dispose();
    if(mounted)disposePaperModel(mounted.scene);
    timeline=undefined;mounted=undefined;root.clear();
  }};
}

/** Native baked transforms, sampled independently to preserve reader-controlled slots. */
export function authoredSlotMixer<S extends string>(
  model:THREE.Object3D,
  clips:readonly THREE.AnimationClip[],
  categorize:(clip:THREE.AnimationClip)=>S|undefined,
  fps:number,
){
  const mixer=new THREE.AnimationMixer(model);
  const actions=new Map<S,THREE.AnimationAction[]>();
  for(const clip of clips){
    const slot=categorize(clip);if(slot===undefined)continue;
    const action=mixer.clipAction(clip).setLoop(THREE.LoopOnce,0).play();
    action.paused=true;action.clampWhenFinished=true;
    const collection=actions.get(slot)??[];
    collection.push(action);actions.set(slot,collection);
  }
  return { has:(slot:S)=>actions.has(slot),
    sample(frames:Iterable<[slot:S,frame:number]>){
      for(const [slot,frame] of frames)for(const action of actions.get(slot)??[]){
        action.time=THREE.MathUtils.clamp((frame-1)/fps,0,action.getClip().duration);
      }
      mixer.update(0);
    },
    dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);}
  };
}
