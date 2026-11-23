import * as THREE from 'three';
import {f11Ease} from './f11StoryPaper.ts';

type Point = readonly [x:number,z:number];
type Step = {from:Point; to:Point; start:number; end:number; lead:'left'|'right'; single?:boolean};
type Foot = {x:number;z:number;lift:number};
export type F11WalkPose={x:number;z:number;left:Foot;right:Foot;bob:number;yaw:number;pitch:number;watch:number};
const mix=THREE.MathUtils.lerp;
const foot=(p:Point):Foot=>({x:p[0],z:p[1],lift:0});
const at=(s:Step,u:number,lift=0):Foot=>({x:mix(s.from[0],s.to[0],u),z:mix(s.from[1],s.to[1],u),lift});
const codecStart=[-1.29,.32] as const,codecLoam=[-.77,.37] as const,codecWatch=[-1.19,.46] as const,codecTry=[-.97,.56] as const;
const marcelStart=[.74,.38] as const,marcelLoam=[.22,.40] as const,marcelStop=[.43,.57] as const,marcelLane=[.76,.56] as const,marcelGreet=[1.12,.68] as const;

const codecSteps:Step[]=[
  {from:codecStart,to:codecLoam,start:41,end:47.3,lead:'right'},
  {from:codecLoam,to:codecWatch,start:59,end:69,lead:'left'},
  {from:codecWatch,to:codecTry,start:128,end:136,lead:'right',single:true},
  {from:codecTry,to:[-1.33,.42],start:140,end:154,lead:'left'},
];
const marcelSteps:Step[]=[
  {from:marcelStart,to:marcelLoam,start:39,end:44.8,lead:'left'},
  {from:marcelLoam,to:marcelStop,start:101,end:104.2,lead:'right',single:true},
  {from:marcelStop,to:marcelLane,start:108.8,end:111.8,lead:'left'},
  {from:marcelLane,to:marcelGreet,start:132,end:146,lead:'right'},
];
function sampleStep(s:Step,f:number,reduced:boolean):{left:Foot;right:Foot} {
  const t=THREE.MathUtils.clamp((f-s.start)/(s.end-s.start),0,1);
  if(reduced){
    const p=at(s,f11Ease(.08,.94,t));return {left:p,right:p};
  }
  const swing=(u:number,max:number)=>u<=0||u>=1?0:Math.sin(Math.PI*u)*max;
  const a=f11Ease(0,s.single?.54:.32,t);
  const b=f11Ease(s.single?.58:.34,s.single?1:.68,t);
  const c=s.single?0:f11Ease(.70,1,t);
  const front=at(s,s.single?a:.55*a+.45*c,swing(a,s.single?.078:.095)+swing(c,.065));
  const back=at(s,b,swing(b,s.single?.053:.102));
  return s.lead==='left'?{left:front,right:back}:{left:back,right:front};
}
function pose(steps:Step[],f:number,reduced:boolean):F11WalkPose{
  const active=steps.find(s=>s.start<=f&&f<s.end);
  const last=steps.filter(s=>s.end<=f).at(-1);
  const resting=foot(last?.to??steps[0].from);
  const {left,right}=active?sampleStep(active,f,reduced):{left:resting,right:resting};
  const lift=Math.max(left.lift,right.lift);
  return {x:(left.x+right.x)/2,z:(left.z+right.z)/2,left,right,bob:lift*.26,yaw:0,pitch:0,watch:0};
}
export function f11Choreography(frame:number,reduced:boolean){
  const codec=pose(codecSteps,frame,reduced),marcel=pose(marcelSteps,frame,reduced);
  const inspect=f11Ease(44,47.6,frame)*(1-f11Ease(52,59,frame));
  const nearly=f11Ease(127,132,frame)*(1-f11Ease(139,144,frame));
  const wait=f11Ease(102.6,104.7,frame)*(1-f11Ease(107.7,110.2,frame));
  codec.yaw=1.28*f11Ease(34,40,frame)*(1-f11Ease(59,67,frame))
    -.62*f11Ease(59,64,frame)*(1-f11Ease(65,70,frame))
    +.87*nearly-.63*f11Ease(139,154,frame);
  codec.pitch=.25*inspect+.075*nearly;
  codec.watch=.22*inspect+.13*nearly;
  marcel.yaw=-1.17*f11Ease(36,42,frame)*(1-f11Ease(59,70,frame))
    +1.06*f11Ease(99,104,frame)*(1-f11Ease(111,118,frame))
    +1.09*f11Ease(128,143,frame);
  marcel.pitch=.28*inspect-.16*wait+.07*f11Ease(132,145,frame);
  marcel.watch=.26*inspect+.30*wait;
  return {
    codec,marcel,
    tigerYaw:-.40*f11Ease(132,148,frame),
    beat:frame<34?'stations':frame<47.6?'converge':frame<49?'shared-loam':frame<101?'root-and-bloom':
      frame<104.2?'check-step':frame<108.8?'wait-for-bird':frame<112?'lane-cleared':frame<128?'tiger-arrives':
      frame<137?'almost-follows':frame<140?'codec-plants':frame<154?'two-responses':'settled',
  };
}

