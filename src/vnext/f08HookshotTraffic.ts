import * as THREE from 'three';
import {createF08ClearanceCrew} from './f08ClearanceCrew.ts';
import {HOOKSHOT_PLANE,f08TrafficPhase,f08TrafficPosition,f08TrafficStep,restingF08Traffic} from './f08TrafficLogic.ts';

export function createF08HookshotTraffic(pageY:(x:number)=>number){
  const root=new THREE.Group();root.name='F08 anonymous folded traffic on a demonstrated paper route';root.visible=false;
  const paper=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.76,side:THREE.DoubleSide,flatShading:true});
  const ecru=paper(0xbba77a),cream=paper(0xdfd3af),dark=paper(0x253645),blue=paper(0x557383),brass=paper(0xc79052);
  const green=new THREE.MeshBasicMaterial({color:0x8bd8a3,toneMapped:false});
  const amber=new THREE.MeshBasicMaterial({color:0xc28b51,toneMapped:false});
  const vec=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
  function slab(owner:THREE.Object3D,w:number,h:number,d:number,material:THREE.Material,x=0,y=0,z=0,name=''){
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,z);o.name=name;owner.add(o);return o;
  }
  function fold(owner:THREE.Object3D,m:THREE.Material,xyz:number[][],indices:number[]){
    const geo=new THREE.BufferGeometry().setFromPoints(xyz.map(a=>vec(a[0],a[1],a[2])));geo.setIndex(indices);geo.computeVertexNormals();
    owner.add(new THREE.Mesh(geo,m));
  }
  const ship=new THREE.Group();ship.name='F08 travelling folded-card carrier · no new canon ID';root.add(ship);
  // A small folded service silhouette, not a named ship or character.
  fold(ship,dark,[[0,-.058,-.22],[-.176,-.015,-.095],[-.13,.017,.107],[0,.022,.236],[.13,.017,.107],[.176,-.015,-.095]],[0,1,2,0,2,3,0,3,4,0,4,5]);
  fold(ship,cream,[[0,.075,-.143],[0,.062,.231],[-.134,.005,.105],[-.180,.0,-.088],[.134,.005,.105],[.180,.0,-.088]],[0,1,2,0,2,3,0,4,1,0,5,4]);
  fold(ship,blue,[[-.176,-.015,-.095],[-.13,.017,.107],[0,.022,.236],[0,-.047,.032],[.13,.017,.107],[.176,-.015,-.095]],[0,1,3,1,2,3,3,2,4,3,4,5]);
  slab(ship,.036,.023,.215,ecru,0,.073,.017,'Raised central score on carrier');
  slab(ship,.10,.073,.12,blue,0,.036,-.111,'Anonymous cargo secured on the crease');
  slab(ship,.086,.026,.111,brass,0,.064,-.112,'Cargo lash, not thrust');
  function berth(x:number,z:number,lift:number,yaw:number){
    const dock=new THREE.Group();dock.position.set(x,pageY(x)+.026,z);dock.rotation.y=yaw;root.add(dock);
    dock.name=lift>.1?'F08 visible far-side receiving berth':'F08 approach cradle';
    const top=lift>.1?.42:.105;
    for(const sx of [-.17,.17]){
      slab(dock,.078,top,.19,dark,sx,top*.5);
      slab(dock,.087,.021,.252,brass,sx,top+.027,0);
    }
    slab(dock,.47,.045,.39,dark,0,top,0);
    slab(dock,.41,.013,.30,blue,0,top+.025);
    slab(dock,.48,.022,.03,ecru,0,top+.029,.184);
    const signal=slab(dock,.065,.029,.043,amber,-.21,top+.043,.16,'Small route release marker');
    return signal;
  }
  const signals=[berth(-1.05,1.67,0,.42),berth(-3.17,-1.19,.4,-1.61)];
  const clearance=createF08ClearanceCrew(pageY);root.add(clearance.root);
  let traffic={...restingF08Traffic};
  return {root,update(active:boolean,on:boolean,energy:number,dt:number,reduced:boolean){
    root.visible=active;
    if(!active)return;
    const nativeShuttersReady=on&&energy>.94;
    // An already-open saved scene keeps the pre-existing parked restore behavior.
    const crew=clearance.update(on,dt,reduced||(!traffic.started&&nativeShuttersReady));
    const permitted=nativeShuttersReady&&crew.clear;
    traffic=f08TrafficStep(traffic,on,permitted,dt,reduced);
    signals.forEach(s=>s.material=permitted?green:amber);
    const [x,y,z]=f08TrafficPosition(traffic.p);
    ship.position.set(x,y,z);
    const a=f08TrafficPosition(Math.max(0,traffic.p-.009)),b=f08TrafficPosition(Math.min(1,traffic.p+.009));
    const dx=(b[0]-a[0])*traffic.direction,dz=(b[2]-a[2])*traffic.direction,dy=(b[1]-a[1])*traffic.direction;
    const inFlight=THREE.MathUtils.smoothstep(traffic.p,.02,.12)*(1-THREE.MathUtils.smoothstep(traffic.p,.87,.995));
    ship.rotation.set(-Math.atan2(dy,Math.hypot(dx,dz))*.72*inFlight,Math.atan2(dx,dz),0,'YXZ');
    const phase=f08TrafficPhase(traffic,permitted);
    return {phase,permitted,nativeShuttersReady,crew,crossings:traffic.crossings,progress:traffic.p,x,y,z,plane:HOOKSHOT_PLANE};
  }};
}
