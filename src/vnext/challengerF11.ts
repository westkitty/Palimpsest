import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import assetUrl from './assets/palimpsest-f11-challenger.glb.gz?url';
import motion from './assets/palimpsest-f11-motion.json';

const cues: [number,number][]=[[0,1],[0.38,11],[1.35,34],[2.65,55],[5.58,99],[6.84,112],[7.22,129],[8.80,180]];
export function f11BlenderFrame(t:number):number {
  for(let i=1;i<cues.length;i++){
    const [hi,hiFrame]=cues[i], [lo,loFrame]=cues[i-1];
    if(t<=hi)return THREE.MathUtils.lerp(loFrame,hiFrame,THREE.MathUtils.clamp((t-lo)/(hi-lo),0,1));
  }
  return motion.last;
}
export function f11StoryPhase(frame:number):string {
  if(frame<11)return 'barren';
  if(frame<34)return 'codec';
  if(frame<55)return 'marcel';
  if(frame<99)return 'jungle-growing';
  if(frame<112)return 'jungle-hold';
  if(frame<129)return 'tiger-arrival';
  return 'emotional-split';
}
function destroy(g:THREE.Group):void {
  const geometry=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>();
  g.traverse(node=>{if(node instanceof THREE.Mesh){geometry.add(node.geometry);for(const m of Array.isArray(node.material)?node.material:[node.material])materials.add(m);}});
  geometry.forEach(v=>v.dispose());materials.forEach(v=>v.dispose());g.removeFromParent();
}
function rotateIdle(node:THREE.Object3D,angle:number[],weight:number):void{
  // glTF's Y-up basis is Blender (x,z,-y). Convert the composed authored Euler, not the angle components.
  const from=new THREE.Quaternion().setFromEuler(new THREE.Euler(angle[0],angle[1],angle[2],'XYZ'));
  node.quaternion.set(from.x,from.z,-from.y,from.w);
  node.quaternion.slerp(IDLE_REST,1-weight);
}
const IDLE_REST=new THREE.Quaternion();
const eyeNames=['L','R'].flatMap(side=>['SLIT','UPPER','LOWER'].map(kind=>`TIGER_EYE_${side}_${kind}`));

