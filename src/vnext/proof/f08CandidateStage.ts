import * as THREE from 'three';
import type { FolioRuntimeState } from '../../types/atlas';
import { authoredSlotMixer,createPortedPaperAsset } from './portedPaperAsset.ts';

type Slot = 'A'|'B'|'C';
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
      const mixer=authoredSlotMixer<Slot>(model,gltf.animations,c=>slots.find(k=>key(k)===c.name),24);
      let initial=true;
      const frames:{[K in Slot]:number}={A:1,B:1,C:1};
      const current:{[K in Slot]:number}={A:0,B:0,C:0};
      return {update(state,dt,reduced){
        for(const slot of slots){
          const target=Number(state.interactions[slot].active);
          const [start,end]=ranges[slot];
          const speed=24/(end-start);
          const gap=target-current[slot], step=Math.min(Math.max(dt,0),.07)*speed;
          current[slot]=initial||reduced||Math.abs(gap)<=step?target:current[slot]+Math.sign(gap)*step;
          frames[slot]=current[slot]===0?1:start+(end-start)*current[slot];
        }
        initial=false;
        mixer.sample(slots.map(slot=>[slot,frames[slot]]));
        model.parent!.userData.authoredFrames={...frames};
        model.parent!.userData.rings=rings.length;
        model.parent!.userData.interactables=hits;
      },dispose:()=>mixer.dispose()};
    },
    phase=>{if(phase==='ready')onReady();if(phase==='fallback')onFail();},
  );
  return stage;
}
