import * as THREE from 'three';

const smooth=(a:number,b:number,v:number)=>THREE.MathUtils.smoothstep(v,a,b);
const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
type Stock=(x:number)=>number;
type LiftAt=(azimuth:number)=>number;

export function createF10EnvironmentalResponse(pageY:Stock,shore:THREE.Group,horizon:THREE.Group){
  const root=new THREE.Group();root.name='F10 whole-stock spatial environmental response';
  const paper=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.92,side:THREE.DoubleSide,flatShading:true});
  const flint=paper(0x353d4f), blue=paper(0x647180), rip=paper(0x9b8278), grain=paper(0x5d5857);
  const deep=paper(0x272b35), darkVein=paper(0x6e6669);
  const muted=paper(0x6c5135), eave=paper(0x8b6d52);
  const spill=new THREE.MeshBasicMaterial({color:0xb37e48,toneMapped:false,side:THREE.DoubleSide});
  function plate(owner:THREE.Group,name:string,v:THREE.Vector3[],material:THREE.Material){
    const g=new THREE.BufferGeometry();
    const pts=([0,1,2,0,2,3] as const).map(i=>v[i]);
    g.setFromPoints(pts);g.computeVertexNormals();
    const item=new THREE.Mesh(g,material);item.name=name;item.receiveShadow=false;owner.add(item);return item;
  }
  const cx=-1.12,cz=-.25;
  type Bank={x:number;z:number;width:number;depth:number;reach:number;offset:number};
  // Left/back gussets span the physical page lane behind the native collar;
  // the separate front-left track stops well short of levers and the C gate.
  const terrain:Bank[]=[
    {x:-3.08,z:-.98,width:.47,depth:.52,reach:.40,offset:.28},
    {x:-2.83,z:-1.28,width:.65,depth:.59,reach:.72,offset:.22},
    {x:-2.24,z:-1.43,width:.74,depth:.55,reach:.87,offset:.16},
    {x:-1.61,z:-1.49,width:.69,depth:.48,reach:.74,offset:.09},
    {x:-.96,z:-1.47,width:.57,depth:.47,reach:.60,offset:.06},
    {x:-.43,z:-1.45,width:.55,depth:.41,reach:.47,offset:.10},
    {x:-2.95,z:-.21,width:.66,depth:.47,reach:.70,offset:.20},
    {x:-2.78,z:.38,width:.57,depth:.47,reach:.66,offset:.23},
    {x:-2.38,z:.76,width:.57,depth:.44,reach:.51,offset:.16},
    {x:-1.79,z:.90,width:.51,depth:.39,reach:.42,offset:.09},
  ];
  const folds=terrain.map((p,i)=>{
    const holder=new THREE.Group();
    holder.position.set(p.x,pageY(p.x)+.027,p.z);
    const azimuth=Math.atan2(p.z-cz,p.x-cx);
    // Local +Z points inward. The root is the page crease and stays fixed.
    holder.rotation.y=Math.atan2(cx-p.x,cz-p.z);root.add(holder);
    const hinge=new THREE.Group();hinge.name='F10 rooted containment stock crease '+i;holder.add(hinge);
    const w=p.width,d=p.depth;
    plate(holder,'F10 dark exposed under-stock',[V(-w*.56,0,-.075),V(w*.55,0,-.075),V(w*.51,0,d),V(-w*.54,0,d)],deep);
    const a=V(-w*.53,0,0),b=V(w*.53,0,0),c=V(w*.43,.060,d*.94),e=V(-w*.46,.045,d*.75);
    const mid1=V(w*.11,.079,d*.05),mid2=V(-w*.13,.115,d*.96);
    plate(hinge,'F10 cold folding paper field',[a,mid1,mid2,e],i%3===1?grain:flint);
    plate(hinge,'F10 laminated stock opposing facet',[mid1,b,c,mid2],i%3===1?flint:blue);
    plate(hinge,'F10 exposed scored paper edge',[e,mid2,c,V(w*.43,.03,d*.94)],darkVein);
    const scored=new THREE.Group();scored.name='F10 moving stress cut';hinge.add(scored);
    plate(scored,'F10 matte non-emitting broken scoring',[V(w*.035,.079,d*.09),V(w*.078,.089,d*.09),V(-w*.089,.123,d*.98),V(-w*.135,.123,d*.98)],rip);
    return {hinge,scored,azimuth,p};
  });
  const scraps=[] as Array<{panel:THREE.Mesh;from:THREE.Vector3;to:THREE.Vector3;angle:number;lag:number;}>;
  // Grounded lozenges, not particles: these slide a single short distance
  // on the side of the receiver. Never put a mark on the horizon sky.
  for(let i=0;i<9;i++){
    const angle=[2.52,2.95,3.19,3.50,3.83,4.16,4.46,4.91,5.14][i];
    const radius=1.22+(i%3)*.09;
    const from=V(cx+radius*Math.cos(angle),0,cz+radius*Math.sin(angle));
    const to=V(cx+(radius-.24)*Math.cos(angle),0,cz+(radius-.24)*Math.sin(angle));
    const a=plate(root,'F10 pressed ground-paper slip',[
      V(-.11,0,0),V(.00,0,-.035),V(.12,0,.007),V(-.028,0,.028),
    ],i%4===0?rip:blue);
    a.rotation.y=-angle;
    scraps.push({panel:a,from,to,angle,lag:(i%3)*.08});
  }

  function streets(owner:THREE.Group,xs:number[],depth:number,kind:'margin'|'ground'){
    const g=new THREE.Group();g.name='F10 steady inhabited shelter apron '+kind;owner.add(g);
    const y=kind==='margin'?.057:.081;
    // A warm, continuous eave on the ground side, drawn below the houses;
    // just an editorial terrain shelf, not a new structure in the sky.
    const l=xs[0]-.15,r=xs.at(-1)!+.15;
    plate(g,'F10 inhabited shelter foundation',[V(l,y,depth-.086),V(r,y,depth-.086),V(r,y,depth+.124),V(l,y,depth+.124)],muted);
    plate(g,'F10 inhabited shelter warm eave',[V(l,y,depth+.12),V(r,y,depth+.12),V(r,y+.071,depth+.16),V(l,y+.071,depth+.16)],eave);
    const tileLights=xs.map((x,i)=>{
      const glow=plate(g,'F10 steady inhabited warm threshold',[V(-.065,0,0),V(.065,0,0),V(.107,0,.131),V(-.101,0,.131)],spill);
      glow.position.set(x,y+.004,depth-.065+(i%2)*.017);
      return glow;
    });
    return {g,tileLights};
  }
  const marginLights=streets(shore,[-.42,-.135,.15,.435],.15,'margin');
  const groundLights=streets(horizon,[-.52,-.18,.16,.50],.28,'ground');
  const lightColor=new THREE.Color(0xffc47a),coolColor=new THREE.Color(0x9b6947);
  return {root,update(lift:number,local:LiftAt,reduced:boolean){
    const readings:number[]=[];
    for(const {hinge,scored,azimuth,p} of folds){
      const actual=local(azimuth);
      const arrival=smooth(.04+p.offset,.86,actual);
      const wave=reduced?0:Math.sin(Math.PI*arrival);
      // A broad crease rises sharply under the traveling impulse, then
      // retains an inward lean. No noise-based camera motion.
      hinge.rotation.x=-(p.reach*arrival+.85*wave);
      scored.visible=arrival>.055;
      readings.push(Math.round(-hinge.rotation.x*100)/100);
    }
    let moved=0;
    for(const item of scraps){
      const phase=smooth(.18+item.lag,.92,local(item.angle));
      const {panel}=item;
      panel.position.copy(item.from).lerp(item.to,phase);
      panel.position.y=pageY(panel.position.x)+.038;
      panel.rotation.z=(reduced?0:.18)*Math.sin(Math.PI*phase);
      if(phase>.08)moved++;
    }
    // Inhabited coats, houses, and the one source silhouette do not move.
    // Warmth pools at door level against the longer, cold folds opposite.
    const shelter=smooth(.19,.88,lift);
    spill.color.copy(coolColor).lerp(lightColor,shelter*.72);
    for(const {tileLights} of [marginLights,groundLights])for(const tile of tileLights)tile.scale.set(1+.16*shelter,1,.61+.39*shelter);
    return {folds:readings,moved,shelterWarmth:Math.round(shelter*100)/100};
  },dispose(){
    groundLights.g.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});groundLights.g.removeFromParent();
    // The returned root and the margin are disposed by the existing owner.
  }};
}
