import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { FolioActions } from '../folioLogic';
import { foldedGlobe,REVISION_VAULT_TEMPLATES } from '../revisionEarlyArt';
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
  let label:THREE.CanvasTexture|null=null,source:THREE.Group|null=null,result:THREE.Group|null=null;
  let paintedFamily=-1,paintedGeneration=-1,frame=24,prevVault=false,previousGeneration=-1,phase=0,dead=false;
  const tempSource=new THREE.Group();const tempOutput=new THREE.Group();
  let outputAnchor:THREE.Object3D|null=null;
  const controls:THREE.Mesh[]=[];
  function key(name:string):string{return name.toLowerCase().replace(/[^a-z0-9]/g,'');}
  const b=Uint8Array.from(atob(f03Bytes),s=>s.charCodeAt(0));
  new GLTFLoader().parse(b.buffer,'',data=>{
    if(dead){disposeObject(data.scene);return;}
    asset=data.scene;
    // Blender/glTF native metres, fitted to the existing bound page and real page-turn corner hit area.
    asset.scale.setScalar(1.73);asset.position.set(0,-0.15,0);
    asset.traverse(n=>{if(n instanceof THREE.Mesh){n.castShadow=true;n.receiveShadow=true;}});
    root.add(asset);
    mixer=new THREE.AnimationMixer(asset);
    for(const clip of data.animations)mixer.clipAction(clip).setLoop(THREE.LoopOnce,0).play().clampWhenFinished=true;
    mixer.setTime(frame/15);
    outputAnchor=asset.children[0];
    asset.traverse(n=>{
      const id=key(n.name);
      if(id.startsWith('03worldoutputmounted'))outputAnchor=n;
      if(!(n instanceof THREE.Mesh))return;
      // Pick the physical authored mechanism meshes, not invisible overlay buttons.
      const slot=id.startsWith('templatepulltab')?'A':id.startsWith('wheeloverlay')?'B':id.startsWith('maincutpanel001')||id.startsWith('maindiecutpanel001')?'C':null;
      if(slot){n.userData.slot=slot;controls.push(n);}
    });
    asset.add(tempSource);outputAnchor?.add(tempOutput);
    tempSource.position.set(-1.80,.48,-.27);
    tempOutput.position.set(.62,.24,-.35);
    // Source/output proof is the actual Dossier-bound Three globe geometry, not a painted sphere.
    const c=document.createElement('canvas');c.width=720;c.height=142;
    label=new THREE.CanvasTexture(c);label.colorSpace=THREE.SRGBColorSpace;
    const title=new THREE.Mesh(new THREE.PlaneGeometry(1.48,.291),new THREE.MeshBasicMaterial({map:label,transparent:true,depthWrite:false}));
    title.name='Selected WorldsVault template';title.rotation.x=-Math.PI/2;title.position.set(-1.68,.208,.56);asset.add(title);
    root.userData.assetState='ready';
    ready();
  },()=>{root.userData.assetState='unavailable';if(!dead)fail();});
  function update(state:FolioActions,dt:number,reduced:boolean):void{
    if(!asset||!mixer||state.folio!==2)return;
    const s=state.f03;
    if(paintedFamily!==s.template||paintedGeneration!==s.generation){
      if(source)disposeObject(source);if(result)disposeObject(result);
      source=foldedGlobe(tempSource,s.template,0,.26,true);
      result=foldedGlobe(tempOutput,s.template,s.generation,.18,false);
      const c=label?.image as HTMLCanvasElement|undefined,ctx=c?.getContext('2d');
      if(c&&ctx){ctx.clearRect(0,0,720,142);ctx.font='600 49px Georgia';ctx.fillStyle='#efdbac';ctx.textAlign='center';ctx.fillText(REVISION_VAULT_TEMPLATES[s.template].name,360,73);ctx.fillStyle='#75c1bd';ctx.fillRect(115,89,490,3);label!.needsUpdate=true;}
      paintedFamily=s.template;paintedGeneration=s.generation;
    }
    if(source)source.visible=s.vaultOpen;
    if(result)result.visible=s.generation>0;
    if(previousGeneration!==s.generation&&previousGeneration!==-1)phase=1;
    previousGeneration=s.generation;
    if(prevVault!==s.vaultOpen&&s.vaultOpen)phase=Math.max(phase,.34);
    prevVault=s.vaultOpen;
    phase=Math.max(0,phase-(reduced?1:Math.max(dt,0)*1.01));
    const target=s.generation%2===1?54:s.generation>0?94:s.vaultOpen?33:24;
    frame=reduced?target:THREE.MathUtils.damp(frame,target,6.8,Math.min(dt,.07));
    mixer.setTime(frame/15);
    if(result)result.scale.setScalar(reduced?1:Math.max(.12,1-.87*phase));
    root.userData.template=REVISION_VAULT_TEMPLATES[s.template].name;
    root.userData.detent=s.generation;
    root.userData.frame=frame;
  }
  function dispose():void{
    dead=true;mixer?.stopAllAction();if(asset)mixer?.uncacheRoot(asset);
    label?.dispose();disposeObject(root);
  }
  return {root,update,dispose,controls};
}
