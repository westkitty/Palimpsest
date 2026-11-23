import * as THREE from 'three';
import type { FolioRuntimeState } from '../../types/atlas';
import { authoredSlotMixer,createPortedPaperAsset } from './portedPaperAsset';

type Slot='A'|'C';
const fps=18;
const positionBetween=(at:number,to:number,delta:number)=>at+Math.sign(to-at)*Math.min(Math.abs(to-at),delta);

export function makeF12CandidateStage(ready:()=>void,failed:()=>void){
  const controls:THREE.Mesh[]=[];
  const art=createPortedPaperAsset<FolioRuntimeState>(
    'F12 • selected Blender horizon, separated claims and public archive hinge',
    ()=>import('./assets/palimpsest-f12.glb?url'),
    ({scene,animations})=>{
      scene.scale.setScalar(1.045);scene.position.y=.067;
      const get=(name:string)=>{
        const n=scene.getObjectByName(name);
        if(!n)throw new Error('missing F12 binding '+name);
        return n;
      };
      // The new cut-stock procession occupies the old printed-title zone.
      // Re-impose the same two original native type meshes as one line in the
      // untouched fore-margin, between the inert mark and binding footer.
      const title=get('Spread_title'),titleTail=get('Spread_title_second_line');
      title.position.z=1.82;
      titleTail.position.x=-1.25;
      titleTail.position.z=title.position.z;
      titleTail.scale.multiplyScalar(.82);
      const paperLeft=get('A__ClaimI'),paperRight=get('A__ClaimII');
      const crease=get('C__ArchivalCrease'),pin=get('C__FixedOriginalPin');
      get('C__PublicSyrinRecord');
      for(let i=1;i<=6;i++)get('F12__SignedNotJoinedLeaf0'+i);
      if(!['A__ClaimI','A__ClaimII','C__ArchivalCrease'].every(name=>animations.some(clip=>clip.name===name&&clip.tracks.length)))
        throw Error('missing F12 native action');
      scene.traverse(n=>{
        if(!(n instanceof THREE.Mesh))return;
        n.castShadow=true;n.receiveShadow=true;
        const control=/^Touch(?:Tab|Surface)_([ABC])(?:_|$)/.exec(n.name);
        if(control){
          n.userData.slot=control[1];controls.push(n);
        }
      });
      if(new Set(controls.map(n=>n.userData.slot)).size!==3)throw Error('F12 authored interactive surfaces missing');
      const player=authoredSlotMixer<Slot>(scene,animations,clip=>
        clip.name.startsWith('A__')?'A':clip.name==='C__ArchivalCrease'?'C':undefined,fps);
      const frames:Record<Slot,number>={A:1,C:1};
      let initialized=false;
      const origin=crease.position.clone(), fixedPin=pin.position.clone();
      return {update(state,dt,reduced){
        const step=Math.min(.07,Math.max(0,dt));
        const a=state.interactions.A.active?28:1,c=state.interactions.C.active?67:1;
        frames.A=!initialized||reduced?a:positionBetween(frames.A,a,step*30);
        // Play the reviewed native crease range at exhibition reading speed.
        frames.C=!initialized||reduced?c:positionBetween(frames.C,c,step*48);
        initialized=true;
        player.sample([['A',frames.A],['C',frames.C]]);
        Object.assign(art.root.userData,{
          claimFrame:frames.A,archiveFrame:frames.C,splitDistance:1.57+paperRight.position.x-paperLeft.position.x,
          archiveAngle:2*Math.atan2(crease.quaternion.x,crease.quaternion.w),horizonPieces:6,
          creaseFixed:crease.position.distanceToSquared(origin)<1e-8&&pin.position.distanceToSquared(fixedPin)<1e-8,
        });
      },dispose(){player.dispose();controls.length=0;}};
    },
    phase=>{if(phase==='ready')ready();else if(phase==='fallback'){controls.length=0;failed();}},
  );
  return {...art,controls};
}
