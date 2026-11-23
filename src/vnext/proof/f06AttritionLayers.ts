import * as THREE from 'three';

const WEAR_KEY='palimpsest.living.f06.paper-wear.v1';
const TEAR_KEY='palimpsest.living.f06.crossing-tear.v1';
let sessionWear=0, crossingTorn=false;
function readTear():boolean{
  try{return crossingTorn||sessionStorage.getItem(TEAR_KEY)==='1';}catch{return crossingTorn;}
}
function recordTear():void{
  crossingTorn=true;
  try{sessionStorage.setItem(TEAR_KEY,'1');}catch{ /* retain for this reader */ }
}
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
function previousWear():number{
  try{
    const raw=Number(sessionStorage.getItem(WEAR_KEY)??0);
    return Number.isInteger(raw)&&raw>=0&&raw<=15?raw|sessionWear:sessionWear;
  }catch{return sessionWear;}
}
export function resetF06TerrainWear():void{
  sessionWear=0;crossingTorn=false;
  try{sessionStorage.removeItem(WEAR_KEY);sessionStorage.removeItem(TEAR_KEY);}catch{ /* optional local study evidence */ }
}
function recordWear(mask:number):void{
  sessionWear=mask;
  try{sessionStorage.setItem(WEAR_KEY,String(mask));}catch{ /* no route to durable session storage */ }
}
const paper=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.91,side:THREE.DoubleSide});
function box(root:THREE.Object3D,name:string,w:number,h:number,d:number,material:THREE.Material,x=0,y=0,z=0) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;
}
function joinedEdge(root:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,diameter:number,material:THREE.Material,name:string) {
  const shape=box(root,name,a.distanceTo(b),diameter,diameter,material);
  shape.position.copy(a).lerp(b,.5);
  shape.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),b.clone().sub(a).normalize());
}
const points=(ps:readonly [number,number][])=>ps.map(([x,z])=>new THREE.Vector3(x,0,z));
const routes=[
  points([[-1.02,.27],[-.62,.06],[-.26,.18],[.22,-.037],[.51,.017],[.96,-.18]]),
  points([[-1.03,-.22],[-.82,-.075],[-.48,-.09],[-.15,-.255],[.27,-.19],[.77,.014],[1.03,.113]]),
  points([[-.87,.18],[-.54,.28],[-.16,.14],[-.04,.022],[.31,.12],[.56,-.043],[.93,-.10]]),
  points([[-1.03,.087],[-.60,-.14],[-.25,-.074],[.099,-.155],[.46,-.01],[.73,.19],[1.03,.21]]),
] as const;

function cutStock(root:THREE.Object3D,name:string,outline:readonly [number,number][],thick:number,material:THREE.Material){
  const shape=new THREE.Shape(outline.map(([x,z])=>new THREE.Vector2(x,-z)));
  const geom=new THREE.ExtrudeGeometry(shape,{depth:thick,bevelEnabled:false,steps:1,curveSegments:1});
  geom.rotateX(-Math.PI/2);
  const m=new THREE.Mesh(geom,material);
  m.name=name;m.castShadow=m.receiveShadow=true;root.add(m);return m;
}
const ease=(x:number)=>THREE.MathUtils.smoothstep(clamp(x),0,1);
const stress=[.065,.33,.66,1] as const;

