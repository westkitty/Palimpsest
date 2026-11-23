import * as THREE from 'three';
import type { FolioRuntimeState } from '../types/atlas';
import { getOpenPageY as pageY } from '../engine/BookAndDeskRig';

const axisX=new THREE.Vector3(1,0,0);
const ease=(a:number,b:number,x:number)=>THREE.MathUtils.smoothstep(x,a,b);
const mix=THREE.MathUtils.lerp;
const round=(n:number)=>Number(n.toFixed(4));
const limits={left:-.48,right:.48,y:.111,z:.191};
function paper(color:number,bump?:THREE.Texture){
  return new THREE.MeshStandardMaterial({color,bumpMap:bump??null,bumpScale:.006,roughness:.87,side:THREE.DoubleSide,flatShading:true});
}
function mesh(root:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0){
  const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;
}
const slab=(root:THREE.Object3D,w:number,h:number,d:number,mat:THREE.Material,x=0,y=0,z=0)=>
  mesh(root,new THREE.BoxGeometry(w,h,d),mat,x,y,z);
function link(m:THREE.Mesh,start:THREE.Vector3,end:THREE.Vector3) {
  const d=end.clone().sub(start);
  m.position.copy(start).addScaledVector(d,.5);m.scale.x=d.length();
  m.quaternion.setFromUnitVectors(axisX,d.normalize());
}
function score(a:number,b:number,x:number){return a+(b-a)*ease(0,1,x);}
// Swing only one shoe at a time. A shoe not in swing retains its last world X;
// the visible folded shin spans the moving pelvis and the actual contact.
const gait={
  step(time:number,base:number,dx:number){
    const t=Math.max(0,Math.min(6,time));
    const i=Math.floor(t),part=t-i;
    return [0,1].map(foot=>{
      const start=base+(Math.floor((i+1-foot)/2)*2)*dx;
      return {x:start+(i%2===foot?score(0,2*dx,part):0),
        lift:i%2===foot?Math.sin(part*Math.PI)*.027:0};
    });
  },
};
/** Anonymous relief instruction tableau, not a claim of a new battle event. */
export function createF07ReliefChoreography(root:THREE.Group,bump?:THREE.Texture){
  const cream=paper(0xecd6aa,bump),brass=paper(0xab895b,bump),rust=paper(0xa44c3c,bump);
  const dark=paper(0x2e303a,bump),slate=paper(0x367789,bump),parcel=paper(0xd1b592,bump),cloth=paper(0xa38370,bump);
  const relief=new THREE.Group();relief.name='F07 · illustrated Administration relief supplies';
  relief.position.set(-1.85,pageY(-1.85)+.017,1.29);root.add(relief);
  slab(relief,1.10,.027,.66,dark);
  slab(relief,1.05,.022,.61,cream,0,.020);
  for(const x of [-.40,-.18,.04,.26,.45])slab(relief,.11,.006,.009,brass,x,.035,.279);
  const bench=new THREE.Group();bench.name='F07 · relief bench scored hinge';
  bench.position.set(0,.034,-.14);relief.add(bench);
  for(const x of [-.21,.21]){
    slab(bench,.05,.15,.12,dark,x,.075);
    slab(bench,.075,.023,.17,brass,x,.013);
  }
  const topSlat=slab(bench,.60,.043,.20,rust,0,.150);
  const topCrease=slab(bench,.54,.013,.017,brass,0,.173,.084);
  for(let i=0;i<3;i++){
    const x=-.17+.17*i,h=.09+i%2*.035;
    slab(bench,.125,h,.12,i===1?cloth:parcel,x,.175+h/2);
    slab(bench,.022,h+.006,.124,cream,x,.175+h/2);
  }
  const ramp=new THREE.Group();ramp.name='F07 · actual hinged relief ramp';relief.add(ramp);
  const rampStock=paper(0x654139,bump),rampWeb=paper(0xd0a267,bump);
  for(const x of [limits.left,limits.right]){
    slab(ramp,.082,.062,.238,dark,x,.059,limits.z);
    const hinge=slab(ramp,.066,.035,.234,brass,x,.093,limits.z);
    hinge.name='F07 bonded ramp hinge saddle';
  }
  const leaves=Array.from({length:8},(_,i)=>{
    const w=(limits.right-limits.left)/8;
    const leaf=slab(ramp,1,.022,.20,rampStock,0,0,limits.z);
    leaf.name='F07 hinged working ramp stock '+i;
    slab(leaf,.018,.006,.201,rampWeb,.485,.013);
    return {leaf,x:limits.left+w*i,w};
  });
  const figures=[0,1].map(i=>{
    const side=i===0?-1:1,color=i===0?slate:rust,arm=i===0?slate:cloth;
    const f=new THREE.Group();f.name=i===0?'F07 · anonymous relief worker':'F07 · anonymous recipient';relief.add(f);
    const body=new THREE.Group();f.add(body);
    const coat=mesh(body,new THREE.CylinderGeometry(.073,.091,.16,5,5),color,0,.143);
    coat.scale.z=.72;
    const pose=coat.geometry.getAttribute('position'),original=pose.clone();
    if(i===0)slab(body,.10,.022,.009,cream,0,.176,.049);
    const head=mesh(body,new THREE.IcosahedronGeometry(.048,0),parcel,0,.251);
    const quietArm=slab(body,.040,.115,.053,arm,side*.073,.155,-.024);
    quietArm.rotation.z=-side*.42;
    const feet=[0,1].map(j=>{
      const shin=slab(relief,1,.035,.039,dark);
      const shoe=slab(relief,.067,.028,.053,dark);
      shoe.name=`F07 paper shoe ${i}:${j}`;
      return {shin,shoe};
    });
    const reach=slab(relief,1,.044,.052,arm),hand=slab(relief,.055,.042,.062,parcel);
    hand.name='F07 · paper hinge at wrist';
    return {f,body,head,coat,pose,original,feet,reach,hand};
  });
  const load=slab(relief,.166,.091,.133,parcel);
  load.name='F07 · actual paper parcel crossing between the hands';
  slab(load,.170,.012,.026,cream,0,.044);
  const apronStock=paper(0x9c6648,bump) as THREE.MeshStandardMaterial;
  const apron=slab(relief,1.00,.008,.033,apronStock,0,.037,.313);
  apron.name='F07 · stock catches the ruby cast shadow';
  const leftShoe=new THREE.Vector3(),rightShoe=new THREE.Vector3();
  const a=new THREE.Vector3(),b=new THREE.Vector3(),tmp=new THREE.Vector3();
  const shadow=new THREE.Color(0xea8d51);
  let t=0,idleClock=0,benchOpening=.50,passed=false,wasSupplyOpen=false;
  return (state:FolioRuntimeState,dt:number,reduced:boolean)=>{
    const step=Math.min(.10,Math.max(0,dt));
    const supplyOpen=state.interactions.C.active;
    // Reopening the native relief tab offers an intentional replay. Merely
    // inspecting the combat plan or costs does not reset the supply scene.
    if(supplyOpen&&!wasSupplyOpen&&t>=5.58&&!reduced){t=0;passed=false;}
    wasSupplyOpen=supplyOpen;
    if(!reduced){t=Math.min(7.4,t+step);idleClock=(idleClock+step)%(20*Math.PI);}
    const time=reduced?7.4:t;
    const approach=ease(.25,1.34,time);
    const pick=ease(1.12,1.56,time);
    const before=ease(1.53,2.33,time);
    const after=ease(3.06,4.78,time);
    const adjust=ease(2.28,2.51,time)*(1-ease(2.78,3.12,time));
    const walk=before*.41+after*.59;
    const lower=ease(4.83,5.35,time);
    const center=mix(-.251,.248,walk);
    const loadWeight=pick*(1-lower);
    const press=loadWeight*(.72+adjust*.28);
    const tilt=-adjust*.33+(1-adjust)*Math.sin(walk*4*Math.PI)*.045*loadWeight;
    const shape=(x:number)=>limits.y-press*(.043+.020*adjust)*
      Math.pow(Math.max(0,1-Math.pow(x/.48,2)),.75);
    const phase=time<1.15?'approach':time<1.60?'lift':time<2.34?'carry':time<3.06?'adjust':
      time<4.81?'carry':time<5.58?'set-down':'complete';
    const target=supplyOpen?1:.50;
    benchOpening=reduced?target:mix(benchOpening,target,1-Math.exp(-step*7));
    bench.rotation.x=.58*(1-benchOpening);
    // The same paper path supports both pairs of feet. Pin both end folds to
    // the stock; the central leaves visibly change angle under the load.
    for(const {leaf,x,w} of leaves){
      const y=shape(x),next=shape(x+w);
      leaf.position.set(x+w/2,(y+next)/2-.011,limits.z);
      leaf.scale.x=Math.hypot(w,next-y);
      leaf.rotation.z=Math.atan2(next-y,w);
    }
    const loadRest=limits.y+.0455;
    load.position.set(center,loadRest+loadWeight*.205-adjust*.035,limits.z+.059);
    load.rotation.z=tilt;load.updateMatrix();
    const rootX:number[]=[],contacts:number[]=[],footHeights:number[][]=[];
    figures.forEach(({f,body,head,coat,pose,original,feet,reach,hand},i)=>{
      const side=i===0?-1:1;
      const approachFrom=i===0?-.496:.443;
      const hold=center+side*.172;
      const release=ease(5.34,6.12,time);
      const adjustShift=i===1?.024*ease(2.34,2.73,time)*(1-ease(2.90,3.33,time)):0;
      const base=mix(approachFrom,hold,approach)+adjustShift;
      const x=base+side*.067*release;
      const y=shape(x);
      const bodyFold=i===1?.85*adjust+.38*lower*(1-release):.22*adjust;
      f.position.set(x,y,limits.z-.021);
      const idle=reduced||time<5.58?0:Math.sin(idleClock*(i===0?1.2:.9)+i*.8)*.016;
      body.rotation.y=(i===0?.65:mix(-.82,.55,ease(1.60,2.15,time))-.72*adjust)+idle;
      body.rotation.z=side*(.09+.19*pick*(1-before)+.17*bodyFold)+idle*.65;
      head.position.y=.251-.069*bodyFold;
      head.rotation.y=-side*(.28+.36*adjust);
      if(coat.userData.fold!==bodyFold){
        for(let j=0;j<pose.count;j++){
          const v=(original.getY(j)+.08)/.16;
          pose.setXYZ(j,original.getX(j)+bodyFold*Math.sin(v*Math.PI*5)*.022*v,
            original.getY(j)-bodyFold*.081*v,original.getZ(j)+bodyFold*Math.sin(v*Math.PI*5)*.038*v);
        }
        pose.needsUpdate=true;coat.geometry.computeVertexNormals();coat.userData.fold=bodyFold;
      }
      // World-rooted contact, not shoes translating with an invisible cart.
      // Alternate steps through approach and carry; pin both on the pause.
      const spacing=.055;
      let span;
      if(time<1.52)span=gait.step(6*Math.max(0,Math.min(1,(time-.25)/1.09)),approachFrom,(hold-approachFrom)/6);
      else if(time<4.81){
        const sideAtStart=-.251+side*.172;
        const travel=.248-(-.251);
        span=after>0?gait.step(4*after,sideAtStart+travel*.41,travel*.59/4):
          gait.step(2*before,sideAtStart,travel*.41/2);
      }else span=[{x:base,lift:0},{x:base,lift:0}];
      const heights:number[]=[];
      feet.forEach(({shin,shoe},j)=>{
        const s=span[j],xx=s.x+(j===0?-.018:.018)+side*.067*release+(j===1?adjustShift:0);
        const zz=limits.z+(j===0?-spacing*.66:spacing*.62);
        const h=shape(xx)+s.lift;
        (j===0?leftShoe:rightShoe).set(xx,h+.014,zz);
        shoe.position.copy(j===0?leftShoe:rightShoe);
        // A folded shin is a real strip linked to its shoe.
        a.set(xx,h+.027,zz);
        b.set(x+(j===0?-.023:.023),y+.089,limits.z-.011);
        link(shin,a,b);
        heights.push(round(s.lift));
      });
      const shoulder=tmp.set(x-side*.028,y+.220-bodyFold*.055,limits.z);
      const grip=pick*(1-release);
      const wrist=new THREE.Vector3(x-side*.056,y+.155,limits.z+.058);
      const loadCorner=new THREE.Vector3(side*.079,-.011,.051).applyMatrix4(load.matrix);
      wrist.lerp(loadCorner,grip);
      link(reach,shoulder,wrist);
      hand.position.copy(wrist);
      contacts.push(round(hand.position.distanceTo(loadCorner)));
      rootX.push(round(x));footHeights.push(heights);
    });
    const ruby=Number(root.userData.f07RubyShadow??0);
    apronStock.color.setHex(0x9c6648).lerp(shadow,ruby*.67);
    parcel.emissive.setHex(0x6e2715);parcel.emissiveIntensity=.09+ruby*.34;
    topSlat.position.y=.150-.016*lower;topSlat.rotation.z=.082*lower;
    topCrease.position.y=.173-.016*lower;topCrease.rotation.z=topSlat.rotation.z;
    if(lower>.96)passed=true;
    const choreography={phase,rootX,contacts,footHeights,parcelTilt:round(tilt),parcelX:round(center),
      rampDeflection:round(limits.y-shape(0)),shuffler:adjust>.3?'recipient':'none'};
    relief.userData.choreography=choreography;
    relief.userData.parcelX=center;relief.userData.workClock=time;relief.userData.transfer=walk;
    relief.userData.parcelLoad=press;relief.userData.recipientFold=adjust;
    relief.userData.passed=passed;
  };
}
