import * as THREE from 'three';
import {createPaperCastSilhouette} from '../paperCastSilhouette.ts';

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
export function createF07Environment(parent:THREE.Object3D,casters:readonly THREE.Mesh[] = []){
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
  const shadow=createPaperCastSilhouette(root,casters,{
    direction:[-1.12,.53],datum:.247,bounds:[-2.77,1.31,-1.10,1.05],
    receiver:(x,z)=>x>=-1.33&&x<=1.33&&z>=-1.11&&z<=.63?f07FieldHeight(x,z)+.014:.093,
    color:0x351219,opacity:.68,
  });
  const update=(planAngle:number,costLift:number)=>{
    const s=f07EnvironmentalRead(planAngle,costLift);
    plan.opacity=.07+.79*s.open*(1-s.cost*.49);
    wear.opacity=.22*s.open+.69*s.cost*(.30+s.open*.70);
    // The original opaque plan rails interrupt the vellum's transmission.
    // Light goes through the membrane and escapes through the real openings.
    shadow.update(s.open);
    return s;
  };
  return {update,dispose(){
    shadow.dispose();root.removeFromParent();
    meshes.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());
  }};
}
