import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { FolioActions } from '../folioLogic';
import { makeF03PaperWorkshop } from './f03PaperWorkshop';
import f03Bytes from './f03CandidateData';

function disposeObject(obj:THREE.Object3D):void{
  const g=new Set<THREE.BufferGeometry>(),m=new Set<THREE.Material>();
  obj.traverse(node=>{
    if(!(node instanceof THREE.Mesh) && !(node instanceof THREE.Line))return;
    if(node.geometry)g.add(node.geometry);
    for(const a of Array.isArray(node.material)?node.material:[node.material])if(a)m.add(a);
  });
  g.forEach(x=>x.dispose());m.forEach(x=>x.dispose());
  obj.removeFromParent();
}
export function makeF03CandidateStage(ready:()=>void,fail:()=>void) {
  const root=new THREE.Group();root.name='F03 · approved Blender V03 proof';
  let asset:THREE.Group|null=null,mixer:THREE.AnimationMixer|null=null;
  let workshop:ReturnType<typeof makeF03PaperWorkshop>|null=null;
  let frame=24,dead=false;
  const controls:THREE.Mesh[]=[];
  function key(name:string):string{return name.toLowerCase().replace(/[^a-z0-9]/g,'');}
  const b=Uint8Array.from(atob(f03Bytes),s=>s.charCodeAt(0));
  new GLTFLoader().parse(b.buffer,'',data=>{
    if(dead){disposeObject(data.scene);return;}
    asset=data.scene;
    // Blender native metres fitted to the existing page-turn corner. Keep
    // the entire accepted source stage and all of its original linkage clips.
    asset.scale.setScalar(1.73);asset.position.set(0,-0.15,0);
    asset.traverse(n=>{
      if(!(n instanceof THREE.Mesh))return;
      n.castShadow=true;n.receiveShadow=true;
      const id=key(n.name);
      // Omit only the two printed instruction captions. The mechanism itself
      // tells the story, and the original titles and accessibility cues stay.
      if(id==='01sourcetemplate'||id==='02turnthepaperdie')n.visible=false;
      const slot=id.startsWith('templatepulltab')?'A':id.startsWith('wheeloverlay')?'B':
        id.startsWith('maincutpanel001')||id.startsWith('maindiecutpanel001')?'C':null;
      if(slot){n.userData.slot=slot;controls.push(n);}
    });
    root.add(asset);
    mixer=new THREE.AnimationMixer(asset);
    for(const clip of data.animations)mixer.clipAction(clip).setLoop(THREE.LoopOnce,0).play().clampWhenFinished=true;
    mixer.setTime(frame/15);
    workshop=makeF03PaperWorkshop();asset.add(workshop.root);
    workshop.root.traverse(n=>{
      if(!(n instanceof THREE.Mesh))return;
      const slot=n.name==='Planar selected sleeve door'?'A':n.name==='Raised press handle'||n.name==='Dark folded press block'?'C':null;
      if(slot){n.userData.slot=slot;controls.push(n);}
    });
    root.userData.assetState='ready';
    ready();
  },()=>{root.userData.assetState='unavailable';if(!dead)fail();});
  function update(state:FolioActions,dt:number,reduced:boolean):void{
    if(!asset||!mixer||!workshop||state.folio!==2)return;
    const s=state.f03;
    workshop.update(s,dt,reduced);
    const target=s.generation%2===1?54:s.generation>0?94:s.vaultOpen?33:24;
    frame=reduced?target:THREE.MathUtils.damp(frame,target,6.8,Math.min(dt,.07));
    mixer.setTime(frame/15);
    Object.assign(root.userData,workshop.root.userData,{detent:s.generation,frame});
  }
  function dispose():void{
    dead=true;mixer?.stopAllAction();if(asset)mixer?.uncacheRoot(asset);
    workshop?.dispose();disposeObject(root);
  }
  return {root,update,dispose,controls};
}
