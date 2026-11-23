import * as THREE from 'three';

const outline = (points:readonly (readonly [number,number])[],thickness:number)=>{
  const shape=new THREE.Shape();
  points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth:thickness,steps:1,bevelEnabled:false,curveSegments:2});
};
const stock=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.91,metalness:0});
function mesh(owner:THREE.Object3D,g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number){
  const n=new THREE.Mesh(g,m);n.position.set(x,y,z);n.castShadow=true;n.receiveShadow=true;
  owner.add(n);return n;
}
function slab(owner:THREE.Object3D,w:number,h:number,d:number,m:THREE.Material,x=0,y=0,z=0){
  return mesh(owner,new THREE.BoxGeometry(w,h,d),m,x,y,z);
}
const sat=(v:number)=>Math.min(1,Math.max(0,v));
const smooth=(n:number)=>{const v=sat(n);return v*v*(3-2*v);};
const cue=(p:number,a:number,b:number)=>smooth((p-a)/(b-a));
const stroke=(root:THREE.Object3D,m:THREE.Material,x1:number,y1:number,x2:number,y2:number,d:number)=>{
  const n=slab(root,Math.hypot(x2-x1,y2-y1),.032,d,m,(x1+x2)/2,(y1+y2)/2,.033);
  n.rotation.z=Math.atan2(y2-y1,x2-x1);
};
const creaseProfiles=[
  [[-.061,-.052],[-.061,.053],[.000,.087],[.058,.044]],
  [[-.059,.072],[.056,.072],[.057,.005],[-.045,-.045]],
  [[-.060,-.041],[-.008,.071],[.053,.064],[.052,-.043]],
  [[-.064,.052],[.016,.082],[.057,.028],[.015,-.041]],
  [[-.063,-.048],[.031,-.048],[.051,.045],[-.006,.075]],
  [[-.067,.048],[.052,.048],[.052,-.009],[-.031,-.054]],
] as const;

/** Three teaching mounts on the book, not events or shared geography. The
 * existing scored A hinges, not a free-running scene clock, pull their witness links.
 */
