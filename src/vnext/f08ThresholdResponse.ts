import * as THREE from 'three';
import {f08ThresholdCue} from './f08Motion.ts';

type StockHeight=(x:number)=>number;
const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const choices=[
  // Scored foreground route between exact authored open gate and Marcel.
  // Z order stays in front of the antique comparator and the twenty-ring C leaf.
  [-1.62,.435,.27,.20],[-1.18,.77,.30,.29],[-.69,1.09,.34,.33],
  [-.15,1.345,.27,.32],[.39,1.49,.29,.27],[.91,1.53,.26,.25],[1.32,1.49,.22,.20],
] as const;
export function newF08ThresholdResponse(pageY:StockHeight,shoes:THREE.Group){
  const root=new THREE.Group();root.name='F08 seated score chain from circular Hookshot to Marcel';root.visible=false;
  const card=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.84,flatShading:true,side:THREE.DoubleSide});
  const dark=card(0x2c3743),front=card(0x767a76),reverse=card(0x4c6269),score=card(0xb9a780),foot=card(0x353c43);
  const light=(color:number)=>new THREE.MeshBasicMaterial({color,toneMapped:false,side:THREE.DoubleSide,
    transparent:true,opacity:0,depthWrite:false});
  const awake=(m:THREE.MeshBasicMaterial,n:number)=>{m.opacity=n;};
  function face(parent:THREE.Object3D,label:string,vs:THREE.Vector3[],material:THREE.Material){
    const geo=new THREE.BufferGeometry();
    const points=([0,1,2,0,2,3] as const).map(i=>vs[i]);geo.setFromPoints(points);geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,material);m.name=label;parent.add(m);return m;
  }
  const threshold=[-1.66,-.19] as const;
  const fold=choices.map(([x,z,h,width],i)=>{
    const pivot=new THREE.Group();pivot.name='F08 seated paper reaction '+(i+1);root.add(pivot);
    pivot.position.set(x,pageY(x)+.031,z);
    // Local +Z points toward the aperture; rotating about the scored X pin
    // visibly pulls the top toward it while the glue foot remains immobile.
    pivot.rotation.y=Math.atan2(threshold[0]-x,threshold[1]-z);
    face(pivot,'Splayed scored glue foot',[v(-width*.54,.005,-.055),v(width*.55,.005,-.065),
      v(width*.54,.005,.11),v(-width*.51,.005,.10)],foot);
    const hinge=new THREE.Group();hinge.name='F08 actual top edge leans, foot stays';pivot.add(hinge);
    const w=width;
    const a=v(-w*.49,0,0),b=v(w*.49,0,0),c=v(w*.42,h*.91,.029),d=v(-w*.46,h*.91,.026);
    const midA=v(-w*.04,.009,.024),midB=v(w*.055,h,.057);
    face(hinge,'Hookshot loose paper facet',[a,midA,midB,d],i%3===1?front:reverse);
    face(hinge,'Hookshot reverse folded facet',[midA,b,c,midB],i%3===1?reverse:front);
    face(hinge,'Hookshot score with visible paper thickness',[d,midB,c,v(w*.40,h*.89,.032)],score);
    const glint=light(0x81eafa);
    const shine=face(hinge,'Cyan reflection attached to the leading crease',[
      v(-w*.42,h*.857,.039),v(w*.42,h*.861,.039),v(w*.365,h*.944,.044),v(-w*.375,h*.937,.046),
    ],glint);
    shine.renderOrder=4;
    return {hinge,shine,glint};
  });
  const points=[...choices.map(([x,z])=>[x,z] as const),[1.60,1.48] as const];
  const strips=points.slice(1).map(([x,z],i)=>{
    const [px,pz]=points[i],dx=x-px,dz=z-pz,len=Math.hypot(dx,dz);
    const lip=(w:number,y:number)=>[
      v(px+dz*w/len,pageY(px)+y,pz-dx*w/len),v(x+dz*w/len,pageY(x)+y,z-dx*w/len),
      v(x-dz*w/len,pageY(x)+y,z+dx*w/len),v(px-dz*w/len,pageY(px)+y,pz+dx*w/len),
    ];
    face(root,'Pressed stock join, physically part of the lower margin',lip(.041,.041),dark);
    const m=light(0x30bddb);
    const reflected=face(root,'Directional cyan paper-edge reflection',lip(.019,.044),m);reflected.renderOrder=3;
    return {reflected,m};
  });
  // The endpoint is the existing physical shoe anchor. Keep the man and his
  // clothing untouched; a nearby grazing light carries the reflection upward.
  const contact=light(0xa0eff8);
  const shoeReflection=face(shoes,'F08 cyan contact on original Marcel support',[
    v(-.175,.014,-.101),v(.175,.014,-.101),v(.175,.014,-.056),v(-.175,.014,-.056),
  ],contact);shoeReflection.renderOrder=3;shoeReflection.visible=false;
  return {root,update(t:number,on:boolean,reduced:boolean,dt:number){
    const cue=f08ThresholdCue(t,on,reduced);
    fold.forEach(({hinge,shine,glint},i)=>{
      hinge.rotation.x=on?.10+cue.lean[i]*(i<2?.95:.73):
        reduced||t<=0?.10:.10+(hinge.rotation.x-.10)*Math.exp(-Math.max(0,dt)*7.2);
      awake(glint,cue.edges[i]);shine.visible=cue.edges[i]>.014;
    });
    strips.forEach(({reflected,m},i)=>{
      awake(m,cue.floor[i]);reflected.visible=cue.floor[i]>.014;
    });
    awake(contact,cue.contact);shoeReflection.visible=cue.contact>.015;
    return {
      foldAngles:fold.map(x=>Math.round(x.hinge.rotation.x*100)/100),
      litEdges:fold.map(x=>Math.round(x.glint.opacity*100)/100),
      pathHead:cue.head,contact:Math.round(cue.contact*100)/100,
      climb:cue.climb,actorLight:cue.actorLight,phase:cue.phase,
    };
  }};
}
