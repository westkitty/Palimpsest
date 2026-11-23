import * as THREE from 'three';

/** Registered to the reviewed vellum diagram, not a reconstruction of Pharos. */
export const f07Route = [
  [[-.92,.12],[.66,-.45]],
  [[-.84,-.35],[.55,-.66]],
] as const;
const stockY=.249;
export function f07FieldHeight(x:number,z:number):number{
  const ridge=(cx:number,cz:number,w:number,d:number,h:number)=>h*Math.max(0,1-Math.abs(x-cx)/w-Math.abs(z-cz)/d);
  return stockY+ridge(-.73,-.53,.58,.57,.082)+ridge(.30,-.55,.78,.57,.076)+ridge(.73,-.03,.39,.45,.036);
}
export function f07EnvironmentalRead(planAngle:number,costLift:number){
  const open=THREE.MathUtils.clamp(-planAngle/.76,0,1);
  const cost=THREE.MathUtils.clamp(costLift/.28,0,1);
  return {open,cost,shadow:THREE.MathUtils.smoothstep(open,.13,.93)};
}
export function createF07Environment(parent:THREE.Object3D){
  const root=new THREE.Group();root.name='F07 • same schematic terrain seen as plan and attrition';parent.add(root);
  const meshes:THREE.Mesh[]=[];
  const materials=new Set<THREE.Material>();
  function place(name:string,pts:number[],idx:number[],m:THREE.Material){
    materials.add(m);
    const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    g.setIndex(idx);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,m);mesh.name=name;root.add(mesh);meshes.push(mesh);return mesh;
  }
  const paper=new THREE.MeshStandardMaterial({color:0x526061,roughness:.92,flatShading:true,side:THREE.DoubleSide,vertexColors:true});
  const groundV:number[]=[],groundI:number[]=[],colors:number[]=[];
  const warm=new THREE.Color(0xe6c4a3),slate=new THREE.Color(0x9caeb0);
  const rows=16,cols=24;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const x=-1.33+2.66*i/cols,z=-1.11+1.74*j/rows,y=f07FieldHeight(x,z);
    groundV.push(x,y,z);
    const c=slate.clone().lerp(warm,Math.min(1,(y-stockY)*6+((i+j)%3)*.12));
    colors.push(c.r,c.g,c.b);
    if(i&&j){const k=j*(cols+1)+i;groundI.push(k-cols-2,k-1,k-cols-1,k-cols-1,k-1,k);}
  }
  const field=place('Low folded relief with physically shared route coordinates',groundV,groundI,paper);
  field.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  field.receiveShadow=true;
  const plan=new THREE.MeshBasicMaterial({color:0xeccf94,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});
  const wear=new THREE.MeshBasicMaterial({color:0xc36451,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});
  // Print a broad path using x/z on the same physical crease heights. The
  // interrupted lower marks intentionally cannot be interpreted as headcounts.
  for(const [index,route] of f07Route.entries()){
    const [a,b]=route,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    const px=-dz/len,pz=dx/len;
    const path=(t:number,w:number,dy:number)=>{
      const x=a[0]+dx*t+px*w,z=a[1]+dz*t+pz*w;
      return [x,f07FieldHeight(x,z)+dy,z];
    };
    let v:number[]=[],i:number[]=[];
    for(let k=0;k<=22;k++){
      let t=k/22,w=t>.86 ? .084*(1-t)/.14+.007 : .024;
      v.push(...path(t,-w,.004),...path(t,w,.004));
      if(k){const q=k*2;i.push(q-2,q-1,q,q-1,q+1,q);}
    }
    place('Vellum vector registered onto folds '+(index+1),v,i,plan);
    v=[];i=[];
    for(const [start,end] of [[.04,.27],[.34,.52],[.64,.93]]){
      const base=v.length/3;
      for(let k=0;k<=7;k++){
        const t=THREE.MathUtils.lerp(start,end,k/7);
        const w=.046+.018*Math.sin((t+index)*13);
        v.push(...path(t,.026-w,.007),...path(t,.026+w,.007));
        if(k){const q=base+k*2;i.push(q-2,q-1,q,q-1,q+1,q);}
      }
    }
    place('Interrupted cost impression on same line '+(index+1),v,i,wear);
  }
  // Paper-toned, feather-layered ruby sweep anchored at the actual embossed
  // ruby marker. The last edge lands between the support bench and board.
  const shadowMats=[.21,.26,.37].map(opacity=>new THREE.MeshBasicMaterial({
    color:0x9a283b,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,
  }));
  const shadowGroup=new THREE.Group();shadowGroup.name='Printed ruby cast shadow runs toward the relief';root.add(shadowGroup);
  const left=-2.63,right=-.64;
  shadowMats.forEach((mat,k)=>{
    const w=.52-k*.106;
    const geometry=new THREE.PlaneGeometry(1,1,18,1);
    geometry.rotateX(-Math.PI/2);
    const m=new THREE.Mesh(geometry,mat);m.name='Overlaid feathered ruby ink '+(k+1);
    shadowGroup.add(m);meshes.push(m);materials.add(mat);
    m.userData.halfWidth=w;
  });
  let lastShadow=-1;
  const update=(planAngle:number,costLift:number)=>{
    const s=f07EnvironmentalRead(planAngle,costLift);
    plan.opacity=.07+.79*s.open*(1-s.cost*.49);
    wear.opacity=.22*s.open+.69*s.cost*(.30+s.open*.70);
    shadowGroup.visible=s.shadow>.015;
    if(Math.abs(lastShadow-s.shadow)>.004){
      lastShadow=s.shadow;
      const end=THREE.MathUtils.lerp(right,left,s.shadow);
      for(const m of shadowGroup.children as THREE.Mesh[]){
        const a=m.geometry.getAttribute('position');
        const w=Number(m.userData.halfWidth);
        for(let i=0;i<a.count;i++){
          const t=(i%19)/18,l=Math.sign(i<19?1:-1);
          const x=THREE.MathUtils.lerp(right,end,t);
          const z=THREE.MathUtils.lerp(-.27,.67,t*s.shadow)+l*w*(.09+.92*t);
          const y=Math.abs(x)<1.4?f07FieldHeight(x,z)+.012: .077+Math.max(0,1-(Math.abs(x)-1.4)*4.2)*.168;
          a.setXYZ(i,x,y,z);
        }
        a.needsUpdate=true;m.geometry.computeBoundingSphere();
      }
    }
    return s;
  };
  return {update,dispose(){
    root.removeFromParent();
    meshes.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());
  }};
}
