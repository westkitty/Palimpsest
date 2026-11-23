import * as THREE from 'three';
import type { FolioRuntimeState } from '../../types/atlas';
import {f08CueClock,f08Cue,f08LeafTravel} from '../f08Motion.ts';
import { authoredSlotMixer,createPortedPaperAsset } from './portedPaperAsset.ts';

type Slot = 'A'|'B'|'C';
type Part = 'AL'|'AR'|'B'|'C1'|'C2'|'C3'|'C4'|'CMeta';
const slots=['A','B','C'] as const;
const ranges={A:[16,40],B:[65,88],C:[103,153]} as const;
const counts={A:2,B:22,C:5};
const key=(slot:Slot)=>'F08_BLENDER_SLOT_'+slot;
export function makeF08CandidateStage(onReady:()=>void,onFail:()=>void){
  const stage=createPortedPaperAsset<FolioRuntimeState>(
    'F08 · Blender shutters, fracture and twenty-ring accordion',
    ()=>import('./assets/palimpsest-f08-challenger.glb?url'),
    gltf=>{
      const model=gltf.scene;
      const rings:THREE.Object3D[]=[];
      const hits:THREE.Object3D[]=[];
      model.traverse(n=>{
        if(/^C_world_\d\d.*opaque_crimson_Blood_Ring$/.test(n.name))rings.push(n);
        if(n instanceof THREE.Mesh){n.castShadow=true;n.receiveShadow=true;}
        if(/^B_.*paper_assumption_comparator_assembly$/.test(n.name))n.position.x+=.47;
        // The source fracture profile was centered on the flat Tiger emblem.
        // Seat the exact fragments at the original 3D Tiger's Living-only plinth,
        // not over the separate functional Hookshot aperture.
        if(n.name.startsWith('B_low_crimson_fracture_band_fragment')&&n.parent?.name.startsWith('F08_B_VIS_')){
          n.parent.position.add(new THREE.Vector3(-1.51,-.40,1.52));
        }
        const slot = /^(Opaque_lower_shield_plate|Shield_crossrail_bridge)/.test(n.name)?'A'
          : /^(F08_B_SLIDER|Assumption_comparator_backing_card)/.test(n.name)?'B'
          : /^(Black_laminated_accordion_card|Side-on_scored_anchor_root)/.test(n.name)?'C':undefined;
        if(slot){n.userData.slot=slot;hits.push(n);}
      });
      if(rings.length!==20)throw new Error('F08 approved twenty-world ring set incomplete: '+rings.length);
      const targets=new Set<string>();
      for(const slot of slots){
        const clip=gltf.animations.find(a=>a.name===key(slot));
        if(!clip || clip.tracks.length!==counts[slot])throw new Error('F08 approved native clip incomplete: '+slot);
        for(const track of clip.tracks){
          if(targets.has(track.name))throw new Error('F08 native slot overlaps another: '+track.name);
          targets.add(track.name);
        }
      }
      // Split PLAYBACK into two native A shutters and four true C leaves.
      // The source curves/GLB and every target node stay exactly the same.
      const clip=(slot:Slot)=>gltf.animations.find(a=>a.name===key(slot))!;
      const parts: Record<Part,THREE.AnimationClip>={
        AL:new THREE.AnimationClip('AL',clip('A').duration,clip('A').tracks.filter(t=>t.name.startsWith('F08_SHUTTER_L.'))),
        AR:new THREE.AnimationClip('AR',clip('A').duration,clip('A').tracks.filter(t=>t.name.startsWith('F08_SHUTTER_R.'))),
        B:new THREE.AnimationClip('B',clip('B').duration,clip('B').tracks),
        C1:new THREE.AnimationClip('C1',clip('C').duration,clip('C').tracks.filter(t=>t.name.startsWith('F08_C_LEAF_1.'))),
        C2:new THREE.AnimationClip('C2',clip('C').duration,clip('C').tracks.filter(t=>t.name.startsWith('F08_C_LEAF_2.'))),
        C3:new THREE.AnimationClip('C3',clip('C').duration,clip('C').tracks.filter(t=>t.name.startsWith('F08_C_LEAF_3.'))),
        C4:new THREE.AnimationClip('C4',clip('C').duration,clip('C').tracks.filter(t=>t.name.startsWith('F08_C_LEAF_4.'))),
        CMeta:new THREE.AnimationClip('CMeta',clip('C').duration,clip('C').tracks.filter(t=>t.name.startsWith('F08_C_VIS_'))),
      };
      if(Object.values(parts).some(p=>!p.tracks.length))throw new Error('F08 original leaf/hinge tracks not independently reachable');
      const mixer=authoredSlotMixer<Part>(model,Object.values(parts),c=>c.name as Part,24);
      let initial=true, cueTime=0, wasOn=false;
      const frames:{[K in Slot]:number}={A:1,B:1,C:1};
      const current={B:0,C:0};
      const at=(slot:Slot,p:number)=>p<=0?1:ranges[slot][0]+(ranges[slot][1]-ranges[slot][0])*p;
      return {update(state,dt,reduced){
        const on=state.interactions.A.active;
        cueTime=f08CueClock(cueTime,wasOn,on,dt,initial||reduced);
        const cue=f08Cue(cueTime,on);
        const shutters=[at('A',cue.left),at('A',cue.right)];
        frames.A=Math.min(...shutters);
        for(const slot of ['B','C'] as const){
          const target=Number(state.interactions[slot].active);
          const [start,end]=ranges[slot];
          const speed=24/(end-start);
          const gap=target-current[slot], step=Math.min(Math.max(dt,0),.07)*speed;
          current[slot]=initial||reduced||Math.abs(gap)<=step?target:current[slot]+Math.sign(gap)*step;
          frames[slot]=at(slot,current[slot]);
        }
        initial=false;wasOn=on;
        const leafFrames=f08LeafTravel(current.C).map(q=>at('C',q));
        mixer.sample([['AL',shutters[0]],['AR',shutters[1]],['B',frames.B],
          ['C1',leafFrames[0]],['C2',leafFrames[1]],['C3',leafFrames[2]],['C4',leafFrames[3]],['CMeta',frames.C]]);
        model.parent!.userData.authoredFrames={...frames};
        model.parent!.userData.cueTime=cueTime;
        model.parent!.userData.shutterFrames=shutters;
        model.parent!.userData.leafFrames=leafFrames;
        model.parent!.userData.comparison=frames.B===1?'intact':frames.B>=69?'fractured':'sliding';
        model.parent!.userData.rings=rings.length;
        model.parent!.userData.interactables=hits;
      },dispose:()=>mixer.dispose()};
    },
    phase=>{if(phase==='ready')onReady();if(phase==='fallback')onFail();},
  );
  return stage;
}