// The imported lower meshes contain both shoes and no authored leg bones.
// Repose their existing vertices, weighted by distance from each paper crease.
// Deliberately do not bend the skulls, split the material, or replace the art.
export function createF11PaperFeet(actor:THREE.Object3D,names:string[]) {
  const parts=names.map(name=>{
    const shoe=actor.getObjectByName(name);
    if(!(shoe instanceof THREE.Mesh))throw Error('Missing F11 lower paper '+name);
    const g=shoe.geometry;
    const attr=g.getAttribute('position') as THREE.BufferAttribute;
    const rest=Array.from(attr.array as Float32Array);
    const normals=g.getAttribute('normal') as THREE.BufferAttribute;
    const restNormals=normals?.array.slice();
    attr.setUsage(THREE.DynamicDrawUsage);
    normals?.setUsage(THREE.DynamicDrawUsage);
    g.computeBoundingBox();
    // The original bounds exclude toe lift and a small stride split.
    g.boundingBox!.expandByScalar(.25);
    return {g,attr,rest,normals,restNormals,wasMoved:false};
  });
  const dl=new THREE.Vector3(),dr=new THREE.Vector3(),rotation=new THREE.Quaternion();
  return (p:F11WalkPose,pageY:(x:number)=>number,mount:THREE.Group)=>{
    const scale=mount.scale.x*actor.scale.x;
    const moved=p.bob>1e-5||Math.abs(p.left.x-p.right.x)>1e-5||Math.abs(p.left.z-p.right.z)>1e-5;
    if(!moved&&!parts.some(part=>part.wasMoved))return;
    rotation.copy(mount.quaternion).multiply(actor.quaternion).invert();
    const offset=(out:THREE.Vector3,point:Foot)=>out.set(point.x-p.x,pageY(point.x)-pageY(p.x)+point.lift-p.bob,point.z-p.z)
      .applyQuaternion(rotation).divideScalar(Math.max(.25,scale));
    offset(dl,p.left);offset(dr,p.right);
    for(const part of parts){
      const {g,attr,rest,normals,restNormals}=part;
      for(let i=0;i<attr.count;i++){
        const j=i*3,x=rest[j],y=rest[j+1],z=rest[j+2];
        const left=f11Ease(-.049,.049,x),w=1-f11Ease(.20,.60,y);
        attr.setXYZ(i,x+mix(dr.x,dl.x,left)*w,y+mix(dr.y,dl.y,left)*w,z+mix(dr.z,dl.z,left)*w);
      }
      attr.needsUpdate=true;
      if(!moved&&normals&&restNormals){
        normals.array.set(restNormals);normals.needsUpdate=true;
      } else g.computeVertexNormals();
      part.wasMoved=moved;
    }
  };
}

export function createF11ApproachCuts(pageY:(x:number)=>number){
  const root=new THREE.Group();root.name='F11 two paper slots for the approach feet';
  const ink=new THREE.MeshStandardMaterial({color:0x221b1c,roughness:1,side:THREE.DoubleSide});
  const edge=new THREE.MeshStandardMaterial({color:0x685446,roughness:1,side:THREE.DoubleSide});
  for(const [from,to] of [[codecStart,codecLoam],[marcelStart,marcelLoam]]){
    for(const [m,delta,w,raise] of [[ink,0,.022,.007],[edge,.019,.005,.010]] as const){
      const p:number[]=[],indices:number[]=[];
      for(let i=0;i<=10;i++){
        const t=i/10,x=mix(from[0],to[0],t),z=mix(from[1],to[1],t)+delta;
        const width=w*(.35+.65*Math.sin(Math.PI*t));p.push(x,pageY(x)+raise,z-width,x,pageY(x)+raise,z+width);
        if(i<10)indices.push(i*2,i*2+2,i*2+1,i*2+1,i*2+2,i*2+3);
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);
      g.computeVertexNormals();const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;root.add(mesh);
    }
  }
  return root;
}
