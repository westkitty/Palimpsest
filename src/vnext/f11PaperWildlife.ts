import * as THREE from 'three';
import {getOpenPageY} from '../engine/BookAndDeskRig';
import {f11Ease} from './f11StoryPaper.ts';

export const F11_MOTH_FROND='FROND_26_3';
interface Perch { surface:THREE.Mesh;point:THREE.Vector3;normal:THREE.Vector3 }
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const pickSurface=(frond:THREE.Object3D):Perch=>{
  const surface=frond.children.find((n):n is THREE.Mesh=>n instanceof THREE.Mesh);
  if(!surface)throw Error('F11 moth needs a real cut-paper frond to land on');
  const g=surface.geometry,a=g.getAttribute('position'),index=g.index;
  const read=(i:number)=>v().fromBufferAttribute(a,index?index.getX(i):i);
  const N=index?.count??a.count;
  const best={point:v(),normal:v(0,1,0),score:-Infinity};
  for(let i=0;i<N-2;i+=3){
    const p=read(i),q=read(i+1),r=read(i+2);
    const normal=q.clone().sub(p).cross(r.clone().sub(p));
    const size=normal.length();
    if(size<.0015)continue;
    normal.normalize();
    const c=p.add(q).add(r).divideScalar(3);
    // Large upper leaf facet near the readable face, not its thin cut edge.
    const score=size*(.60+Math.max(0,normal.y))+ Math.max(0,normal.y)*.036 + c.z*.018;
    if(normal.y>.11&&score>best.score){best.point=c;best.normal=normal;best.score=score;}
  }
  if(!Number.isFinite(best.score))throw Error('F11 upper leaf facet not found');
  return {surface,point:best.point,normal:best.normal};
};

export function f11WildlifeBeats(frame:number) {
  return {
    moth: frame<89?'absent':frame<101?'flying':'perched',
    bird: frame<91?'absent':frame<97?'approach':frame<109?'inspect':'still',
    wingFold:f11Ease(99,103,frame),
    approach:f11Ease(91,97,frame),
    bow:f11Ease(97,101,frame)*(1-f11Ease(104,109,frame)),
  } as const;
}

