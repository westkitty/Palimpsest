import * as THREE from 'three';
import type { FolioRuntimeState } from '../../types/atlas';
import { createF07Environment } from './f07Environment';
import { authoredSlotMixer, createPortedPaperAsset, paperKey } from './portedPaperAsset';

const slots=['A','B','C'] as const;
type Slot=(typeof slots)[number];
const fps=24;
const endFrames:Record<Slot,number>={A:36,B:34,C:34};
const targetNames={
  hinge:'A__PlanHinge',vellum:'F07_PlanVellum',outcome:'B__OutcomeRise',
  arm:'C__SupplyArm',gear:'C__SupplyGear',
} as const;
const scale=1.51;

export function makeF07CandidateStage(phase:(value:'loading'|'ready'|'fallback')=>void){
  const controls:THREE.Mesh[]=[];
  const audit:Record<string,number>={};
  const stage=createPortedPaperAsset<FolioRuntimeState>(
    'F07 • Blender siege board / vellum / cost card',
    ()=>import('./assets/palimpsest-f07.glb?url'),
    ({scene,animations})=>{
      scene.scale.setScalar(scale);scene.position.y=.09;
      const tags=Object.fromEntries(Object.entries(targetNames).map(([key,name])=>[key,scene.getObjectByName(name)])) as
        Record<keyof typeof targetNames,THREE.Object3D|undefined>;
      const {hinge,vellum,outcome,arm,gear}=tags;
      if(!hinge||!(vellum instanceof THREE.Mesh)||!outcome||!arm||!gear)throw Error('F07 native paper nodes missing');
      const transparent=(Array.isArray(vellum.material)?vellum.material:[vellum.material]).every(m=>m.transparent&&m.opacity>0&&m.opacity<1);
      if(!transparent)throw Error('F07 vellum is not translucent');
      scene.traverse(node=>{
        if(!(node instanceof THREE.Mesh))return;
        node.castShadow=node!==vellum;node.receiveShadow=node!==vellum;
        const slot=/^TouchTab_([ABC])$/.exec(node.name);
        if(slot){node.userData.slot=slot[1];controls.push(node);}
      });
      if(new Set(controls.map(node=>node.userData.slot)).size!==3)throw Error('F07 touch tabs missing');
      // Keep the documented die-cut control itself tappable as well as the
      // three margin tabs. Bind only solid surfaces that drive an authored slot.
      const touch=(node:THREE.Object3D,slot:Slot)=>{
        if(node instanceof THREE.Mesh){node.userData.slot=slot;controls.push(node);}
      };
      touch(vellum,'A');
      outcome.traverse(n=>{if(paperKey(n.name).startsWith('bfixedoutcomeplatelayeredblackstockblank'))touch(n,'B');});
      arm.traverse(n=>{if(/^(cfixedbrasssupplyarm|cpinnedsupplyend)$/.test(paperKey(n.name)))touch(n,'C');});
      if(!Object.values(targetNames).filter(name=>name!=='F07_PlanVellum').every(name=>animations.some(clip=>clip.name===name&&clip.tracks.length)))
        throw Error('F07 native animation clips missing');
      const player=authoredSlotMixer<Slot>(scene,animations,clip=>{
        const slot=clip.name[0] as Slot;
        return slots.includes(slot)&&clip.name.startsWith(slot+'__')?slot:undefined;
      },fps);
      const opaqueRails=hinge.children.filter((n):n is THREE.Mesh=>n instanceof THREE.Mesh&&
        /^(aclippedstockedgerail|afrontpulledge|afoldedfingerpulltab)/.test(paperKey(n.name)));
      if(opaqueRails.length!==4)throw Error('F07 opaque casting frame incomplete');
      const field=createF07Environment(scene,opaqueRails);
      const frames:Record<Slot,number>={A:1,B:1,C:1};
      let initialized=false;
      const angle=(object:THREE.Object3D,axis:'x'|'y')=>2*Math.atan2(object.quaternion[axis],object.quaternion.w);
      return {
        update(state,dt,reduced){
          const step=Math.min(.07,Math.max(0,dt))*fps;
          for(const slot of slots){
            const to=state.interactions[slot].active?endFrames[slot]:1;
            frames[slot]=!initialized||reduced?to:frames[slot]+Math.sign(to-frames[slot])*Math.min(Math.abs(to-frames[slot]),step);
          }
          initialized=true;player.sample(slots.map(slot=>[slot,frames[slot]]));
          const planAngle=angle(hinge,'x'),outcomeLift=(outcome.position.y-.105)*scale;
          const environment=field.update(planAngle,outcomeLift);
          Object.assign(audit,{
            planAngle,outcomeLift,fieldOpen:environment.open,rubyShadow:environment.shadow,costReading:environment.cost,
            armAngle:angle(arm,'y'),gearAngle:angle(gear,'y'),
            frameA:frames.A,frameB:frames.B,frameC:frames.C,
          });
        },
        dispose:()=>{player.dispose();field.dispose();},
      };
    },
    phase,
  );
  return {...stage,controls,audit};
}
