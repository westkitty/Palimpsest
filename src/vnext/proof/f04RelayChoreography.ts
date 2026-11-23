import * as THREE from 'three';

const ease=THREE.MathUtils.smoothstep;
const slowStart=30.2,slowEnd=38,slowRate=.22,end=38;
const slowSpan=(slowEnd-slowStart)/slowRate;
const asTravelClock=(f:number)=>f<=slowStart?f:f<=slowEnd?slowStart+(f-slowStart)/slowRate:slowStart+slowSpan+f-slowEnd;
const asNativeFrame=(t:number)=>t<=slowStart?t:t<=slowStart+slowSpan?slowStart+(t-slowStart)*slowRate:slowEnd+t-slowStart-slowSpan;

/** Stretch the actual last relay's clock, not a second, decorative light.
 * Because all poses read the same frame, pausing/revisiting mid-step is stable. */
export function advanceSignalledRelay(frame:number,travel:number):number{
  return Math.min(end,asNativeFrame(asTravelClock(frame)+Math.max(0,travel)));
}

const risers=[
  {x:.540,y:.098},{x:.638,y:.122},{x:.736,y:.154},{x:.834,y:.186},{x:.932,y:.218},
];
const treadsZ=.365;
export function readSignalledRelay(frame:number){
  const thru=ease(frame,30.0,30.18)*THREE.MathUtils.clamp((frame-30.12)/2.62,0,1);
  const sender=ease(frame,32.82,33.40)*(1-ease(frame,34.0,34.67));
  const acknowledge=ease(frame,33.37,33.77)*(1-ease(frame,34.35,34.9));
  const dispatch=ease(frame,34.34,34.75)*(1-ease(frame,36.0,36.65));
  const waits=ease(frame,36.25,36.85)*(1-ease(frame,37.12,38));
  const turns=ease(frame,35.7,36.58);
  const beat=frame<30.12?'ready':frame<32.82?'climb':frame<33.47?'call':frame<34.34?'acknowledge':frame<36.25?'release':frame<37.12?'wait':'dark-stop';
  return {thru,sender,acknowledge,dispatch,waits,turns,beat};
}

function footAt(thru:number,i:number){
  const count=risers.length-1;
  const swing=thru*count;
  let ix=0;
  for(let n=i;n<count;n+=2){
    const move=THREE.MathUtils.clamp((swing-n)/.82,0,1);
    const k=n+1;
    if(move===0)break;
    if(move===1){ix=k;continue;}
    const from=risers[ix],to=risers[k],p=ease(move,0,1);
    return new THREE.Vector3(THREE.MathUtils.lerp(from.x,to.x,p),
      THREE.MathUtils.lerp(from.y,to.y,p)+.068*Math.sin(Math.PI*p),treadsZ+(i?-.045:.045));
  }
  const point=risers[ix];
  return new THREE.Vector3(point.x,point.y,treadsZ+(i?-.045:.045));
}