const weatherProfiles=[
  {name:'sheer-air',speed:1.28,amplitude:.11,lean:.04,height:.060,color:0x9bc0c1,fold:.17},
  {name:'driving-gust',speed:2.84,amplitude:.32,lean:.29,height:.049,color:0xb4aaa0,fold:.42},
  {name:'low-grit',speed:3.97,amplitude:.24,lean:-.27,height:.018,color:0xb28060,fold:.28},
  {name:'lee-eddies',speed:2.05,amplitude:.20,lean:.12,height:.024,color:0xc39068,fold:.60},
] as const;
export function f06CrossingAir(era:number,time:number,reduced:boolean,index:number){
  const p=weatherProfiles[era];
  const t=(reduced?0:time*p.speed)+index*.93;
  const gust=Math.sin(t) + .31*Math.sin(t*2.08-.92);
  const point=Math.cos(t+.39);
  return {kind:p.name,color:p.color,roll:p.lean+p.amplitude*gust,
    twist:p.lean*.55+point*p.amplitude*.88,flex:p.fold+gust*p.amplitude*.94,
    height:p.height+point*.028};
}
function crossingWeather(parent:THREE.Group){
  const root=new THREE.Group();root.name='F06 air in the lee of the one crossing';parent.add(root);
  root.position.set(-.49,.17,-.125);
  const cut=paper(0x9c8063);
  // Story air is made of folded paper and retains its same attachment,
  // rather than throwing independent particles or moving the camera.
  box(root,'Bonding pad for the folded air study',.17,.029,.16,cut,0,-.026,0);
  const base=paper(0x9bc0c1);
  const troops=[0,1,2].map(i=>{
    const joint=new THREE.Group();joint.position.set(i*.078,.011+i*.054,-i*.086);root.add(joint);
    const body=cutStock(joint,'Scored crossing air ribbon',
      [[0,-.026],[.24,-.049],[.39,-.036],[.38,.045],[.20,.055],[0,.032]],.010,base);
    const tipPivot=new THREE.Group();tipPivot.position.set(.36,.004,0);joint.add(tipPivot);
    const tip=cutStock(tipPivot,'Tip beyond the same air crease',
      [[0,-.032],[.19,-.040],[.38,-.014],[.34,.019],[.17,.047],[0,.040]],.010,base);
    body.castShadow=tip.castShadow=false;
    return {joint,tipPivot};
  });
  let time=0,previous=-1;
  return (era:number,dt:number,reduced:boolean)=>{
    if(era!==previous){time=0;previous=era;}
    if(!reduced)time+=Math.min(.12,Math.max(0,dt));
    const still=f06CrossingAir(era,time,reduced,0);
    base.color.setHex(still.color);
    for(const [i,{joint,tipPivot}] of troops.entries()){
      const a=f06CrossingAir(era,time,reduced,i);
      joint.position.y=.014+i*.048+a.height;
      joint.rotation.z=a.roll;
      joint.rotation.y=a.twist-.13*i;
      tipPivot.rotation.z=a.flex;
      tipPivot.rotation.y=-a.twist*.84;
    }
    return {weather:still.kind,weatherRoll:Math.round(still.roll*1000)/1000};
  };
}

