import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import url from './assets/palimpsest-f10-challenger.glb?url';

function release(g:THREE.Group){
  const geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  g.traverse(v=>{if(v instanceof THREE.Mesh){geometry.add(v.geometry);for(const m of Array.isArray(v.material)?v.material:[v.material])materials.add(m);}});
  for(const m of materials)m.dispose();
  for(const x of geometry)x.dispose();
  g.removeFromParent();
}
const clamp=(x:number)=>THREE.MathUtils.clamp(x,0,1);
const ids=Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));

export function createF10Challenger(center:THREE.Vector3,bump?:THREE.Texture){
  const root=new THREE.Group();
  root.name='F10 authored Blender collar and single dark receiver';
  root.position.copy(center);
  root.userData.assetState='loading';
  let model:THREE.Group|null=null,mixer:THREE.AnimationMixer|null=null;
  let hinges:THREE.Object3D[]=[],acts:THREE.AnimationAction[]=[];
  const closed=new THREE.Quaternion();
  let lift=0,p=0,initialized=false,disposed=false;
  const hits:THREE.Mesh[]=[];
  function sample(){
    if(!mixer)return;
    // Fold and refold are an exact scrub of the authored f07–35 keyframe
    // interval, not a rescaling wall or a second animation approximation.
    for(const a of acts)a.time=p===1?a.getClip().duration:THREE.MathUtils.lerp(6/15,a.getClip().duration,p);
    mixer.update(0);
    // Three.js transforms the Blender X-axis consistently under glTF Y-up.
    // Reading evaluated hinge angle (not the control target) ties the cast to
    // real material motion. The authored stand-up arc ends at pi/2.
    lift=hinges.reduce((sum,n)=>sum+clamp(closed.angleTo(n.quaternion)/(Math.PI/2)),0)/hinges.length;
    root.userData.lift=lift;
    root.userData.hingeCount=hinges.length;
    root.userData.detent=Math.round(p*1000)/1000;
  }
  const load=(g:GLTF)=>{
    if(disposed){release(g.scene);return;}
    model=g.scene;
    try{
      const get=(n:string)=>{const x=model!.getObjectByName(n);if(!x)throw new Error('Missing F10 asset node '+n);return x;};
      const core=get('F10_A_RECEIVER_CORE');
      if(!(core instanceof THREE.Mesh))throw new Error('Missing F10 receiver mesh');
      // The Blender core uses an unlit black surface. Reassert black after
      // transport without replacing its exact cut geometry.
      for(const old of Array.isArray(core.material)?core.material:[core.material])old.dispose();
      core.material=new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false});
      const leaves=ids.map(i=>get('F10_A_LEAF_'+i));
      if(leaves.some(x=>!(x instanceof THREE.Mesh)))throw new Error('Missing F10 paper fin');
      hinges=ids.map(i=>get('F10_A_HINGE_'+i));
      for(const [i,hinge] of hinges.entries()){
        const pin=get('F10_A_AXIS_'+ids[i]);
        if(hinge.parent!==pin||leaves[i].parent!==hinge)throw new Error('Unrooted F10 paper fin');
      }
      const byName=new Map(g.animations.map(c=>[c.name,c]));
      mixer=new THREE.AnimationMixer(model);
      acts=hinges.map(n=>{
        const clip=byName.get(n.name);
        if(!clip||clip.tracks.length!==1||!clip.tracks[0].name.endsWith('.quaternion')||clip.duration<1.9)throw new Error('Invalid F10 hinge animation');
        const a=mixer!.clipAction(clip);a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();a.paused=true;return a;
      });
      // Blender donor center (-1.33, 0.61, 0.205), mapped to glTF Y-up.
      model.position.set(1.33,-.205,.61);
      model.traverse(n=>{
        if(n instanceof THREE.Mesh){
          n.castShadow=n!==core;
          n.receiveShadow=n!==core;
          for(const m of Array.isArray(n.material)?n.material:[n.material]){
            if(m instanceof THREE.MeshStandardMaterial&&bump&&n.geometry.getAttribute('uv')){m.bumpMap=bump;m.bumpScale=.004;}
          }
        }
      });
      hits.push(...leaves as THREE.Mesh[],core);
      for(const n of hits){
        n.userData={interactionType:'folioMechanism',worldId:9,slot:'A',label:'[A] Raise or fold the boundary collar'};
      }
      root.add(model);sample();
      root.userData.assetState='ready';
    }catch(error){
      root.userData.assetState='fallback';root.userData.failure=String(error);
      mixer?.stopAllAction();mixer?.uncacheRoot(model);release(model);model=null;mixer=null;hits.length=0;
    }
  };
  new GLTFLoader().load(url,load,undefined,error=>{if(!disposed){root.userData.assetState='fallback';root.userData.failure=String(error);}});
  return {
    root,hits,
    get lift(){return lift;},
    update(open:boolean,dt:number,reduced:boolean){
      if(!initialized||reduced)p=Number(open);
      else {
        const step=Math.max(0,dt)/1.26;
        p=open?Math.min(1,p+step):Math.max(0,p-step);
      }
      initialized=true;sample();
    },
    dispose(){
      disposed=true;mixer?.stopAllAction();
      if(model){mixer?.uncacheRoot(model);release(model);}
      model=null;mixer=null;hits.length=0;root.removeFromParent();
    },
  };
}
