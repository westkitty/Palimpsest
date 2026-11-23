import * as THREE from 'three';

type Point = [number, number];
type Stock = (x:number)=>number;
export const F11_GUTTER_PLANT=22;
export const F11_GUTTER_MARK={x:.05*.70,z:.59*.73} as const;
export const f11Ease=(from:number,to:number,at:number)=>THREE.MathUtils.smoothstep(at,from,to);
const mix=THREE.MathUtils.lerp;

export function f11WitnessClip(frame:number):number {
  // The same rooted native stem starts unfolding from its known floor after the
  // pilot hits the gutter, early enough to read before the rest of the forest.
  if(frame<60)return 1;
  if(frame<70)return THREE.MathUtils.lerp(57,73,(frame-60)/10);
  if(frame<86)return THREE.MathUtils.lerp(73,86,(frame-70)/16);
  return frame;
}

export function f11PaperBeats(frame:number) {
  return {
    patch:f11Ease(17,25,frame),
    fibers:f11Ease(34,39,frame)*(1-f11Ease(64,74,frame)),
    redirected:f11Ease(39,53,frame),
    gutterRoot:f11Ease(49,60,frame),
    roots:f11Ease(62,68,frame),
    split:f11Ease(63,72,frame),
    canopy:f11Ease(72,88,frame),
    close:f11Ease(76,94,frame)*(1-f11Ease(95,106,frame)),
    parted:f11Ease(95,106,frame),
    withdraw:f11Ease(129,151,frame),
  };
}