function tornCrossingStock(crossing:THREE.Group){
  const root=new THREE.Group();root.name='F06 through-cut crossing stock and attached torn flap';crossing.add(root);
  root.position.y=-.033;
  const faced=paper(0x8d7161),fold=paper(0xa38869),pulp=paper(0xebcf9f),depth=paper(0x624139);
  const shared:[number,number][]=[[-.04,-.23],[.025,-.155],[-.071,-.092],[.06,-.005],[-.03,.083],[.070,.148],[.011,.23]];
  // The stock patches meet at the scored line on arrival. They are actual
  // solids with complementary cut contours, not an overlaid black decal.
  const leftRim=cutStock(root,'Fixed left pulp edge until the crossing gives',
    [[-.47,-.23],...shared,[-.47,.23]],.027,pulp);
  const left=cutStock(root,'Fixed crossing stock outside the rupture',
    [[-.47,-.23],...shared.map(([x,z])=>[x-.018,z] as [number,number]),[-.47,.23]],.014,faced);
  left.position.y=.023;
  const anchor=new THREE.Group();anchor.name='F06 torn stock still bonded at outer right crease';
  anchor.position.set(.46,.006,0);root.add(anchor);
  const right=shared.map(([x,z])=>[x-.46,z] as [number,number]);
  cutStock(anchor,'Exposed inner paper ply on the attached flap',[...right,[.009,.23],[.009,-.23]],.027,pulp);
  cutStock(anchor,'Attached flap outer face',[...right.map(([x,z])=>[x+.017,z] as [number,number]),[.009,.23],[.009,-.23]],.014,fold).position.y=.023;
  box(root,'Remaining paper hinge saddle',.076,.038,.44,depth,.477,.011,0);
  const strands=right.slice(1,-1).map(([x,z],i)=>{
    const e=box(anchor,'One exposed pulp fiber still on the lifted edge',.060+i*.010,.020,.012,pulp,x-.020,.018,z);
    e.rotation.y=.35*(i%2===0?1:-1);
    return e;
  });
  let permanent=readTear(),tear=permanent?.43:0;
  return (era:number,stressNow:number,dt:number,reduced:boolean)=>{
    const opening=era===3?ease((stressNow-.80)/.18):0;
    // A completed rupture persists as a local scar, but does not change any
    // selected-era geography reading, print or casualties in the ledger.
    if(opening>=.80&&!permanent){permanent=true;recordTear();}
    const goal=Math.max(opening,permanent?.43:0);
    const rate=Math.max(0,dt)*4.6;
    tear=reduced?goal:tear+Math.sign(goal-tear)*Math.min(Math.abs(goal-tear),rate);
    leftRim.position.x=-.05*tear;left.position.x=leftRim.position.x;
    anchor.rotation.z=-1.02*tear;
    anchor.rotation.x=.12*tear;
    for(const [i,e] of strands.entries()){
      e.visible=tear>.12;e.scale.x=.25+.75*tear;e.rotation.z=(i%2?-.24:.21)*tear;
    }
    return {crossingTorn:permanent,tearOpen:Math.round(tear*1000)/1000};
  };
}
// These are four readings of the same teaching stock, not four planets,
// reconstructed events, dated battle sites or a scale of casualties.
export function attachF06AttritionTerrain(parent:THREE.Object3D){
  const relief=new THREE.Group();
  relief.name='F06 one accumulating schematic campaign relief';
  relief.position.set(-1.78,.235,-1.11);
  relief.scale.set(1.10,1,1.08);
  parent.add(relief);
  const cut=paper(0xbf8a60), back=paper(0x202531), inset=paper(0x392b2e);
  const ivory=paper(0xd9b985), underside=paper(0x9c694a), deepRust=paper(0x7e4b43);
  const calm=new THREE.Color(0x577c82), exhausted=new THREE.Color(0x8a5046);
  const airFair=new THREE.Color(0x81a3a5), airWorn=new THREE.Color(0x744c50), silt=new THREE.Color(0xab876b);
  box(relief,'Bonded relief base',2.77,.045,1.13,back);
  box(relief,'Paper mat exposed below broken earth',2.69,.027,1.04,inset,0,.026);
  // Thick, fixed substrate stays visible through opened terrain seams.
  const terrain=Array.from({length:8},(_,i)=>{
    const rib=new THREE.Group();
    rib.name='F06 original geography · layered stock rib '+(i+1);
    relief.add(rib);
    const x=(i-3.5)*.302;
    const wav=(i%3-1)*.047;
    const outline:[number,number][]=[
      [-.158,-.39+wav],[-.104,-.52+wav],[.142,-.47-wav],[.155,-.26+wav],
      [.124,-.08-wav],[.162,.15+wav],[.133,.32-wav],[.088,.43+wav],
      [-.155,.36-wav],[-.136,.16+wav],[-.163,-.08-wav],
    ];
    const face=paper(0x547982);
    cutStock(rib,'Through-cut earth fibers · exposed edge',outline,.031,cut);
    cutStock(rib,'Pressed geographic surface · same shoreline',outline,.035,face).position.y=.030;
    const cap=cutStock(rib,'Original raised foothill face',
      [[-.13,-.37+wav],[-.037,-.48],[.094,-.35],[.125,-.24],[-.015,-.13+wav],[-.12,-.22]],
      .042,face);
    cap.position.y=.060;cap.rotation.z=(i%3-1)*.13;
    return {rib,face,x,buckle:[-.08,.19,-.31,.24,-.18,.30,-.14,.09][i],sink:[.024,.065,.015,.042,.082,.037,.055,.012][i]};
  });
  // One physical crossing over the fixed cut lines. The same two attached
  // bridge leaves buckle and lose alignment; the underlying paper ribs stay.
  const crossing=new THREE.Group();crossing.name='F06 infrastructure · the same joined crossing';relief.add(crossing);
  crossing.position.set(.095,.123,.20);
  const bridges=[-1,1].map(side=>{
    const hinge=new THREE.Group();hinge.name='Tethered road fold '+side;hinge.position.x=side*.475;
    crossing.add(hinge);
    box(hinge,'Pasted infrastructure support',.082,.083,.21,underside,0,-.041,0);
    box(hinge,'Physical deck half across the fault',.48,.036,.18,ivory,-side*.236,0,0);
    box(hinge,'Scored deck edge',.465,.024,.027,cut,-side*.232,.016,-.086);
    return hinge;
  });
  const weather=crossingWeather(crossing),tearStock=tornCrossingStock(crossing);
  const brace=cutStock(relief,'Countermeasure: low bonded paper stitch across worn cut',
    [[-.39,.29],[-.16,.19],[.46,.23],[.44,.33],[-.14,.31],[-.48,.395]],.024,deepRust);
  // At the back of the same relief, air is scored as thin horizontal stock,
  // curving and lowering into a dirty front instead of adding a second scene.
  const atmosphere=new THREE.Group();
  atmosphere.name='F06 climate stress · hinged archival paper band';
  atmosphere.position.set(.02,.24,-.46);relief.add(atmosphere);
  const air=paper(0x81a3a5),front=paper(0xc5ac8b);
  const bands=[0,1,2].map(i=>{
    const n=new THREE.Group();
    n.name='Climate pressure paper joint '+(i+1);
    n.position.set(-.26+i*.26,i*.067,-i*.022);
    atmosphere.add(n);
    const outline:[number,number][]=[[-.94,-.09],[-.72,-.175],[-.39,-.106],[-.20,-.161],[.13,-.098],
      [.36,-.15],[.83,-.052],[.92,.037],[.52,.121],[.18,.072],[-.15,.136],[-.48,.082],[-.82,.09]];
    cutStock(n,'Scored folded climate stock',outline,.019,i===0?front:air);
    return n;
  });
  for(const x of [-.67,.63]){
    box(relief,'Permanent folded back hinge foot',.13,.083,.21,deepRust,x,.102,-.43);
    box(relief,'Paper web from fixed foot to climate hinge',.055,.195,.069,underside,x,.181,-.46).rotation.z=x*.15;
  }
  const older:THREE.MeshStandardMaterial[]=[];
  const tracks=routes.map((route,i)=>{
    const layer=new THREE.Group();layer.name='A archive crease layer '+(i+1);relief.add(layer);layer.position.y=.094+i*.003;
    const ink=paper(0x827c71);older.push(ink);
    for(let j=0;j<route.length-1;j++)joinedEdge(layer,route[j],route[j+1],.020,ink,'Pressed archive route edge');
    return layer;
  });
  let seen=previousWear(), sight=0, last=-1, from=0, shown=0;
  function update(era:number,seconds:number,reduced:boolean) {
    if(last!==era){
      const next=seen|(1<<era);
      if(next!==seen){seen=next;recordWear(seen);}
      from=last<0?stress[era]:shown;
      sight=last<0||reduced?1:0;
      last=era;
    }
    sight=reduced?1:clamp(sight+seconds*1.23);
    shown=THREE.MathUtils.lerp(from,stress[era],ease(sight));
    const stamp=1-sight;
    const age=tracks.filter((_,i)=>Boolean(seen&(1<<i))).length;
    tracks.forEach((g,i)=>{
      g.visible=Boolean(seen&(1<<i));
      g.position.y=.129+i*.003-.052*shown;
      older[i].color.setHex(i===era?0xca966b:i%2===0?0x858d90:0x8a675d);
    });
    terrain.forEach(({rib,face,x,buckle,sink},i)=>{
      const w=reduced||sight>=1?0:Math.sin(Math.PI*clamp((sight-i*.037)*2.6))*stamp;
      rib.position.set(x*(1+.072*shown),.047-.51*sink*shown+.038*w,(i%2?.034:-.036)*shown);
      rib.rotation.set(-buckle*.49*shown,.19*buckle*shown,buckle*shown+.14*w);
      face.color.copy(calm).lerp(exhausted,clamp(shown*.81+((i%3)-1)*.20));
    });
    const lead=ease((shown-.18)/.81);
    bridges.forEach((hinge,i)=>{
      hinge.rotation.z=(i===0?-.64:.45)*lead;
      hinge.rotation.y=(i===0?.38:-.27)*lead;
      hinge.position.y=(i===0?.048:-.096)*lead;
    });
    brace.position.y=.058;brace.visible=shown>.63;
    air.color.copy(airFair).lerp(airWorn,shown*.90);
    front.color.copy(airFair).lerp(silt,shown*.90);
    atmosphere.rotation.x=.17+.77*shown+(reduced?0:stamp*.10);
    atmosphere.position.y=.24+.074*shown;
    bands.forEach((band,i)=>{
      band.rotation.z=(i%2?-.36:.19)*shown;
      band.position.z=-i*.022+.112*shown*(1-i*.17);
    });
    // The pressed bridge/base get darker by use, even if an earlier
    // historical reading is reselected. No future physical state is projected.
    cut.color.setHex(age>2?0xa17055:0xc28d63);
    return {wearMask:seen,routeLayerCount:age,paperRipple:stamp,terrainStress:shown,...weather(era,seconds,reduced),...tearStock(era,shown,seconds,reduced),
      climateCurl:atmosphere.rotation.x,bridgeFailure:lead,geographyRibs:terrain.length};
  }
  return {update};
}