export function bindF01PaperConsequences(parent:THREE.Group){
  const layer=new THREE.Group();layer.name='F01 editorial paper workbench';parent.add(layer);
  const seats=[-2.67,0,2.67].map((x,i)=>{
    const o=new THREE.Group();o.position.set(x,.300,.055);
    o.name=['F01 neutral mount and footing','F01 typographic register','F01 recurrence press'][i];layer.add(o);return o;
  });
  const charcoal=stock(0x232632),edge=stock(0x4e4b3f),basalt=stock(0x171f25);
  const pewter=stock(0x655e50),warm=stock(0xb59c6e),wheat=stock(0xc1a77b);
  const linen=stock(0xcbc5b2),darkInk=stock(0x424848),steelBlue=stock(0x47636a);
  const [neutral,type,press]=seats;
  const neutralFoot=slab(neutral,1.68,.059,.90,charcoal,0,.039,-.14);
  neutralFoot.name='F01 bonded object mount foot';
  slab(neutral,1.53,.013,.74,basalt,0,.076,-.14);
  for(const x of [-.745,.745])slab(neutral,.045,.048,.78,warm,x,.100,-.14);
  const seatTraps=[-1,1].map(side=>{
    const pin=new THREE.Group();pin.name='F01 neutral mount hinge';pin.position.set(side*.704,.126,-.17);neutral.add(pin);
    const surf=slab(pin,.71,.043,.63,pewter,side*-.355,0,0);
    slab(surf,.617,.013,.54,charcoal,0,.027,0);
    slab(surf,.577,.009,.041,edge,0,.036,.26);
    return {pin,side};
  });
  const mount=[-.40,0,.40].map((x,i)=>{
    const pivot=new THREE.Group();pivot.position.set(x,.080,-.214);neutral.add(pivot);
    pivot.name='F01 registered mounting rib '+(i+1);
    // Scored thick notched supports expose the deliberately ordinary paper saddle;
    // they neither name nor depict a role for the Shard-God.
    const die=mesh(pivot,outline([
      [-.14,0],[-.14,.14],[-.073,.195],[-.073,.116],[.073,.116],[.073,.195],[.14,.14],[.14,0],
    ],.034),warm,0,0,0);
    slab(die,.24,.017,.01,linen,0,.06,.039);
    return pivot;
  });
  const groundedRegister=slab(neutral,1.06,.042,.18,steelBlue,0,.09,.01);
  groundedRegister.name='F01 neutral exhibit crossrail';

  // Language is shown as movable shapes acquiring a single registered line.
  // These are non-linguistic letterpress pieces, not generated Starsilk words.
  slab(type,1.81,.07,.82,charcoal,0,.04,-.14);
  slab(type,1.66,.014,.69,edge,0,.086,-.14);
  for(const s of [-1,1])slab(type,1.63,.072,.035,pewter,0,.126,-.09+s*.245);
  const line=slab(type,1.63,.018,.33,steelBlue,0,.09,-.095);line.name='F01 lockable receiver for one registered strip';
  const types=creaseProfiles.map((shape,i)=>{
    const n=new THREE.Group();n.name='F01 letterpress slug '+(i+1);type.add(n);
    slab(n,.234,.272,.035,warm,0,0,0);
    slab(n,.214,.245,.013,linen,0,0,.025);
    for(let j=1;j<shape.length;j++)stroke(n,darkInk,shape[j-1][0],shape[j-1][1],shape[j][0],shape[j][1],.012);
    return n;
  });
  const lock=new THREE.Group();lock.name='F01 paper line drawbar';lock.position.set(-.82,.102,.18);type.add(lock);
  slab(lock,.15,.050,.31,steelBlue);
  slab(lock,.083,.025,.21,warm,0,.031,0);

  // One simple source impression is retained. The same physical pattern can
  // be read on every folded sheet drawn out below it.
  slab(press,1.80,.07,.86,charcoal,0,.042,-.14);
  slab(press,1.61,.013,.706,pewter,0,.086,-.14);
  const binding=new THREE.Group();binding.position.set(-.64,.119,-.355);press.add(binding);
  const impression=(root:THREE.Object3D,size:number,front:boolean)=>{
    slab(root,size,.54,.027,front?linen:wheat);
    // A simple register datum and three rectangular bars, never a word, face, eye, or star.
    for(const [i,h] of [.15,.247,.119].entries()){
      slab(root,.036,h,.008,darkInk,(i-1)*.075,-.145+h/2,.021);
    }
    slab(root,.271,.024,.008,darkInk,0,-.142,.021);
    slab(root,size*.90,.017,.010,edge,0,.231,.022);
  };
  const records=Array.from({length:4},(_,i)=>{
    const n=new THREE.Group();n.name='F01 recurrence sheet '+i;binding.add(n);
    impression(n,.44,i===0);
    // The accordion stays on the paper track with a true root independent of the display angle.
    slab(press,.051,.037,.058,warm,-.64+i*.41,.11,-.32);
    return n;
  });
  const pressBar=slab(press,.087,.060,.627,steelBlue,-.67,.161,-.104);
  pressBar.name='F01 recurrence pressure bar';

  function update(stations:readonly number[]){
    const a=cue(stations[0],.10,.93),b=cue(stations[1],.12,.96),c=cue(stations[2],.12,.96);
    for(const {pin,side} of seatTraps)pin.rotation.z=-side*a*1.28;
    for(const [i,datum] of mount.entries()){
      const k=cue(a,i*.11,.93);
      datum.rotation.x=(1-k)*1.36;
    }
    // Uncovers this rail above its recess with cam motion, rather than turning it into a magical prop.
    groundedRegister.position.set(0,.097+.162*a,.034-.22*a);
    const stockZ=[-.285,.061,-.191,.022,-.209,.092];
    const angle=[.45,-.63,.30,-.42,.60,-.26];
    types.forEach((n,i)=>{
      const v=cue(b,i*.075,.94);
      n.position.set((i-2.5)*.257 + .09*(1-v)*(i%2===0?-1:1),.128+.156*v,
        THREE.MathUtils.lerp(stockZ[i],-.098,v));
      n.rotation.set(-1.16*(1-v),angle[i]*(1-v),0);
    });
    lock.position.x=-.82+1.64*b;
    records.forEach((n,i)=>{
      const v=i===0?cue(c,0,.72):cue(c,i*.105,1);
      n.position.set(.41*i*v,.009+i*.025+.187*v,.040+i*.011+.013*v);
      n.rotation.x=-1.46+(1.04-.075*i)*v;
      n.rotation.y=i*.048*v;
    });
    pressBar.position.x=-.67+1.24*c;
    return {mountOpening:Number(a.toFixed(3)),lineRegistered:Number(b.toFixed(3)),recurrenceSpread:Number(c.toFixed(3)),
      impressionCount:records.filter((sheet,i)=>i===0||sheet.position.x>.275*i).length};
  }
  update([0,0,0]);
  return {update};
}