export function createF11StoryPaper(pageY:Stock) {
  const root=new THREE.Group();root.name='F11 grounded stock, gravity and slit proof';
  const stock=(color:number,emissive=0)=>new THREE.MeshStandardMaterial({
    color,roughness:.93,emissive:color,emissiveIntensity:emissive,side:THREE.DoubleSide,flatShading:true});
  const slate=stock(0x26252a), ash=stock(0x50484b), ashEdge=stock(0x75675e), black=stock(0x19191d);
  const soil=stock(0x6d3d25), polish=stock(0x9b6a40);
  const fibers=[stock(0x87bbbc,.36),stock(0xc1c7a2,.21)];
  const vein=[stock(0xbf9762,.13),stock(0xa69a65,.10),stock(0x77553a,.08)];
  const vec=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
  const group=(name:string)=>{const g=new THREE.Group();g.name=name;root.add(g);return g;};
  function mesh(g:THREE.BufferGeometry,m:THREE.MeshStandardMaterial,p:THREE.Group,name:string) {
    const o=new THREE.Mesh(g,m);o.name=name;p.add(o);return o;
  }
  function facets(p:THREE.Group,name:string,pts:THREE.Vector3[],idx:number[],m:THREE.MeshStandardMaterial){
    const geo=new THREE.BufferGeometry().setFromPoints(pts);geo.setIndex(idx);geo.computeVertexNormals();
    return mesh(geo,m,p,name);
  }
  const land=group('F11 unplanted volcanic scar stock');
  // The crater and the book stock stay fixed. These folded ash ribs sit on
  // their stock as a foreground relief, outside the actor foot / lever lanes.
  const ridges:Array<[number,number,number,number,number,number]>=[
    [-2.85,-1.40,.94,.31,.77,.23],[-2.54,-1.09,.57,.18,.51,.37],[-2.77,-.67,.54,.15,.29,-.36],
    [-2.73,.02,.62,.20,.34,1.12],[-2.70,.59,.67,.11,.19,-.30],[-2.42,.72,.43,.13,.18,-.55],
    [2.73,-1.31,.91,.31,.81,-.15],[2.52,-1.04,.57,.22,.49,-.46],[2.74,-.69,.72,.19,.34,.45],
    [2.72,-.06,.63,.15,.26,-.7],[2.61,.49,.77,.14,.20,.49],[2.42,.72,.35,.07,.16,-.45],
    [-.92,-1.53,.96,.27,.55,-.12],[.1,-1.56,.87,.28,.51,.24],[1.04,-1.58,.96,.26,.54,-.09],
  ];
  for(const [i,[x,z,w,d,h,a]] of ridges.entries()){
    const o=new THREE.Group();o.position.set(x,pageY(x)-.013,z);o.rotation.y=a;land.add(o);
    const points=[vec(-w/2,0,d*.32),vec(w*.52,0,d*.44),vec(w*.41,0,-d*.58),vec(-w*.54,0,-d*.45),
      vec(-w*.09,h,0),vec(w*.22,h*.47,d*.12)];
    facets(o,'Ash reverse fold',points,[0,3,4,3,2,4,2,5,4,2,1,5],slate);
    facets(o,'Ash illuminated fold',points,[0,4,5,0,5,1],i%4===1?ashEdge:ash);
  }
  function ribbon(p:THREE.Group, name:string, count:number, width:number, m:THREE.MeshStandardMaterial) {
    const a=new THREE.Float32BufferAttribute(new Float32Array(count*6),3);a.setUsage(THREE.DynamicDrawUsage);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',a);
    geo.setIndex(Array.from({length:count-1},(_,i)=>{const n=i*2;return [n,n+2,n+1,n+1,n+2,n+3];}).flat());
    const item=mesh(geo,m,p,name);item.frustumCulled=false;
    return (track:(i:number,t:number)=>THREE.Vector3, draw=1)=>{
      const n=THREE.MathUtils.clamp(Math.ceil((count-1)*draw),0,count-1);
      geo.setDrawRange(0,n*6);item.visible=n>0;
      if(!n)return;
      let prev=track(0,0);
      for(let i=0;i<count;i++){
        const current=i?track(i,i/(count-1)):prev;
        const to=i+1<count?track(i+1,(i+1)/(count-1)):current.clone().add(current.clone().sub(prev));
        const dx=to.x-prev.x,dz=to.z-prev.z,len=Math.max(Math.hypot(dx,dz),.0001);
        const w=width*(.19+.81*Math.sin(Math.PI*(.06+i/(count-1)*.90)));
        a.setXYZ(i*2,current.x-dz*w/len,current.y,current.z+dx*w/len);
        a.setXYZ(i*2+1,current.x+dz*w/len,current.y,current.z-dx*w/len);
        prev=current;
      }
      a.needsUpdate=true;geo.computeVertexNormals();
    };
  }
  // Angular dark score lines remain after flowering without implying other vegetation.
  for(const [i,[x,z,dx,dz]] of [[-2.59,.53,1.30,-.58],[-2.75,-.50,1.51,.55],[2.65,.67,-1.09,-.55],
    [2.59,-.51,-.92,.69],[-1.83,-1.52,.83,.48],[1.58,-1.48,-.75,.35]].entries()){
    const crack=ribbon(land,'Dry ash score',8,i%2?.019:.026,black);
    crack((j,t)=>vec(x+t*dx,pageY(x+t*dx)+.009,z+t*dz+Math.sin(j*2.7+i)*.085));
  }

  const cx=-.26,cz=-.145;
  const patch=group('F11 Codec single first-dirt patch at cylinder foot');patch.position.set(cx,pageY(cx)+.012,cz);
  facets(patch,'Single dry-side loam sheet',[vec(-.36,0,.10),vec(-.27,0,.25),vec(.23,0,.28),vec(.33,0,.03),vec(.21,0,-.19),
    vec(-.11,0,-.21),vec(-.29,0,-.11),vec(0,.025,.04)],[0,1,7,1,2,7,2,3,7,3,4,7,4,5,7,5,6,7,6,0,7],soil);
  const grains=[[.16,.14],[-.14,.16],[-.26,.05],[.19,.01],[.02,.22],[-.2,-.04]];
  for(const [i,[x,z]] of grains.entries()){
    const flake=mesh(new THREE.TetrahedronGeometry(.032+i%3*.006),i%2?soil:polish,patch,'Single patch raised clay granule');
    flake.position.set(x,.024,z);flake.scale.set(1.4,.33,.83);flake.rotation.y=i*.94;
  }

  const gravity=group('F11 Marcel redirects paper fibers before roots');
  const strands=Array.from({length:5},(_,i)=>ribbon(gravity,'Redirectable scored paper fiber',24,.010+i%2*.003,fibers[i%2]));
  // One identifiable thick cut-paper root descends from Codec’s actual soil.
  // The elbow follows the binding before terminating at the native PLANT_22 foot.
  // Keep this exact root and the same three small branches through the final hold.
  const witness=group('F11 one pilot root enters the gutter');
  const markedFiber=stock(0xb49352),markedEdge=stock(0xe7bc68),markedSide=stock(0x584530);
  const route: Point[]=[
    [cx+.050,cz+.016],[-.26,-.060],[-.305,.027],[-.212,.128],[-.147,.156],[-.062,.225],[-.018,.239],
    [F11_GUTTER_MARK.x,.259],[F11_GUTTER_MARK.x-.013,.343],[F11_GUTTER_MARK.x,F11_GUTTER_MARK.z],
  ];
  const pilot=(t:number,layer=0)=>{
    const i=Math.min(route.length-2,Math.floor(t*(route.length-1)));
    const z=t*(route.length-1)-i, x=mix(route[i][0],route[i+1][0],z);
    const depth=mix(route[i][1],route[i+1][1],z);
    return vec(x,pageY(x)+.045+layer+Math.sin(Math.PI*t)*.013,depth);
  };
  const leaderRibbons=[
    {draw:ribbon(witness,'Pilot root dark cut edge',37,.043,markedSide),layer:-.003},
    {draw:ribbon(witness,'Pilot root scored gold paper',37,.034,markedFiber),layer:.001},
    {draw:ribbon(witness,'Pilot root bright folded ridge',37,.011,markedEdge),layer:.009},
  ];
  const pilotForks=[
    [.22,-.15,.046],[.58,.127,.102],[.83,-.096,.068],
  ].map(([at,dx,dz])=>({at,dx,dz,draw:ribbon(witness,'Identifying pilot root fork',10,.012,markedFiber)}));
  const rootedFoot=group('F11 witness foot bonded at gutter');
  rootedFoot.position.set(F11_GUTTER_MARK.x,pageY(F11_GUTTER_MARK.x)+.041,F11_GUTTER_MARK.z);
  for(const sign of [-1,1]){
    const l=facets(rootedFoot,'Unprinted folded soil lip pointing to the live stalk',[
      vec(0,.003,-.095),vec(.082*sign,.005,-.042),vec(.079*sign,.008,.045),
      vec(.030*sign,.038,.070),vec(0,.028,.038),
    ],[0,1,4,1,2,4,2,3,4],sign<0?soil:polish);
    l.receiveShadow=true;
  }
  const inlays=group('F11 fine under-stock roots from single loam patch');
  const end: Point[]=[[-1.94,-.66],[-1.20,-1.1],[.36,-1.23],[1.68,-.96],[2.04,-.26],[-1.72,.76],[-2.10,.56],[1.75,.74],[-.60,.76]];
  const traces=end.map((_,i)=>ribbon(inlays,'Subsurface rooted filament',25,i<5?.014:.010,vein[i%3]));
  const twigs=end.flatMap((_,i)=>[0,1].map(j=>ribbon(inlays,'Subsurface root fork',11,.007,vein[(i+j+1)%3])));
  function line(i:number,t:number,offset=0) {
    const [x,z]=end[i];
    const wx=mix(cx,x,t)+Math.sin(t*11+i*.84)*.11*t;
    const wz=mix(cz,z,t)+Math.sin(t*9+i*.67)*.13*t+offset;
    return vec(wx,pageY(wx)+.039,wz);
  }

  // A physical overleaf slit across the fixed gutter. Its dyed backing and
  // cut-paper lip open together; no application data or archival record is cut.
  const split=group('F11 scored split crosses center gutter after roots');
  const cut:Point[]=[[-1.50,.44],[-1.03,.36],[-.76,.50],[-.43,.37],[-.18,.44],[0,.36],[.18,.48],[.49,.35],[.80,.41],[1.14,.28],[1.51,.36]];
  const gap=ribbon(split,'Dark backing exposed inside split',cut.length,.089,black);
  const lips=[-1,1].map(side=>({
    side,
    brim:ribbon(split,'Lifting exposed cut paper edge',cut.length,.016,ashEdge),
    score:ribbon(split,'Creased lifted outer lip of split',cut.length,.040,ash)
  }));
  const hold=group('F11 separate paper response slivers');
  const cheers=([['Marcel',.74,.38,0xe1bb6d],['Tiger',1.80,.56,0x78b6be]] as const).map(([actor,x,z,c],j)=>{
    const g=new THREE.Group();g.name=actor+' crease accents';g.position.set(x,pageY(x),z);hold.add(g);
    const mat=stock(c,.18);
    for(let i=0;i<3;i++){
      const side=i===1?-1:1;
      const a=mesh(new THREE.BoxGeometry(.026,.12+i*.022,.010),mat,g,'Celebration cut crease');
      a.position.set(side*(.27+(i%2)*.10),.87+j*.15+i*.065,-.03-i*.03);
      a.rotation.z=side*(-.34+i*.09);
    }
    return g;
  });
  let rootsComplete=false,splitComplete=false,pilotComplete=false;
  return {root,update(frame:number,reduced:boolean){
    const b=f11PaperBeats(frame);
    patch.visible=b.patch>.01;patch.scale.setScalar(Math.max(.001,b.patch));
    gravity.visible=b.fibers>.015;
    if(gravity.visible)strands.forEach((strand,i)=>{
      const redirect=b.redirected;
      strand((_,t)=>{
        const drift=reduced?0:.020*Math.sin((frame*.21+i)*1.2+t*13);
        const arc=Math.sin(Math.PI*t);
        const x=mix(1.39+i*.073,mix(.91,cx+.038*i,t),redirect)+(t-.35)*.45*(1-redirect);
        const z=mix(-.34+i*.093+(t-.5)*.66,mix(.29-i*.084,cz,t),redirect)+arc*(.21-i*.048);
        const elevation=mix(.19+i*.026,.084,redirect)+arc*.21+drift;
        return vec(x,pageY(x)+elevation,z);
      },Math.min(1,b.fibers*(1.27-i*.065)));
    });
    witness.visible=b.gutterRoot>.001;
    rootedFoot.visible=b.gutterRoot>=.996;
    if(witness.visible&&!pilotComplete){
      const reached=b.gutterRoot;
      // Trim the score at its precise moving tip instead of revealing the next pre-drawn segment.
      leaderRibbons.forEach(({draw,layer})=>draw((_,t)=>pilot(Math.min(reached,t),layer),reached));
      pilotForks.forEach(({at,dx,dz,draw})=>draw((_,t)=>{
        const from=pilot(at,.004);
        return vec(from.x+dx*t,from.y+.004*Math.sin(t*Math.PI),from.z+dz*t);
      },f11Ease(49+at*8,53+at*8,frame)));
      pilotComplete=reached===1;
    }
    inlays.visible=b.roots>.001;
    if(inlays.visible&&!rootsComplete){
      traces.forEach((draw,i)=>draw((_,t)=>line(i,t),f11Ease(62+(i%3)*.38,68+i*.14,frame)));
      twigs.forEach((draw,k)=>{
        const i=Math.floor(k/2),side=k%2?1:-1;
        draw((_,t)=>line(i,.32+.28*(k%2)+.23*t,side*.24*t),f11Ease(63+(k%4)*.39,69+(i%4)*.59,frame));
      });
      rootsComplete=frame>=71;
    }
    split.visible=b.split>.001;
    if(split.visible&&!splitComplete){
      const cue=(i:number,dz=0,dy=.0)=>vec(cut[i][0],pageY(cut[i][0])+.047+dy,cut[i][1]+dz);
      gap(i=>cue(i),b.split);
      for(const {side,brim,score} of lips){
        brim(i=>cue(i,side*(.028+b.split*.035),.022*b.split),b.split);
        score(i=>cue(i,side*(.062+b.split*.027),.010*b.split),b.split);
      }
      splitComplete=b.split===1;
    }
    for(const [i,g] of cheers.entries()){
      const amount=f11Ease(135+i*3,149+i*2,frame);
      g.visible=amount>.005;g.scale.setScalar(Math.max(.001,amount));
    }
    return b;
  },dispose(){
    const mats=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();mats.add(o.material);}});
    mats.forEach(m=>m.dispose());root.removeFromParent();
  }};
}
