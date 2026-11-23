import * as THREE from 'three';
import type { FolioRuntimeState, DraxisId } from '../../types/atlas';
import { buildDraxisModel, type DraxisRig } from '../../engine/drakken/DraxisModels';
import { F06_CAMPAIGN_DRAXIS_IDS, DRAXIS_BY_ID } from '../../story/draxisCatalog';
import { authoredSlotMixer, createPortedPaperAsset } from './portedPaperAsset';

export const F06_ERAS = ['7–30','31–60','61–90','91–120'] as const;
const fps=18;
const approach=(value:number,target:number,velocity:number)=>
  value+Math.sign(target-value)*Math.min(Math.abs(target-value),velocity);

export function f06CandidateSelection(state:FolioRuntimeState) {
  const clamp=(n:number,to:number)=>Number.isFinite(n)?Math.max(0,Math.min(Math.floor(n),to)):0;
  const era=clamp(state.interactions.A.step,3);
  const plate=clamp(state.selectedCampaignIndex,6);
  return {era, specimenId:F06_CAMPAIGN_DRAXIS_IDS[plate], open:state.interactions.C.active};
}

function slip(anchor:THREE.Object3D,width:number,depth:number,bordered:boolean) {
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=160;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('F06 archival paper printing unavailable');
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:!bordered,
    color:0xffffff,toneMapped:false,side:THREE.DoubleSide});
  const face=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),material);
  face.rotation.x=-Math.PI/2;face.position.y=.006;
  face.renderOrder=1;
  anchor.add(face);
  if(bordered){
    const stock=new THREE.Mesh(new THREE.BoxGeometry(width+.035,.018,depth+.027),new THREE.MeshStandardMaterial({
      color:0x60503e,roughness:.88,
    }));
    stock.position.y=-.005;anchor.add(stock);
  }
  let printed='';
  return (text:string)=>{
    if(text===printed)return;printed=text;
    ctx.clearRect(0,0,640,160);
    if(bordered){
      ctx.fillStyle='#262229';ctx.fillRect(0,0,640,160);
      ctx.strokeStyle='#ad8c5a';ctx.lineWidth=8;ctx.strokeRect(10,10,620,140);
      ctx.strokeStyle='#665039';ctx.lineWidth=2;ctx.strokeRect(23,23,594,114);
    }
    ctx.fillStyle='#eedcb9';ctx.font='bold 67px Georgia, serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(text,320,84,bordered?580:634);
    texture.needsUpdate=true;
  };
}
function disposeSpecimen(rig:DraxisRig) {
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  rig.group.removeFromParent();rig.group.traverse(n=>{
    if(!(n instanceof THREE.Mesh))return;
    geometries.add(n.geometry);
    (Array.isArray(n.material)?n.material:[n.material]).forEach(m=>materials.add(m));
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  // A DRAXIS rig can reference shared papercraft maps; do not dispose those.
}

export function makeF06CandidateStage(bump:THREE.Texture, ready:()=>void, failed:()=>void) {
  const controls:THREE.Mesh[]=[];
  const art=createPortedPaperAsset<FolioRuntimeState>(
    'F06 • reviewed Blender Long Attrition instrument',
    ()=>import('./assets/palimpsest-f06.glb?url'),
    data=>{
      const model=data.scene;
      model.scale.setScalar(1.085);
      model.position.y=.065;
      const get=(name:string)=>{
        const obj=model.getObjectByName(name);
        if(!obj)throw new Error('missing F06 binding '+name);
        return obj;
      };
      const wheel=get('A__ChronologyWheel');
      const seat=get('B__SourceSpecimenSeat');
      const cradle=get('B__SpecimenCradle');
      const indexSlip=get('A__LiveEraSlipAnchor');
      const ledgerInk=get('C__LiveEraInkAnchor');
      const specimenInk=get('B__LiveSpecimenNameAnchor');
      const blankCell=get('C__BlankCasualtyCell');
      const levers=['TouchTab_A_Wheel','TouchTab_B_Cradle','TouchTab_C_Pull'] as const;
      const leaves=[1,2,3,4,5,6].map(i=>get('C__LedgerLeaf0'+i));
      const channels=authoredSlotMixer<'A'|'B'|'C'>(model,data.animations,clip=>{
        if(clip.name==='A__ChronologyWheel')return 'A';
        if(clip.name==='B__SpecimenCradle')return 'B';
        if(/^C__LedgerLeaf0[1-6]$/.test(clip.name))return 'C';
      },fps);
      if(!channels.has('A')||!channels.has('B')||
        data.animations.filter(clip=>/^C__LedgerLeaf0[1-6]$/.test(clip.name)).length!==6)
        throw new Error('incomplete authored F06 transform tracks');
      model.traverse(n=>{if(n instanceof THREE.Mesh){n.castShadow=true;n.receiveShadow=true;}});
      const ledger=new THREE.Group();
      ledger.name='F06 native six-sheet ledge, isolated era jog';
      const ledgerParent=leaves[0].parent;
      if(!ledgerParent||!leaves.every(n=>n.parent===ledgerParent))
        throw new Error('F06 six native hinges do not share the reviewed substrate');
      ledgerParent.add(ledger);leaves.forEach(leaf=>ledger.add(leaf));
      const wheelParent=wheel.parent;
      if(!wheelParent)throw new Error('F06 chronology wheel lost its fixed axle');
      const coarseWheel=new THREE.Group();
      coarseWheel.name='F06 four-detent chronology indexing collar';
      coarseWheel.position.copy(wheel.position);
      wheelParent.add(coarseWheel);coarseWheel.add(wheel);wheel.position.set(0,0,0);
      for(const name of levers){
        const mesh=get(name);
        if(!(mesh instanceof THREE.Mesh))throw new Error('missing physical F06 mechanism mesh');
        mesh.userData.slot=name.split('_')[1];controls.push(mesh);
      }
      const printIndex=slip(indexSlip,1.02,.21,true);
      const printEra=slip(ledgerInk,1.13,.17,false);
      const printSpecimen=slip(specimenInk,1.73,.21,false);
      const initialSlip=indexSlip.position.x;
      let specimen:DraxisRig|undefined, currentId:DraxisId|undefined, elapsed=0;
      let era=-1, target=0, wheelTravel=0, cFrame=69, bFrame=45, jog=0;
      return {
        update(state,dt,reduced){
          const s=f06CandidateSelection(state);
          const time=Math.min(.07,Math.max(0,dt));
          const first=era<0;
          if(first){target=s.era;wheelTravel=target;cFrame=s.open?111:69;bFrame=s.specimenId==='003'?45:66;}
          else if(s.era!==era){target+=(s.era-era+4)%4;jog=reduced?0:.43;}
          era=s.era;
          wheelTravel=reduced?target:approach(wheelTravel,target,time*2.5);
          cFrame=reduced?(s.open?111:69):approach(cFrame,s.open?111:69,time*43);
          if(currentId!==s.specimenId){
            if(specimen)disposeSpecimen(specimen);
            currentId=s.specimenId;
            specimen=buildDraxisModel(currentId,bump);
            specimen.group.name='F06 authored catalog '+currentId;
            specimen.group.scale.setScalar(1.05);
            seat.add(specimen.group);
            if(!first&&!reduced)bFrame=45;
          }
          bFrame=reduced?(s.specimenId==='003'?45:66):approach(bFrame,s.specimenId==='003'?45:66,time*42);
          const coarse=Math.floor(wheelTravel);
          const moving=wheelTravel-coarse;
          channels.sample([['A',moving===0?1:8+moving*34],['B',bFrame],['C',cFrame]]);
          coarseWheel.rotation.y=-(coarse%4)*Math.PI/2;
          jog=reduced?0:Math.max(0,jog-time);
          const signal=jog/.43;
          const ripple=.048*signal*Math.sin((1-signal)*21);
          ledger.position.set(ripple*.35,Math.abs(ripple)*.78,ripple);
          indexSlip.position.x=initialSlip+ripple*1.3;
          const eraText=F06_ERAS[s.era];
          printIndex('YEARS '+eraText);
          printEra('YEARS '+eraText);
          printSpecimen(currentId+'  '+DRAXIS_BY_ID[currentId].name.toUpperCase());
          elapsed+=reduced?0:time;
          specimen?.animate(elapsed,!reduced);
          Object.assign(art.root.userData,{
            era:eraText,ledgerEra:eraText,specimenId:currentId,cFrame,ledgerOpen:s.open,
            wheelDetent:target%4,ledgerJiggle:ripple,nativeLedgerLeaves:leaves.length,
            authoredBlankCasualtyCell:blankCell.visible,authoredCradleYaw:cradle.rotation.y,
          });
        },
        dispose(){if(specimen)disposeSpecimen(specimen);channels.dispose();controls.length=0;},
      };
    },
    phase=>{if(phase==='ready')ready();else if(phase==='fallback'){controls.length=0;failed();}},
  );
  return {...art,controls};
}