/** Make a true die-cut through the authored outer sheet; underlying pulp is blank. */
export function cutF06UnknownLossCells(leaves:readonly THREE.Object3D[]):number {
  const backing=paper(0x201f25),cutEdge=paper(0xb59677);
  let made=0;
  for(const leaf of leaves.slice(1,5)){
    const face=leaf.children.find((n):n is THREE.Mesh=>n instanceof THREE.Mesh&&/^diecutleaf/.test(n.name.toLowerCase().replace(/[^a-z0-9]/g,'')));
    if(!face)continue;
    const rect=(minX:number,minY:number,maxX:number,maxY:number)=>[
      new THREE.Vector2(minX,minY),new THREE.Vector2(maxX,minY),new THREE.Vector2(maxX,maxY),new THREE.Vector2(minX,maxY),
    ];
    const shape=new THREE.Shape(rect(-.7,0,.7,.47));
    const hole=new THREE.Path(rect(-.268,.271,.268,.352).reverse());
    shape.holes.push(hole);
    const cut=new THREE.ExtrudeGeometry(shape,{depth:.027,bevelEnabled:false,steps:1,curveSegments:1});
    cut.rotateX(Math.PI/2);cut.translate(0,.0135,0);cut.computeVertexNormals();
    face.geometry.dispose();face.geometry=cut;
    face.name='F06 die-cut blank archival aperture';
    // Matte lower fiber stops the eye without supplying missing numbers.
    box(leaf,'Underlying blank intact account pulp',.57,.014,.106,backing,0,-.036,.312);
    for(const side of [-1,1])box(leaf,'Visible thin substrate along unprinted window edge',.016,.014,.091,cutEdge,side*.275,-.015,.312);
    made++;
  }
  return made;
}
