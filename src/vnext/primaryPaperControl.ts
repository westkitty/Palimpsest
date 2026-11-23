import * as THREE from 'three';

const slotPlan=['A','A','A','B','B','A','A','A','B','A','A','A'] as const;
export const primaryPaperSlot=(folio:number)=>slotPlan[folio]??null;
export function invitationFrame(seconds:number,reduced:boolean):number {
  if(reduced||seconds>=.86)return 0;
  const t=Math.max(0,seconds);
  // One quick release from the paper pocket, a small rebound, then rest.
  return Math.sin(t*9.3)*Math.exp(-3.5*t)*Math.min(1,t*16);
}

export function makePrimaryPaperGrip(owner:THREE.Object3D,folio:number){
  const slot=primaryPaperSlot(folio);
  if(!slot)return null;
  const root=new THREE.Group();
  root.name='Primary study paper finger-grip '+slot;
  root.position.set(.96,.256,2.46);
  owner.add(root);
  const stock=new THREE.MeshStandardMaterial({color:0xdccbaa,roughness:.92,side:THREE.DoubleSide});
  const cut=new THREE.MeshStandardMaterial({color:0xa28158,roughness:.89});
  const dark=new THREE.MeshStandardMaterial({color:0x554331,roughness:.91});
  const blank=(parent:THREE.Object3D,w:number,h:number,d:number,x=0,y=0,z=0)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),dark);m.position.set(x,y,z);parent.add(m);return m;
  };
  blank(root,.66,.021,.19,0,-.008,.01);
  const flap=new THREE.Group();root.add(flap);
  const front=[-.30,.30,.36,.25,-.25,-.36];
  const far=[0,0,.26,.52,.52,.26];
  const shape=new THREE.Shape();
  front.forEach((x,i)=>i===0?shape.moveTo(x,-far[i]):shape.lineTo(x,-far[i]));
  shape.closePath();
  const finger=new THREE.Path();
  if(folio===8||folio===5)finger.absellipse(0,-.34,.095,.089,0,Math.PI*2,true,0);
  else finger.absellipse(0,-.34,.123,.060,0,Math.PI*2,true,0);
  shape.holes.push(finger);
  const cutout=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.029,bevelEnabled:false,curveSegments:9}),[stock,cut]);
  cutout.rotation.x=-Math.PI/2;cutout.castShadow=true;cutout.receiveShadow=true;flap.add(cutout);
  for(const x of [-.22,-.14,.14,.22])blank(flap,.018,.006,.048,x,.033,.30);
  const hit=new THREE.Mesh(new THREE.PlaneGeometry(.78,.66),new THREE.MeshBasicMaterial({
    visible:false,side:THREE.DoubleSide,
  }));
  hit.rotation.x=-Math.PI/2;hit.position.set(0,.04,.25);flap.add(hit);
  return {root,flap,hit,slot,update(seconds:number,reduced:boolean){
    const lift=invitationFrame(seconds,reduced);
    flap.rotation.x=-.18-.65*lift;
    return lift;
  }};
}
