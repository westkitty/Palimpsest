import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createF04Environment } from './f04Environment';
import { paperKey } from './portedPaperAsset';
import type { FolioRuntimeState } from '../../types/atlas';

const fps=24, start=1, colonyEnd=31, routeEnd=38, foldEnd=28;
const slots=['A','B','C'] as const;
type Slot=(typeof slots)[number];
const between=(current:number,target:number,step:number)=>current+Math.sign(target-current)*Math.min(Math.abs(target-current),step);
export function nextExpansionFrame(frame:number,active:boolean,dt:number,reduced:boolean):number {
  if(!active)return frame;
  return reduced?routeEnd:Math.min(routeEnd,frame+fps*Math.min(.07,Math.max(0,dt)));
}

function disposeAsset(root:THREE.Object3D):void{
  const geometry=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  root.traverse(n=>{if(n instanceof THREE.Mesh){
    geometry.add(n.geometry);
    for(const m of Array.isArray(n.material)?n.material:[n.material]){
      materials.add(m);
      for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v);
    }
  }});
  root.removeFromParent();
  geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}

export function makeF04CandidateStage(
  savedFrame:number|null,
  recordFrame:(current:number)=>void,
  ready:()=>void,
  failed:()=>void,
){
  const root=new THREE.Group();
  root.name='F04 • actual Blender colony, expansion and logistics';
  root.userData.assetState='loading';
  const controls:THREE.Mesh[]=[];
  const channels:Record<Slot,THREE.AnimationAction[]>={A:[],B:[],C:[]};
  const lamps:THREE.Object3D[]=[];
  const echo:THREE.Object3D[]=[];
  let disposed=false, initialized=false;
  let model:THREE.Group|null=null;
  let environment:ReturnType<typeof createF04Environment>|null=null;
  let mixer:THREE.AnimationMixer|null=null;
  let colonyFrame=start, expansionFrame=savedFrame??start, foldFrame=start;
  const refuse=()=>{
    if(disposed)return;
    environment?.dispose();environment=null;
    mixer?.stopAllAction();if(model){mixer?.uncacheRoot(model);disposeAsset(model);}
    mixer=null;model=null;controls.length=0;
    root.userData.assetState='unavailable';failed();
  };
  void import('./assets/palimpsest-f04.glb?url').then(async reference=>{
    if(disposed)return;
    const data=await new GLTFLoader().loadAsync(reference.default);
    if(disposed){disposeAsset(data.scene);return;}
    model=data.scene;
    model.scale.setScalar(1.51);model.position.y=.09;
    mixer=new THREE.AnimationMixer(model);
    const clipNames=new Set<string>();
    for(const clip of data.animations){
      const slot=clip.name[0] as Slot;
      if(!slots.includes(slot)||!clip.name.startsWith(slot+'__')||clip.duration<1.5||!clip.tracks.length)continue;
      clipNames.add(clip.name);
      const action=mixer.clipAction(clip).setLoop(THREE.LoopOnce,1).play();
      action.paused=true;action.clampWhenFinished=true;channels[slot].push(action);
    }
    model.traverse(n=>{
      if(/^B__Lamp0[1-5]$/.test(n.name))lamps.push(n);
      if(/^B__Echo0[1-5]$/.test(n.name))echo.push(n);
      if(!(n instanceof THREE.Mesh))return;
      n.castShadow=true;n.receiveShadow=true;
      const hit=/^TouchTab_([ABC])$/.exec(n.name);
      if(hit){n.userData.slot=hit[1];controls.push(n);}
    });
    if(!clipNames.has('A__ColonyCardAndLift')||channels.A.length!==1||
      channels.B.length!==13||channels.C.length!==6||lamps.length!==5||echo.length!==5||
      new Set(controls.map(n=>n.userData.slot)).size!==3){refuse();return;}
    const colony=model.getObjectByName('A__ColonyCardAndLift');
    if(!colony){refuse();return;}
    lamps.sort((a,b)=>a.name.localeCompare(b.name));
    environment=createF04Environment(model,colony,lamps);
    model.traverse(n=>{
      if(!(n instanceof THREE.Mesh))return;
      const k=paperKey(n.name);
      if(k==='agreenprintedterrace'||k==='areversescarredundersidemodelednotshowninconlyrehearsal')n.userData.slot='A';
      else if(k.startsWith('f04darkfacetedplanetarymarker')||k.startsWith('scoredlowpaperrouterail'))n.userData.slot='B';
      else if(k.startsWith('cactualblackcardstockpanel'))n.userData.slot='C';
      else return;
      controls.push(n);
    });
    root.add(model);root.userData.assetState='ready';ready();
  }).catch(refuse);

  function update(state:FolioRuntimeState,dt:number,reduced:boolean){
    if(root.userData.assetState!=='ready'||!mixer)return;
    const {A,B,C}=state.interactions;
    const d=fps*Math.min(.07,Math.max(0,dt));
    const a=A.active?colonyEnd:start,c=C.active?foldEnd:start;
    colonyFrame=reduced||!initialized?a:between(colonyFrame,a,d);
    foldFrame=reduced||!initialized?c:between(foldFrame,c,d);
    if(!initialized){
      // Stored teaching state remains authoritative across actual reloads;
      // the within-session intermediate pointer also preserves a paused visit.
      if(savedFrame===null&&B.active)expansionFrame=routeEnd;
      initialized=true;
    }
    expansionFrame=nextExpansionFrame(expansionFrame,B.active,dt*.57,reduced);
    recordFrame(expansionFrame);
    const t={A:colonyFrame/fps,B:expansionFrame/fps,C:foldFrame/fps};
    for(const slot of slots)for(const action of channels[slot])action.time=t[slot];
    mixer.update(0);
    Object.assign(root.userData,{
      colonyFrame, expansionFrame, foldFrame,...environment?.update(expansionFrame),
      litPlanets:lamps.filter(l=>l.scale.x>.9).length,
      litEchoes:echo.filter(l=>l.scale.x>.9).length,
      expansion:expansionFrame>=routeEnd?'complete':B.active?'advancing':'held',
    });
  }
  function dispose(){
    disposed=true;
    environment?.dispose();environment=null;
    mixer?.stopAllAction();if(model){mixer?.uncacheRoot(model);disposeAsset(model);}
    mixer=null;model=null;controls.length=0;
  }
  return {root,controls,update,dispose};
}