export function createF11Challenger(pageY:(x:number)=>number){
  const root=new THREE.Group();root.name='F11 dimensional Blender challenger';
  root.userData.assetState='loading';
  let disposed=false,scene:THREE.Group|null=null,mixer:THREE.AnimationMixer|null=null;
  let actions:THREE.AnimationAction[]=[];
  const idles: Array<{node:THREE.Object3D;motion:typeof motion.idles[keyof typeof motion.idles]}>=[];
  const eyes:THREE.Mesh[]=[];
  const anchors:THREE.Object3D[]=[];
  let elapsed=0,idleTime=0, reduced=false,lastRender=0;
  function sample(){
    if(!scene||!mixer)return;
    const frame=f11BlenderFrame(elapsed), seconds=(frame-1)/motion.fps;
    for(const a of actions)a.time=Math.min(seconds,a.getClip().duration);
    mixer.update(0);
    const storyIndex=THREE.MathUtils.clamp(Math.round(frame)-1,0,motion.last-1);
    const tick=Math.floor(idleTime*motion.fps);
    for(const spec of idles){
      const frames=spec.motion.samples;
      const index=Math.max(tick-spec.motion.offset,0)%(frames.length-1);
      rotateIdle(spec.node,frames[index],reduced?0:spec.motion.weights[storyIndex]);
    }
    const blink=motion.eyes.Face_Idle;
    for(const [i,eye] of eyes.entries()){
      const afterEntry=Math.max(0,tick-122), pose=blink[afterEntry%(blink.length-1)];
      if(eye.morphTargetInfluences)eye.morphTargetInfluences[0]=reduced||frame<123?0:pose[Math.floor(i/3)];
    }
    for(const [i,node] of anchors.entries()){
      node.visible=i===0?frame>=11:i===1?frame>=34:i===2?frame>=112:i===3?frame>=33&&frame<85:frame>=55;
    }
    root.userData.phase=f11StoryPhase(frame);
    root.userData.frame=Math.round(frame);
    root.userData.codecSad=frame>=141;
    root.userData.mature=frame>=99;
  }
  const load=(gltf:GLTF)=>{
    if(disposed){destroy(gltf.scene);return;}
    scene=gltf.scene;
    try {
      const get=(name:string)=>{const found=scene!.getObjectByName(name);if(!found)throw new Error('Missing Blender F11 node '+name);return found;};
      if(gltf.animations.length<160)throw new Error('F11 is missing authored motion tracks');
      const move=(node:THREE.Object3D,x:number,y:number,z:number, scale:number)=>{
        const parent=node.parent!;
        const outer=new THREE.Group(); outer.name=node.name+'_PAGE_MOUNT';
        outer.scale.setScalar(scale);
        outer.position.set(x-node.position.x*scale,y-node.position.y*scale,z-node.position.z*scale);
        parent.add(outer);outer.add(node);
        return outer;
      };
      for(const [name,x,z,scale] of [['ACTOR_CODEC',-1.29,0.32,0.64],['ACTOR_MARCEL',0.74,0.38,0.70],['ACTOR_TIGER',1.80,0.56,0.74]] as const){
        anchors.push(move(get(name),x,pageY(x)+0.025,z,scale));
      }
      anchors.push(move(get('MARCEL_EFFECT'),0.74,pageY(0.74)+0.40,0.38,0.60));
      for(let i=0;i<27;i++){
        const p=get('PLANT_'+String(i).padStart(2,'0'));
        const x=p.position.x*.63,z=p.position.z*.67;
        anchors.push(move(p,x,pageY(x)+.018,z,.64));
      }
      move(get('ROOT_REGISTER'),-1.85,pageY(-1.85)+.014,1.05,.78);
      for(const [name,source] of Object.entries(motion.idles))idles.push({node:get(name),motion:source});
      for(const name of eyeNames){
        const node=get(name);
        if(!(node instanceof THREE.Mesh)||node.morphTargetInfluences?.length!==1)throw new Error('Tiger eye morph unavailable: '+name);
        eyes.push(node);
      }
      scene.traverse(o=>{
        if(!(o instanceof THREE.Mesh))return;
        o.receiveShadow=true;
        // Very many fine leaf edges need not multiply the scene's shadow draws.
        const list=Array.isArray(o.material)?o.material:[o.material];
        o.castShadow=!list.some(m=>m.transparent||m.name.includes('Dyed uncoated paper'));
        for(const m of list)if(m.transparent)m.depthWrite=false;
      });
      mixer=new THREE.AnimationMixer(scene);
      const idleNames=new Set(Object.keys(motion.idles));
      for(const clip of gltf.animations){
        if(idleNames.has(clip.name)||!/^ACTOR_|^PLANT_|^STEM_|^FROND_|^WORDSTREAM_|^ROOT_TRACE$|^MARCEL_EFFECT$|_(?:BODY|HEAD)_STORY$/.test(clip.name))continue;
        const clean=clip.tracks.filter(t=>!idleNames.has(t.name.split('.')[0]));
        if(!clean.length)continue;
        const play=mixer.clipAction(new THREE.AnimationClip(clip.name,clip.duration,clean));
        play.setLoop(THREE.LoopOnce,1);play.clampWhenFinished=true;play.play();play.paused=true;actions.push(play);
      }
      root.add(scene);elapsed=0;idleTime=0;lastRender=0;sample();
      root.userData.assetState='ready';
    } catch(error){
      root.userData.assetState='fallback';
      root.userData.failure=String(error);
      mixer?.stopAllAction();destroy(scene);scene=null;mixer=null;actions=[];
    }
  };
  void (async()=>{
    const response=await fetch(assetUrl);
    if(!response.ok)throw new Error(`F11 asset HTTP ${response.status}`);
    let bytes=await response.arrayBuffer();
    const head=new Uint8Array(bytes,0,2);
    if(head[0]===0x1f&&head[1]===0x8b){
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      bytes=await new Response(stream).arrayBuffer();
    }
    if(!disposed)load(await new GLTFLoader().parseAsync(bytes,''));
  })().catch(error=>{
    if(!disposed){root.userData.assetState='fallback';root.userData.failure=String(error);}
  });
  return {
    root,
    update(dt:number,prefersReduced:boolean){
      if(root.userData.assetState!=='ready')return;
      // The shared book limits its animation dt to 60ms for springs. Use a
      // capped mount clock for staging so an expensive first render cannot
      // stretch this story to minutes. A background tab resumes incrementally.
      const now=performance.now();
      const step=lastRender?Math.min(Math.max(0,(now-lastRender)/1000),.65):Math.max(0,dt);
      lastRender=now;
      const next=Math.min(9,elapsed+step);
      // Do not skip even a short dramatic beat when presenting on a slow GPU.
      const boundary=cues.find(([at])=>at>elapsed+1e-6&&at<=next);
      elapsed=boundary ? boundary[0]+1e-6 : next;
      idleTime+=step;reduced=prefersReduced;sample();
    },
    dispose(){
      disposed=true;mixer?.stopAllAction();
      if(scene){mixer?.uncacheRoot(scene);destroy(scene);}
      scene=null;actions=[];root.removeFromParent();
    },
  };
}
