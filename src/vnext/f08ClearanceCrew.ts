import * as THREE from 'three';
import {clearanceCrewClock,clearanceCrewPose,f08CrewRoute} from './f08ClearanceCue.ts';
import {paperFoot} from './folioPaperProcession.ts';

export function createF08ClearanceCrew(pageY:(x:number)=>number){
  const root=new THREE.Group();root.name='F08 · Administration exhibit ground clearance vignette';
  const stock=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.81,side:THREE.DoubleSide,flatShading:true});
  const dark=stock(0x333e43), khaki=stock(0x8c9f91), ochre=stock(0xb88454), pale=stock(0xd8c294);
  const indigo=stock(0x344958), brass=stock(0xcaa873);
  function piece(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0){
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  function cut(parent:THREE.Object3D,w:number,h:number,d:number,material:THREE.Material,x=0,y=0,z=0){
    return piece(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);
  }
  // A strip pinned at both ends, an actual lane on the paper, not a HUD.
  const stageBase=-1.66, zBase=1.26;
  cut(root,1.94,.013,.14,indigo,-1.66,pageY(stageBase)+.013,zBase);
  for(const x of [-1.92,-1.40]){
    cut(root,.031,.014,.36,brass,x,pageY(x)+.015,zBase).rotation.y=.13;
  }
  for(const x of [-2.55,-.73]){
    cut(root,.15,.016,.19,dark,x,pageY(x)+.021,zBase);
    cut(root,.11,.005,.011,pale,x,pageY(x)+.033,zBase+.071);
  }
  const scale=1.24;
  const figures=f08CrewRoute.map((_,i)=>{
    const body=new THREE.Group();body.name=i===0?'F08 · anonymous lane spotter guiding partner':'F08 · anonymous lane spotter following safe lead';
    root.add(body);body.scale.setScalar(scale);
    const coat=piece(body,new THREE.CylinderGeometry(.067,.091,.147,5),i===0?ochre:khaki,0,.168,0);
    coat.rotation.y=.31;
    cut(body,.079,.025,.015,pale,0,.206,.067);
    const head=piece(body,new THREE.IcosahedronGeometry(.042,0),pale,0,.266,.007);
    head.scale.set(.89,1.16,.94);
    piece(body,new THREE.CylinderGeometry(.045,.054,.027,5),dark,0,.299,-.002);
    const legs=[-1,1].map(()=>{
      const boot=cut(root,.049,.024,.089,dark);
      const shank=cut(root,.038,1,.031,i===0?dark:indigo);
      return {boot,shank};
    });
    const elbows=[-1,1].map(()=>({
      upper:cut(root,.033,1,.031,i===0?ochre:khaki),
      lower:cut(root,.031,1,.028,pale),
    }));
    return {body,legs,elbows};
  });
  let clock=0;
  const up=new THREE.Vector3(0,1,0);
  const vec=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
  function hinge(bar:THREE.Mesh,a:THREE.Vector3,b:THREE.Vector3){
    const d=b.clone().sub(a);
    bar.position.copy(a).lerp(b,.5);
    bar.scale.y=d.length();
    bar.quaternion.setFromUnitVectors(up,d.normalize());
  }
  const surface=(x:number)=>pageY(x)+.024;
  return {root,update(on:boolean,dt:number,snap:boolean){
    clock=clearanceCrewClock(clock,on,dt,snap);
    const cue=clearanceCrewPose(clock);
    const [lead,partner]=cue.positions;
    const meet=vec((lead[0]+partner[0])*.5-.015,(surface(lead[0])+surface(partner[0]))*.5+.159*scale,(lead[1]+partner[1])*.5+.012);
    const hands:THREE.Vector3[]=[];
    const legsLift:number[][]=[];
    for(const [i,figure] of figures.entries()){
      const [x,z]=cue.positions[i];
      const y=surface(x),yaw=1.40-.31*cue.grip;
      figure.body.position.set(x,y,z);figure.body.rotation.set(0,yaw,(i===0?-.13:.14)*cue.grip);
      const base=clock<1.30?0:1;
      const move=base===0?cue.advance:cue.assist;
      const [from,to]=[f08CrewRoute[i][base],f08CrewRoute[i][base+1]];
      const lifts:number[]=[];
      figure.legs.forEach(({boot,shank},j)=>{
        const [step,raise]=paperFoot(move,3,j as 0|1),side=(j-.5)*.079;
        const sx=from[0]+(to[0]-from[0])*step+Math.cos(yaw)*side;
        const sz=from[1]+(to[1]-from[1])*step-Math.sin(yaw)*side;
        const sy=surface(sx)+raise*.033;
        boot.position.set(sx,sy+.012,sz);boot.rotation.y=yaw;
        hinge(shank,vec(sx,sy+.023,sz),vec(x+Math.cos(yaw)*side,y+.109*scale,z-Math.sin(yaw)*side));
        lifts.push(raise);
      });
      legsLift.push(lifts);
      figure.elbows.forEach(({upper,lower},j)=>{
        const side=(j-.5)*.159;
        const shoulder=vec(x+Math.cos(yaw)*side,y+.221*scale,z-Math.sin(yaw)*side);
        const armSwing=Math.sin(move*Math.PI*6)*(j===0?1:-1)*.031;
        const wrist=shoulder.clone().add(vec(.022+armSwing,-.094*scale,.020));
        if(j===i){wrist.lerp(meet,cue.grip);hands.push(wrist.clone());}
        else wrist.x+=cue.grip*.026;
        const elbow=shoulder.clone().lerp(wrist,.5).add(vec(-.026,-.009,j===0?-.026:.026));
        hinge(upper,shoulder,elbow);hinge(lower,elbow,wrist);
      });
    }
    return {phase:cue.phase,clear:cue.clear,grip:cue.grip,
      positions:cue.positions,lifts:legsLift,gripGap:hands[0].distanceTo(hands[1])};
  }};
}
