import * as THREE from 'three';
import { getOpenPageY as pageY } from '../engine/BookAndDeskRig';

const sat=(n:number)=>Math.max(0,Math.min(1,n));
const step=(x:number,a:number,b:number)=>sat((x-a)/(b-a));
export function f09Cue(frame:number) {
  const phase=frame<10?'rest':frame<18?'tension':frame<31?'inward-wave':frame<49?'scored-fold':'quiet-absence';
  const waves=[0,1,2].map(i=>{
    const t=step(frame,18+i*4,43+i*3);
    return Math.sin(t*Math.PI)**2 * [1,.75,.55][i];
  });
  const petals=Array.from({length:8},(_,i)=>38+12*step(frame,31+i*.80,40+i*.80));
  const ramp=step(frame,30,34)*(1-step(frame,44,49));
  const gimbal=[0,1,2].map(i=>ramp*Math.sin((frame-29)*1.72+i*.72)*[.059,.043,.035][i]);
  return {phase,waves,petals,gimbal};
}

/** Full cut-paper sectors hinged outside the model and turning toward it.
 * The sectors are local to the left model leaf; there is no shared transform
 * with the historical symbols, light field or containment diagram.
 */
export function newF09CollapsingPaperGround(owner:THREE.Group,center:THREE.Vector3){
  const assembly=new THREE.Group();assembly.name='F09 model-leaf · three inward scored waves';owner.add(assembly);
  const angle=(d:number)=>d*Math.PI/180;
  const shades=[0x31414a,0x283740,0x26333b];
  const inks=[0x708580,0x60716d,0x505f5f];
  const tiers=[.86,1.19,1.52].map((r,j)=>{
    const paper=new THREE.MeshStandardMaterial({color:shades[j],roughness:.96,side:THREE.DoubleSide});
    const ink=new THREE.MeshStandardMaterial({color:inks[j],roughness:.94,side:THREE.DoubleSide});
    return [116,146,175,204,233,263].map((deg,k)=>{
      const t=angle(deg),x=center.x+Math.cos(t)*r,z=center.z+Math.sin(t)*r;
      const pivot=new THREE.Group();pivot.name='F09 model leaf scored ground '+j+'/'+k;
      pivot.position.set(x,pageY(x)+.028+.003*(2-j),z);
      pivot.rotation.y=Math.atan2(Math.cos(t),Math.sin(t));assembly.add(pivot);
      const lane=new THREE.Group();pivot.add(lane);
      const w=[.40,.54,.68][j],len=[.29,.32,.33][j];
      const geo=new THREE.Shape().moveTo(-w/2,0).lineTo(w/2,0).lineTo(w*.432,len*.64)
        .lineTo(w*.29,len).lineTo(-w*.29,len).lineTo(-w*.42,len*.66).closePath();
      const panel=new THREE.Mesh(new THREE.ExtrudeGeometry(geo,{depth:.020,bevelEnabled:false,curveSegments:1}),paper);
      panel.rotation.x=-Math.PI/2;panel.castShadow=true;panel.receiveShadow=true;lane.add(panel);
      const hinge=new THREE.Mesh(new THREE.BoxGeometry(w*.98,.018,.019),ink);
      hinge.position.set(0,.012,0);hinge.receiveShadow=true;pivot.add(hinge);
      const crease=new THREE.Mesh(new THREE.BoxGeometry(w*.64,.009,.013),ink);
      crease.position.set(.009,.025,-len*.72);crease.rotation.y=(k%2===0?1:-1)*.14;lane.add(crease);
      const foot=new THREE.Mesh(new THREE.BoxGeometry(w*1.04,.023,.052),paper);
      foot.position.set(0,-.010,.044);foot.receiveShadow=true;pivot.add(foot);
      return lane;
    });
  });
  return {
    update(frame:number,reduced:boolean){
      const {waves}=f09Cue(frame);
      const movement=(reduced?[0,0,0]:waves);
      tiers.forEach((tier,j)=>tier.forEach((leaf,k)=>{
        // Positive rotation lifts the free near edge into the well; glue feet and hinge axes remain in place.
        leaf.rotation.x=.015+movement[j]*([1.30,1.18,1.04][j]-.025*Math.abs(k-2.5));
      }));
      return movement.map(n=>Number(n.toFixed(3)));
    },
  };
}
