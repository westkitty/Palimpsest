import * as THREE from 'three';
import {f11Ease} from './f11StoryPaper.ts';

export function f11WickBeats(frame:number){
  const wet=f11Ease(65,74,frame);
  const bead=f11Ease(61.5,63.1,frame)*(1-f11Ease(65,71,frame));
  const strain=f11Ease(67,76,frame)*(1-.24*f11Ease(78,95,frame));
  return {bead,wet,strain,phase:frame<62?'dry':frame<65?'bead':frame<73?'wicking':'stained'} as const;
}

/** One quiet condensate mark on the far side of the pilot root. The root
 * and all vegetation retain their own unchanged growth clock and attachments.
 */
export function createF11WaterWick(owner:THREE.Group,pageY:(x:number)=>number){
  const root=new THREE.Group();root.name='F11 single capillary witness, never grows the forest';owner.add(root);
  const x=-.65,z=.707;
  const stock=new THREE.MeshStandardMaterial({color:0x766b58,roughness:.95,side:THREE.DoubleSide,flatShading:true});
  const cardEdge=new THREE.MeshStandardMaterial({color:0x4e4338,roughness:.97,side:THREE.DoubleSide});
  const tide=new THREE.MeshStandardMaterial({color:0x514a39,roughness:.96,side:THREE.DoubleSide});
  const tideDark=new THREE.MeshStandardMaterial({color:0x3d4036,roughness:.94,side:THREE.DoubleSide});
  const bevel=new THREE.MeshPhysicalMaterial({color:0x638a88,metalness:0,roughness:.20,clearcoat:.9,clearcoatRoughness:.13,
    transparent:true,opacity:.78,depthWrite:false});
  const sheen=new THREE.MeshStandardMaterial({color:0xbbb9a1,roughness:.14,metalness:0});
  const mound=new THREE.Mesh(new THREE.SphereGeometry(1,14,10,0,Math.PI*2,0,Math.PI*.64),bevel);
  mound.name='F11 distinct bead of condensation';root.add(mound);
  const shine=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),sheen);mound.add(shine);
  shine.position.set(-.23,.71,.20);shine.scale.set(.16,.095,.09);
  const NX=12,NZ=5,W=.438,D=.225;
  const F=(i:number,j:number)=>j*(NX+1)+i;
  const top=(NX+1)*(NZ+1),verts=new THREE.Float32BufferAttribute(new Float32Array(top*6),3);
  verts.setUsage(THREE.DynamicDrawUsage);
  const mesh=new THREE.BufferGeometry();mesh.setAttribute('position',verts);
  const idx:number[]=[];
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){
    const a=F(i,j),b=F(i+1,j),c=F(i,j+1),d=F(i+1,j+1);
    idx.push(a,c,b,b,c,d);
  }
  mesh.addGroup(0,idx.length,0);const topLength=idx.length;
  for(let i=0;i<NX;i++)for(const j of [0,NZ]){
    const a=F(i,j),b=F(i+1,j);idx.push(a,b,b+top,a,b+top,a+top);
  }
  for(let j=0;j<NZ;j++)for(const i of [0,NX]){
    const a=F(i,j),b=F(i,j+1);idx.push(a,b,b+top,a,b+top,a+top);
  }
  mesh.addGroup(topLength,idx.length-topLength,1);mesh.setIndex(idx);
  const art=new THREE.Mesh(mesh,[stock,cardEdge]);art.name='F11 scored stock physically cockles at its wet free edge';
  art.receiveShadow=true;art.castShadow=true;root.add(art);
  function surface(dx:number,dz:number,stress:number){
    const edge=THREE.MathUtils.clamp((dz+D)/(2*D),0,1);
    const middle=Math.max(0,1-Math.abs(dx)/W);
    // Back crease and lateral paste points remain fixed. The loose edge
    // permanently bends down in the middle and up in two short curl ridges.
    return pageY(x+dx)+.044+.025*edge+edge**2*middle*stress*(-.056+Math.cos(dx*31)*.019);
  }
  function stain(m:THREE.Material,width:number,depth:number,seed:number,dy:number){
    const n=27,points=new THREE.Float32BufferAttribute(new Float32Array((n+1)*3),3);points.setUsage(THREE.DynamicDrawUsage);
    const g=new THREE.BufferGeometry();g.setAttribute('position',points);
    g.setIndex(Array.from({length:n},(_,i)=>[0,((i+1)%n)+1,i+1]).flat());
    const o=new THREE.Mesh(g,m);o.frustumCulled=false;o.receiveShadow=true;root.add(o);o.name=seed?'F11 deeper centre of wicking':'F11 irregular capillary wet edge';
    return (wet:number,cockle:number)=>{
      o.visible=wet>.003;if(!o.visible)return;
      const s=Math.sqrt(wet);
      points.setXYZ(0,x+.012,surface(.012,-.010,cockle)+dy,z-.010);
      for(let i=0;i<n;i++){
        const a=i/n*Math.PI*2,r=.82+.095*Math.sin(a*3+seed)+.060*Math.sin(a*7-1.2)+.040*Math.cos(a*11);
        const dx=.012+Math.cos(a)*r*width*s,dz=-.010+Math.sin(a)*r*depth*s;
        points.setXYZ(i+1,x+dx,surface(dx,dz,cockle)+dy,z+dz);
      }
      points.needsUpdate=true;g.computeVertexNormals();
    };
  }
  const paleRim=stain(tide,.375,.188,0,.004);
  const darkCentre=stain(tideDark,.239,.129,1,.007);
  let prev=-1;
  const update=(frame:number)=>{
    const {bead,wet,strain,phase}=f11WickBeats(frame);
    mound.visible=bead>.005;
    if(mound.visible){
      mound.position.set(x+.015,surface(.015,-.009,strain)+.002,z-.009);
      mound.scale.set(.086*bead,.121*bead,.073*bead);
    }
    if(prev!==strain){
      for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){
        const dx=(2*i/NX-1)*W;
        const dz=(2*j/NZ-1)*D+(j===NZ?Math.sin(i*1.76)*.024:0);
        const y=surface(dx,dz,strain);
        verts.setXYZ(F(i,j),x+dx,y,z+dz);
        verts.setXYZ(F(i,j)+top,x+dx,y-.028,z+dz);
      }
      verts.needsUpdate=true;mesh.computeVertexNormals();mesh.computeBoundingSphere();prev=strain;
    }
    paleRim(wet,strain);darkCentre(wet,strain);
    return {phase,bead:Number(bead.toFixed(3)),wet:Number(wet.toFixed(3)),
      edgeSag:Number((surface(0,D,0)-surface(0,D,strain)).toFixed(3))};
  };
  update(1);
  return {update,dispose(){
    const geo=new Set<THREE.BufferGeometry>(),mat=new Set<THREE.Material>();
    root.traverse(n=>{if(n instanceof THREE.Mesh){geo.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])mat.add(m);}});
    geo.forEach(g=>g.dispose());mat.forEach(m=>m.dispose());root.removeFromParent();
  }};
}