export function makeF04RelayWorkers(stage:THREE.Group){
  const geometry=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>();
  const hingeY=new THREE.Vector3(0,1,0);
  const paper=(color:number)=>{
    const m=new THREE.MeshStandardMaterial({color,roughness:.9});materials.add(m);return m;
  };
  const gusset=paper(0x374845),edge=paper(0xb39563),copper=paper(0xc58a60),buff=paper(0xd6be90),
    graph=paper(0x293d3a),green=paper(0x638277),white=paper(0xe3d29f);
  const rig=new THREE.Group();rig.name='F04 / the last signal, folded stair and dispatch landing';stage.add(rig);
  function part(name:string,m:THREE.Material,g:THREE.BufferGeometry,p=rig){
    const mesh=new THREE.Mesh(g,m);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;p.add(mesh);geometry.add(g);return mesh;
  }
  function box(name:string,m:THREE.Material,w:number,h:number,d:number,x=0,y=0,z=0,p=rig){
    const mesh=part(name,m,new THREE.BoxGeometry(w,h,d),p);mesh.position.set(x,y,z);return mesh;
  }
  const liveInk=new THREE.MeshStandardMaterial({color:0xe7b76d,emissive:0xeb871c,emissiveIntensity:0,roughness:.8});materials.add(liveInk);
  const treads=risers.slice(1);
  for(const [i,p] of treads.entries()){
    box('Scored fold riser '+(i+1),gusset,.097,p.y-.061,.163,p.x,(p.y+.053)/2,treadsZ);
    box('Laminated tread '+(i+1),edge,.098,.012,.169,p.x,p.y-.006,treadsZ);
  }
  box('Bonded receiving platform',gusset,.29,.162,.225,1.118,.129,treadsZ);
  box('Kraft edge of receiving platform',edge,.285,.011,.227,1.118,.208,treadsZ);
  const dispatchBase=box('Signal press fixed to landing',graph,.089,.134,.082,1.100,.287,.377);
  const plunger=box('Actual movable signal press',liveInk,.062,.018,.052,1.100,.363,.377);

  function worker(prefix:string,jacket:THREE.Material){
    const body=new THREE.Group();body.name=prefix;rig.add(body);
    box(prefix+' / folded tunic',jacket,.114,.128,.059,0,.058,0,body);
    box(prefix+' / paper hem',graph,.119,.018,.063,0,.003,0,body);
    box(prefix+' / head silhouette',buff,.067,.072,.049,0,.155,0,body);
    box(prefix+' / folded cap',jacket,.089,.023,.059,0,.190,0,body);
    const shoulder=(side:number)=>{const g=new THREE.Group();g.position.set(side*.064,.10,.006);body.add(g);return g;};
    const wings=[shoulder(-1),shoulder(1)];
    for(const [i,w] of wings.entries()){
      box(prefix+' / crease at sleeve '+i,jacket,.033,.078,.041,0,-.032,0,w);
      box(prefix+' / mitten silhouette '+i,buff,.028,.027,.034,0,-.078,0,w);
    }
    const vane=box(prefix+' / hinged signal vane',white,.054,.072,.012,.013,-.098,.004,wings[1]);
    const legs=[0,1].map(i=>({
      shin:box(prefix+' / scored leg '+i,graph,.027,1,.039),
      foot:box(prefix+' / grounded boot '+i,graph,.068,.025,.046),
    }));
    return {body,wings,vane,legs};
  }
  const courier=worker('Anonymous sender',copper),operator=worker('Anonymous relay operator',green);
  const hip=new THREE.Vector3(),shinDir=new THREE.Vector3(),ankle=new THREE.Vector3();
  const target=new THREE.Vector3(),armDown=new THREE.Vector3(0,-1,0),aim=new THREE.Quaternion();
  function pose(w:ReturnType<typeof worker>,x:number,z:number,y:number,yaw:number,left:number,right:number,a:THREE.Vector3,b:THREE.Vector3,lean=0){
    w.body.position.set(x,y,z);w.body.rotation.set(0,yaw,lean);
    w.wings[0].rotation.z=left;w.wings[1].rotation.z=right;
    [a,b].forEach((point,i)=>{
      const l=w.legs[i];const s=i?1:-1;
      hip.set(Math.cos(yaw)*s*.029+x,y, -Math.sin(yaw)*s*.029+z);
      l.foot.position.copy(point);l.foot.position.y+=.013;l.foot.rotation.y=yaw;
      ankle.copy(point);ankle.y+=.024;
      l.shin.position.copy(ankle).lerp(hip,.5);shinDir.subVectors(hip,ankle);
      l.shin.scale.y=shinDir.length();l.shin.quaternion.setFromUnitVectors(hingeY,shinDir.normalize());
    });
  }
  const receiverA=new THREE.Vector3(1.151,.214,.393),receiverB=new THREE.Vector3(1.208,.214,.342);
  return {update(frame:number,lit:boolean){
    const {thru,sender,acknowledge,dispatch,waits,turns,beat}=readSignalledRelay(frame);
    const a=footAt(thru,0),b=footAt(thru,1);
    const settle=ease(frame,32.76,33.08);
    const landing=risers[risers.length-1];
    a.x=THREE.MathUtils.lerp(a.x,landing.x,settle);
    a.y=THREE.MathUtils.lerp(a.y,landing.y,settle)+.040*Math.sin(settle*Math.PI);
    const footY=a.y+(b.y-a.y)*.5;
    const x=THREE.MathUtils.lerp(.54,.924,thru);
    const walking=thru===0||thru===1?0:Math.sin(thru*Math.PI*4);
    pose(courier,x,treadsZ,footY+.104,-.17+turns*.56,-.27*walking,.25*walking+2.07*sender,a,b,-.11*walking+.12*sender);
    courier.vane.rotation.z=.37+.24*sender;
    pose(operator,1.182,treadsZ,.322,1.0-1.57*turns,-.75*dispatch,1.70*acknowledge+1.24*waits,receiverA,receiverB,-.11*dispatch);
    // Actual press articulates with the operator. It is visibly struck
    // before the native B5 lamp animation (frame 35–36); the dark spur
    // never gets an emitter.
    plunger.position.y=.363-.018*dispatch;
    if(dispatch>0){
      const arm=operator.wings[0];
      operator.body.updateWorldMatrix(true,false);
      target.copy(plunger.position);target.y+=.017;
      operator.body.worldToLocal(rig.localToWorld(target)).sub(arm.position);
      const length=target.length();
      aim.setFromUnitVectors(armDown,target.normalize());
      arm.quaternion.slerp(aim,dispatch);
      arm.scale.y=THREE.MathUtils.lerp(1,THREE.MathUtils.clamp(length/.078,.9,1.27),dispatch);
    }else operator.wings[0].scale.y=1;
    dispatchBase.rotation.z=.035*dispatch;
    liveInk.emissiveIntensity=.65*dispatch;
    rig.userData.stage=beat;
    return {beat,climberX:x,climberHeight:footY,call:sender,acknowledge,dispatch,waits,signalLowered:frame>=37.75,relayFiveLit:lit};
  },dispose(){
    rig.removeFromParent();geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }};
}
