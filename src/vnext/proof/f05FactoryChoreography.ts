import * as THREE from 'three';

const ease=THREE.MathUtils.smoothstep;
export const factorySnagHoldSeconds=1.66;
const releaseAt=.79+factorySnagHoldSeconds;
const returnAt=3.10;

/** Gate the procedural work shift to B2, one task on the real line.
 * The normal rhythm clock holds until the folded strip is flat. */
export function readFactorySnag(bay:number,age:number,reduced:boolean){
  const staying=bay===2;
  const t=reduced?returnAt:age;
  const walk=staying?ease(t,.39,1.18)*(1-ease(t,releaseAt,returnAt)):0;
  const call=staying?ease(t,.56,.79)*(1-ease(t,1.07,1.28)):0;
  const hold=staying?ease(t,.82,1.0)*(1-ease(t,releaseAt,2.69)):0;
  const cohere=staying?ease(t,1.32,1.66)*(1-ease(t,2.13,2.44)):0;
  const crease=staying?ease(t,.52,.78)*(1-ease(t,1.66,2.38)):0;
  const open=staying?ease(t,1.14,1.40)*(1-ease(t,2.30,2.57)):0;
  const beat=!staying?'ordinary':t<.51?'approach':t<.82?'signal':t<1.32?'working-hold':
    t<2.38?'clear-strip':t<releaseAt?'reset-guard':t<returnAt?'resume':'settled';
  return {beat,walk,call,hold,cohere,crease,open,releaseAt};
}

export function makeF05FactorySnag(root:THREE.Group){
  const rust=new THREE.MeshStandardMaterial({color:0x713337,roughness:.87});
  const cut=new THREE.MeshStandardMaterial({color:0xd6ac77,roughness:.92});
  const dark=new THREE.MeshStandardMaterial({color:0x3f322d,roughness:.89});
  const label=new THREE.MeshStandardMaterial({color:0xceab74,roughness:.84});
  const group=new THREE.Group();group.name='B2 / physical work-line interruption';root.add(group);
  function put(p:THREE.Group,name:string,mat:THREE.Material,w:number,h:number,d:number,x:number,y:number,z:number){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;
  }
  // Continuous folded paper service board, between the two existing workers.
  put(group,'Laminated service board joined to the conveyor',dark,.91,.051,.162,1.28,.393,.211);
  put(group,'Kraft line scored at the service board edge',cut,.86,.015,.018,1.28,.426,.294);
  for(const x of [.88,1.65])put(group,'Folded service-bridge support',dark,.064,.094,.152,x,.337,.195);
  const stock=new THREE.Group();stock.name='Paper feed strip with the physical kink';stock.position.set(1.18,.444,.108);group.add(stock);
  put(stock,'Leading lip remains bonded to the feed',rust,.22,.023,.100,-.108,0,0);
  const kink=new THREE.Group();stock.add(kink);
  put(kink,'Crease that snags and flattens again',rust,.22,.029,.10,.11,0,0);
  put(kink,'Visible ink line follows the folded edge',cut,.194,.008,.019,.11,.018,.034);
  const tail=new THREE.Group();tail.position.x=.22;kink.add(tail);
  put(tail,'Trailing strip comes free of the narrow gate',rust,.175,.022,.10,.086,0,0);
  const guard=new THREE.Group();guard.name='Outlet interlock, held open by the downstream rig';
  guard.position.set(1.61,.445,.115);group.add(guard);
  put(guard,'Stop pin',dark,.059,.19,.057,0,.084,0);
  put(guard,'Paper-wrapped stop handle',label,.178,.025,.054,.08,.17,0);
  put(group,'Fixed keeper beneath the stop lever',cut,.124,.078,.098,1.61,.391,.129);
  return (state:ReturnType<typeof readFactorySnag>)=>{
    group.visible=state.beat!=='ordinary';
    kink.rotation.z=1.04*state.crease;
    tail.rotation.z=-1.68*state.crease;
    stock.position.z=.108+.045*state.cohere;
    guard.rotation.z=-.72*state.open+.24*state.hold;
  };
}

type Part={node:THREE.Object3D;position:THREE.Vector3;rotation:THREE.Quaternion};
function part(node:THREE.Object3D):Part{
  return {node,position:node.position.clone(),rotation:node.quaternion.clone()};
}
function reset(p:Part){p.node.position.copy(p.position);p.node.quaternion.copy(p.rotation);}
const partNamed=(root:THREE.Object3D,needle:string)=>root.children.filter(ch=>ch.name.includes(needle)).map(part);

export function bindF05Workers(gore:THREE.Object3D,ring:THREE.Object3D){
  const a=part(gore);
  const head=partNamed(gore,'angular armored scythe head')[0], supports=partNamed(gore,'rear crawler support');
  const arms=[...partNamed(gore,'hooked forelimb'),...partNamed(gore,'bone foreclaw')];
  const leverParts=['nozzle','column neck','extruding mineral column','cyan containment ring'].flatMap(needle=>partNamed(ring,needle));
  return (s:ReturnType<typeof readFactorySnag>,age:number)=>{
    const stepping=s.walk>0&&s.walk<.9999;
    const gait=stepping?age<1.18?(age-.39)/.79:(age-releaseAt)/(returnAt-releaseAt):0;
    // Travel on the native bay floor, not via a camera. Existing four
    // crawler supports lift in diagonal pairs. The downstream gantry
    // never moves its explicitly bonded feet.
    gore.position.copy(a.position);
    gore.position.x+=.41*s.walk;
    gore.position.z+=.23*s.walk;
    gore.rotateY(.54*s.walk);
    if(head){
      reset(head);
      head.node.rotateY(.46*s.call);
      head.node.rotateX(-.24*s.call+.31*s.cohere);
    }
    for(const [i,p] of supports.entries()){
      reset(p);
      const gaitPhase=(gait*2.5+(i===0||i===3?0:.5))%1;
      const lift=stepping?Math.max(0,Math.sin(gaitPhase*Math.PI*2))*.047*Math.sin(Math.PI*gait):0;
      p.node.position.y+=Math.max(0,lift);
      p.node.position.x+=stepping?.068*Math.sin(gaitPhase*Math.PI*2)*Math.sin(Math.PI*gait):0;
    }
    for(const [i,p] of arms.entries()){
      reset(p);
      // The right-side claw lifts for the signal; both claws press as the
      // worker reaches over the actual raised strip.
      const calling=i%2===0?s.call:0;
      p.node.position.y+=.16*calling-.045*s.cohere;
      p.node.position.x+=.12*s.cohere;
      p.node.position.z+=.12*s.cohere;
      p.node.rotateX(-.12*calling+.11*s.cohere);
    }
    for(const p of leverParts){
      reset(p);
      p.node.position.x-=.18*s.open;
      p.node.rotateZ(.13*s.hold+.22*s.open);
    }
    return {workerX:gore.position.x,workerZ:gore.position.z,receiverBraced:s.hold,clawRaised:s.call,sharedContact:s.cohere};
  };
}