export function createF11PaperWildlife(owner:THREE.Group,frond:THREE.Object3D) {
  const perch=pickSurface(frond),root=new THREE.Group();
  root.name='F11 small animal witnesses to already rooted growth';
  owner.add(root);
  const group=(p:THREE.Object3D,name:string)=>{const g=new THREE.Group();g.name=name;p.add(g);return g;};
  const stock=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true,side:THREE.DoubleSide});
  const pale=stock(0xd8bc78),darker=stock(0x856a44),chalk=stock(0xd9d4b0);
  const chest=stock(0x778477),paperWing=stock(0x576a65),side=stock(0xac9a6f),graphite=stock(0x302c23);
  const mesh=(p:THREE.Object3D,g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0)=>{
    const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;p.add(o);return o;
  };
  const sheet=(points:readonly [number,number][],d:number)=>{
    const s=new THREE.Shape();
    points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
    return new THREE.ExtrudeGeometry(s,{depth:d,steps:1,curveSegments:1,bevelEnabled:false});
  };
  const limb=(p:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,width:number,m:THREE.Material)=>{
    const o=mesh(p,new THREE.BoxGeometry(width,a.distanceTo(b),width),m);
    o.position.copy(a).lerp(b,.5);o.quaternion.setFromUnitVectors(v(0,1,0),b.clone().sub(a).normalize());
    return o;
  };

  const moth=group(root,'F11 paper moth, lands on a borrowed leaf face');
  moth.scale.set(1.14,1,1.11);
  const mothBody=mesh(moth,new THREE.CylinderGeometry(.018,.027,.123,7),darker,0,.025,-.003);
  mothBody.rotation.x=Math.PI*.5;
  for(const sign of [-1,1]){
    const wing=group(moth,sign<0?'Moth left fold wing':'Moth right fold wing'); wing.position.set(sign*.009,.027,-.02);
    const panel=mesh(wing,sheet([[0,.040],[sign*.084,-.028],[sign*.165,-.035],[sign*.127,.040],[sign*.066,.093],[0,.052]],.009),pale);
    panel.rotation.x=-Math.PI/2;
    limb(wing,v(sign*.012,.010,-.013),v(sign*.111,.012,-.030),.008,graphite);
    limb(wing,v(sign*.017,.010,-.022),v(sign*.064,.012,-.064),.006,darker);
    for(let i=0;i<3;i++)limb(moth,v(sign*.009,.022,-.038+i*.031),v(sign*.048,.002,-.047+i*.031),.009,darker);
    limb(moth,v(sign*.004,.032,-.059),v(sign*.03,.053,-.099),.005,graphite);
  }
  const wings=moth.children.filter(x=>x.name.includes('fold wing'));

  const bird=group(root,'F11 compact paper ground bird');
  const trunk=group(bird,'Bird body rocks over the feet');
  mesh(trunk,new THREE.IcosahedronGeometry(1,0),chest,-.012,.176,0).scale.set(.152,.091,.078);
  const tail=mesh(trunk,sheet([[.032,.06],[.181,.09],[.215,.059],[.188,.029],[.025,.01]],.024),paperWing,0,.132,-.011);
  tail.rotation.z=.24;
  for(const s of [-1,1]){
    const wing=mesh(trunk,sheet([[-.116,.025],[-.065,.08],[.067,.08],[.147,-.006],[.081,-.031],[-.056,-.022]],.017),paperWing,0,.166,s*.060);
    wing.rotation.x=s*.30;
    limb(trunk,v(-.091,.193,s*.070),v(.070,.165,s*.079),.007,side);
  }
  const neck=group(trunk,'Bird bends close to read the damp terrain');
  neck.position.set(-.104,.178,0);
  mesh(neck,new THREE.IcosahedronGeometry(.065,1),chalk,-.040,.079,0).scale.set(1,.96,.85);
  const beak=mesh(neck,new THREE.ConeGeometry(.021,.080,5),side,-.113,.065,0);beak.rotation.z=Math.PI/2;
  const eyes=[-1,1].map(sign=>{
    const eye=mesh(neck,new THREE.IcosahedronGeometry(.011,0),graphite,-.067,.091,sign*.045);
    eye.name='Bird printed small eye';return eye;
  });
  const feet=[-1,1].map((s,i)=>{
    const leg=group(bird,'Bird actual stepping leg '+i);leg.position.set(i?-.054:.036,0,s*.034);
    limb(leg,v(.022,0,0),v(-.007,.13,0),.013,side);
    limb(leg,v(.025,.005,0),v(-.039,.005,s*.014),.010,graphite);
    limb(leg,v(.023,.006,0),v(-.035,.006,-s*.012),.010,graphite);
    return leg;
  });
  const contact=v(),offset=v(),normal=v(),projected=v(),up=v(0,1,0);
  let quietTime=0,lastClock=0;
  const update=(frame:number,reduced:boolean,clockSeconds=0)=>{
    const delta=Math.min(.10,Math.max(0,clockSeconds-lastClock));
    lastClock=clockSeconds;
    quietTime=frame>=179.95&&!reduced?quietTime+delta:0;
    const idleGate=reduced?0:f11Ease(.70,1.55,quietTime);
    const resting=idleGate*Math.sin(quietTime*1.65);
    const quietBlink=(quietTime+1.9)%5.9;
    const preTiger=reduced?0:f11Ease(109.9,110.35,frame)*(1-f11Ease(110.45,111.25,frame));
    const blink=Math.max(preTiger,idleGate*f11Ease(5.32,5.39,quietBlink)*(1-f11Ease(5.43,5.53,quietBlink)));
    const b=f11WildlifeBeats(frame);
    moth.visible=b.moth!=='absent';bird.visible=b.bird!=='absent';
    if(moth.visible){
      const p=perch.surface;
      // Contact is a barycenter on an actual imported leaf triangle. It
      // follows the same native leaf as the canopy folds or parts.
      p.updateWorldMatrix(true,false);owner.updateWorldMatrix(true,false);
      contact.copy(perch.point);p.localToWorld(contact);owner.worldToLocal(contact);
      offset.copy(perch.point).add(perch.normal);p.localToWorld(offset);owner.worldToLocal(offset);
      normal.copy(offset).sub(contact).normalize();
      const arrive=reduced?1:f11Ease(89,101,frame);
      const hop=Math.sin(Math.PI*arrive)*.28;
      const start=v(-2.82,.86,-.08),now=projected.copy(start).lerp(contact,arrive);
      now.y+=hop;now.z-=Math.sin(Math.PI*arrive)*.13;
      moth.position.copy(now).addScaledVector(normal,.012);
      moth.quaternion.setFromUnitVectors(up,arrive>.99?normal:up);
      const flutter=reduced?0:Math.sin((frame-89)*1.82)*.63*(1-b.wingFold);
      const reseat=reduced?0:Math.sin(Math.PI*f11Ease(104,106.3,frame))*.09;
      wings.forEach((a,i)=>a.rotation.z=(i===0?-1:1)*(.16+.85*b.wingFold+flutter+reseat*(i===0?1:.64)));
    }
    if(bird.visible){
      const walk=reduced?1:b.approach;
      const x=THREE.MathUtils.lerp(2.85,2.51,walk);
      bird.position.set(x,getOpenPageY(x)+.01,.88);
      const tread=walk*Math.PI*5;
      feet.forEach((foot,i)=>{
        const stride=reduced||walk===1?0:Math.sin(tread+i*Math.PI);
        foot.position.y=Math.max(0,stride)*.030;foot.rotation.z=-stride*.21;
      });
      trunk.position.y=reduced?0:Math.abs(Math.sin(tread))*(walk===1?.0:.019);
      trunk.rotation.z=.21*b.bow+.014*resting;
      neck.rotation.z=.66*b.bow+.026*resting;
      for(const eye of eyes)eye.scale.y=1-.88*blink;
      neck.rotation.y=-.34*f11Ease(99,106,frame)+.25*f11Ease(106,109,frame);
    }
    return {moth:reduced&&moth.visible?'perched':b.moth,bird:b.bird,perch:b.moth==='perched'||reduced&&moth.visible?F11_MOTH_FROND:null,
      birdBow:Number(b.bow.toFixed(3)),birdBlink:Number(blink.toFixed(3)),birdIdle:Number(resting.toFixed(3)),boundToFrond:moth.visible&&(b.moth==='perched'||reduced)};
  };
  const dispose=()=>{
    const geos=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();
    root.traverse(n=>{if(n instanceof THREE.Mesh){geos.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])mats.add(m);}});
    geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());root.removeFromParent();
  };
  update(1,false);return {update,dispose};
}
