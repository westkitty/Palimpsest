import * as THREE from 'three';

export function f07ScorchCue(seconds:number,reduced:boolean){
  if(seconds<0)return {flame:0,cut:false};
  if(reduced)return {flame:0,cut:true};
  const t=THREE.MathUtils.clamp(seconds/.92,0,1);
  return {flame:(t===1?0:Math.sin(t*Math.PI)**1.33),cut:seconds>=.47};
}
/** Geometry cut into the existing vellum at its lower-left corner. */
export function makeBurntVellum(){
  const xy=[[-1.29,.04],[1.29,.04],[1.29,1.48],[-.74,1.48],[-.83,1.425],[-.95,1.38],[-1.01,1.25],[-1.16,1.18],[-1.29,1.03]];
  const outline=xy.map(([x,z])=>new THREE.Vector2(x,z));
  const triangles=THREE.ShapeUtils.triangulateShape(outline,[]);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(xy.flatMap(([x,z])=>[x,.005,z]),3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(xy.flatMap(([x,z])=>[(x+1.29)/2.58,(z-.04)/1.44]),2));
  geometry.setIndex(triangles.flatMap(([a,b,c])=>[a,c,b]));geometry.computeVertexNormals();
  return {geometry,edge:xy.slice(3)};
}

export function createF07Scorch(parent:THREE.Object3D,vellum:THREE.Mesh){
  const intact=vellum.geometry;
  const {geometry,edge}=makeBurntVellum();
  const lamp=new THREE.Group();lamp.name='F07 · relief bench hooded lamp';parent.add(lamp);
  lamp.position.set(-1.28,.23,.42);
  const paper=new THREE.MeshStandardMaterial({color:0x72533c,roughness:.91});
  const shade=new THREE.MeshStandardMaterial({color:0xa57b42,roughness:.86,side:THREE.DoubleSide});
  const wick=new THREE.MeshBasicMaterial({color:0xe6ad62});
  const mesh=(into:THREE.Object3D,g:THREE.BufferGeometry,m:THREE.Material,y:number)=>{
    const item=new THREE.Mesh(g,m);item.position.y=y;into.add(item);return item;
  };
  mesh(lamp,new THREE.BoxGeometry(.16,.026,.124),paper,0);
  mesh(lamp,new THREE.CylinderGeometry(.017,.025,.14,5),paper,.078);
  mesh(lamp,new THREE.ConeGeometry(.080,.065,5),shade,.167);
  mesh(lamp,new THREE.SphereGeometry(.022,7,5),wick,.137);
  const curtain=new THREE.Group();curtain.name='F07 · one local vellum scorch';vellum.add(curtain);
  const char=new THREE.MeshBasicMaterial({color:0x472923});
  const charEdge=new THREE.Group();curtain.add(charEdge);
  for(let i=1;i<edge.length;i++){
    const [ax,az]=edge[i-1],[bx,bz]=edge[i];
    const dab=mesh(charEdge,new THREE.BoxGeometry(Math.hypot(bx-ax,bz-az),.004,.016),char,.008);
    dab.position.x=(ax+bx)/2;dab.position.z=(az+bz)/2;dab.rotation.y=-Math.atan2(bz-az,bx-ax);
  }
  const flamePivot=new THREE.Group();flamePivot.position.set(-1.14,.025,1.36);curtain.add(flamePivot);
  const tongue=new THREE.Shape().moveTo(-.072,0).quadraticCurveTo(-.13,.14,.02,.31)
    .quadraticCurveTo(.005,.20,.10,.144).quadraticCurveTo(.14,.056,.067,0).closePath();
  const tongues=[0xe67530,0xf0a847,0xffd995].map((c,i)=>{
    const m=new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide,transparent:true,depthWrite:false});
    const a=mesh(flamePivot,new THREE.ShapeGeometry(tongue,13),m,0);
    a.rotation.y=i*Math.PI/3;a.position.x=(i-1)*.025;a.renderOrder=4+i;
    return a;
  });
  const spread=new THREE.PointLight(0xff9244,0,.93,2);
  spread.position.y=.10;flamePivot.add(spread);
  let opened=false,elapsed=-1;
  const update=(available:number,active:boolean,dt:number,reduced:boolean)=>{
    if(available>.82)opened=true;
    if(opened&&!active&&available<.26&&elapsed<0)elapsed=0;
    if(elapsed>=0)elapsed=Math.min(1.05,elapsed+(reduced?1.05:Math.max(0,dt)));
    const cue=f07ScorchCue(elapsed,reduced);
    vellum.geometry=cue.cut?geometry:intact;
    flamePivot.visible=cue.flame>.006;
    charEdge.visible=cue.cut;
    spread.intensity=cue.flame*2.0;
    tongues.forEach((n,i)=>{
      n.material.opacity=cue.flame*(.63+i*.14);
      n.scale.set(.85+i*.07,.35+cue.flame*(.8-i*.17),1);
      n.rotation.z=Math.sin(elapsed*18+i*.91)*.12-.26;
    });
    return cue;
  };
  return {update,dispose(){
    vellum.geometry=intact;
    geometry.dispose();
    for(const group of [lamp,curtain]){
      group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();o.material.dispose();}});
      group.removeFromParent();
    }
  }};
}
