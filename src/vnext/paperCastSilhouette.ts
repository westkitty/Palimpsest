import * as THREE from 'three';

type Point = {x:number;z:number};
type CastSettings = {
  direction:readonly [number,number];
  datum:number;
  receiver:(x:number,z:number)=>number;
  bounds:readonly [number,number,number,number];
  color:number;
  opacity:number;
};
const cross=(o:Point,a:Point,b:Point)=>(a.x-o.x)*(b.z-o.z)-(a.z-o.z)*(b.x-o.x);
function hull(points:Point[]):Point[]{
  const sorted=points.sort((a,b)=>a.x-b.x||a.z-b.z);
  const append=(side:Point[],p:Point)=>{
    while(side.length>1&&cross(side.at(-2)!,side.at(-1)!,p)<=1e-9)side.pop();
    side.push(p);
  };
  const l:Point[]=[],r:Point[]=[];
  for(const p of sorted)append(l,p);
  for(let i=sorted.length-1;i>=0;i--)append(r,sorted[i]);
  return [...l.slice(0,-1),...r.slice(0,-1)];
}
function crop(poly:Point[],key:keyof Point,value:number,sign:number):Point[]{
  const out:Point[]=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length];
    const aIn=sign*(a[key]-value)>=0,bIn=sign*(b[key]-value)>=0;
    if(aIn)out.push(a);
    if(aIn!==bIn){
      const t=(value-a[key])/(b[key]-a[key]);
      out.push({x:THREE.MathUtils.lerp(a.x,b.x,t),z:THREE.MathUtils.lerp(a.z,b.z,t)});
    }
  }
  return out;
}
/** Directional imprint of the evaluated solid-stock silhouette. It is
 * intentionally material geometry, so the same reading works even when
 * renderer shadows are off. Opaque-only source selections preserve gaps
 * between individual ribs/rails, rather than filming a new effect. */
export function createPaperCastSilhouette(parent:THREE.Object3D,casters:readonly THREE.Mesh[],spec:CastSettings){
  const layer=new THREE.Group();layer.name='Directional silhouette of evaluated paper stock';parent.add(layer);
  const mat=new THREE.MeshBasicMaterial({color:spec.color,opacity:spec.opacity,transparent:true,depthWrite:false,
    side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  const geometry=new THREE.BufferGeometry();
  const volume=new THREE.BufferAttribute(new Float32Array(12288*3),3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position',volume);
  const shadow=new THREE.Mesh(geometry,mat);
  shadow.name='Matte projected structure on its paper receiver';shadow.frustumCulled=false;
  shadow.renderOrder=2;layer.add(shadow);
  const leaves=casters.map(mesh=>{
    const attr=mesh.geometry.getAttribute('position');
    const unique=new Map<string,THREE.Vector3>();
    for(let i=0;i<attr.count;i++){
      const v=new THREE.Vector3(attr.getX(i),attr.getY(i),attr.getZ(i));
      unique.set(v.toArray().map(q=>q.toFixed(5)).join(':'),v);
    }
    const previous=mesh.castShadow;
    mesh.castShadow=false; // use this paper print rather than doubling the caster on hardware
    return {mesh,vertices:[...unique.values()],previous};
  });
  const basis=new THREE.Matrix4(), local=new THREE.Matrix4(), v=new THREE.Vector3();
  let last=-1;
  return {update(stroke:number){
    if(Math.abs(stroke-last)<.001)return;
    last=stroke;
    shadow.visible=stroke>.018;
    if(!shadow.visible){geometry.setDrawRange(0,0);return;}
    parent.updateWorldMatrix(true,true);
    basis.copy(parent.matrixWorld).invert();
    mat.opacity=spec.opacity*THREE.MathUtils.smoothstep(stroke,0,.29);
    let count=0;
    const emit=(a:Point,b:Point,c:Point,depth:number)=>{
      if(count+3>volume.count)return;
      if(depth>0){
        const m=(x:Point,y:Point)=>({x:(x.x+y.x)/2,z:(x.z+y.z)/2});
        const ab=m(a,b),bc=m(b,c),ca=m(c,a);
        emit(a,ab,ca,depth-1);emit(ab,b,bc,depth-1);emit(ca,bc,c,depth-1);emit(ab,bc,ca,depth-1);return;
      }
      for(const p of [a,b,c])volume.setXYZ(count++,p.x,spec.receiver(p.x,p.z),p.z);
    };
    for(const {mesh,vertices} of leaves){
      local.multiplyMatrices(basis,mesh.matrixWorld);
      let poly=hull(vertices.map(a=>{
        v.copy(a).applyMatrix4(local);
        const h=Math.max(0,v.y-spec.datum);
        return {x:v.x+h*spec.direction[0],z:v.z+h*spec.direction[1]};
      }));
      for(const [key,value,sign] of [['x',spec.bounds[0],1],['x',spec.bounds[1],-1],['z',spec.bounds[2],1],['z',spec.bounds[3],-1]] as const)
        poly=crop(poly,key,value,sign);
      for(let i=1;i+1<poly.length;i++)emit(poly[0],poly[i],poly[i+1],2);
    }
    geometry.setDrawRange(0,count);volume.needsUpdate=true;
  },dispose(){layer.removeFromParent();geometry.dispose();mat.dispose();for(const {mesh,previous} of leaves)mesh.castShadow=previous;}};
}
