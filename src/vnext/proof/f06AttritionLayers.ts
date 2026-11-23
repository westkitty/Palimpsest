import * as THREE from 'three';

const WEAR_KEY='palimpsest.living.f06.paper-wear.v1';
let sessionWear=0;
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
function previousWear():number{
  try{
    const raw=Number(sessionStorage.getItem(WEAR_KEY)??0);
    return Number.isInteger(raw)&&raw>=0&&raw<=15?raw|sessionWear:sessionWear;
  }catch{return sessionWear;}
}
export function resetF06TerrainWear():void{
  sessionWear=0;
  try{sessionStorage.removeItem(WEAR_KEY);}catch{ /* optional local study evidence */ }
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

export function attachF06AttritionTerrain(parent:THREE.Object3D){
  const relief=new THREE.Group();relief.name='F06 one accumulating schematic campaign relief';
  relief.position.set(-1.69,.235,-.935);parent.add(relief);
  const brass=paper(0x85684d),sienna=paper(0x5b3a34), slate=paper(0x465365), dust=paper(0x918279), shadow=paper(0x25272d);
  box(relief,'Bonded relief base',2.42,.039,.80,shadow);
  box(relief,'Pressed slate terrain perimeter',2.39,.023,.762,brass,0,.023);
  const terrain:THREE.Mesh[]=[];
  for(let i=0;i<8;i++){
    const center=-1.04+i*.297;
    const leaf=box(relief,'Scored campaign paper rib '+i,.292,.036,.675,i%3===0?slate:shadow,center,.042,0);
    const peak=box(leaf,'Low raised unscaled terrain contour',.247,.037+i%3*.017,.29+i%2*.112,i%2===0?dust:sienna,0,.026,-.17+(i%3)*.10);
    peak.rotation.y=-.42+i%3*.23;
    terrain.push(leaf);
  }
  const older:THREE.MeshStandardMaterial[]=[];
  const tracks=routes.map((route,i)=>{
    const layer=new THREE.Group();layer.name='A archive crease layer '+(i+1);relief.add(layer);layer.position.y=.115+i*.006;
    const ink=paper(0x827c71);older.push(ink);
    for(let j=0;j<route.length-1;j++){
      joinedEdge(layer,route[j],route[j+1],.029,ink,'Raised scored route edge');
      const center=route[j].clone().lerp(route[j+1],.53);
      const hatch=box(layer,'Nonquantitative wear score',.085,.018,.020,i%2===0?slate:sienna,center.x,-.010,center.z+.015);
      hatch.rotation.y=-.81;
    }
    return layer;
  });
  let seen=previousWear(), sight=0, last=-1;
  function update(era:number,seconds:number,reduced:boolean) {
    if(last!==era){
      const next=seen|(1<<era);
      if(next!==seen){seen=next;recordWear(seen);}
      sight=last<0||reduced?1:0;
      last=era;
    }
    sight=reduced?1:clamp(sight+seconds*1.95);
    tracks.forEach((g,i)=>{
      g.visible=Boolean(seen&(1<<i));
      g.scale.x=i===era?.12+.88*THREE.MathUtils.smoothstep(sight,0,1):1;
      older[i].color.setHex(i===era?0xdba272:i%2===0?0x818b98:0x9a7366);
    });
    terrain.forEach((rib,i)=>{
      const time=clamp((sight-i*.061)*2.25);
      const fade=1-sight;
      const wave=reduced||sight>=1?0:Math.sin(Math.PI*time)*fade;
      rib.position.y=.042+.049*wave;
      rib.rotation.z=.13*wave;
    });
    return {wearMask:seen,routeLayerCount:tracks.filter(t=>t.visible).length,paperRipple:1-sight};
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
