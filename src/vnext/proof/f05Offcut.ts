import * as THREE from 'three';

const stageDuration=1.04;
const occurrence=1/12;
function seedForEntry() {
  // Non-UI deterministic test injection. Ordinary visits sample exactly once.
  const win=globalThis as typeof globalThis & Record<symbol,unknown>;
  const override=win[Symbol.for('palimpsest.qa.f05-offcut-sample')];
  return typeof override==='number'&&Number.isFinite(override)&&override>=0&&override<1
    ?override:Math.random();
}
const ease=(x:number,a:number,b:number)=>THREE.MathUtils.smoothstep(x,a,b);
export function offcutRead(eligible:boolean,time:number,reduced:boolean){
  const elapsed=reduced&&time>=0?stageDuration:time;
  const lit=eligible&&elapsed>=0&&elapsed<stageDuration;
  return {
    phase:(!eligible||elapsed<0?'paper':lit?'flame':'aftermath') as 'paper'|'flame'|'aftermath',
    elapsed:eligible?Math.max(0,elapsed):0,
    heat:lit?ease(elapsed,0,.14)*(1-ease(elapsed,.62,stageDuration)):0,
    curl:eligible?ease(elapsed,.13,.65):0,
    fall:eligible?ease(elapsed,.60,.98):0,
    gone:eligible&&elapsed>=.98,
  };
}

function laminate(points:readonly number[],indices:readonly number[],depth=.012){
  const n=points.length/2,vertices:number[]=[],faces:number[]=[];
  for(let i=0;i<2;i++){
    for(let p=0;p<points.length;p+=2)vertices.push(points[p],-i*depth,points[p+1]);
  }
  for(let i=0;i<indices.length;i+=3){
    const [a,b,c]=indices.slice(i,i+3);
    faces.push(c,b,a,a+n,b+n,c+n);
  }
  for(let i=0;i<n;i++){
    const j=(i+1)%n;
    faces.push(i,j,i+n,j,j+n,i+n);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setIndex(faces);g.computeVertexNormals();return g;
}

export function makeF05Offcut(parent:THREE.Group,sample=seedForEntry()){
  const root=new THREE.Group();root.name='Station offcut, local paper only';
  root.position.set(3.47,.462,.267);
  parent.add(root);
  const stock=new THREE.MeshStandardMaterial({color:0xc09469,roughness:.93,side:THREE.DoubleSide});
  const char=new THREE.MeshStandardMaterial({color:0x211616,roughness:.99,side:THREE.DoubleSide});
  const activeEdge=stock.clone();
  const pale=stock.color.clone(),dark=char.color.clone();
  const mount=(name:string,g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0)=>{
    const mesh=new THREE.Mesh(g,m);
    mesh.name=name;mesh.position.set(x,y,z);mesh.receiveShadow=true;root.add(mesh);return mesh;
  };
  // A real missing triangular corner after the angled crease breaks. The
  // tip uses a different laminated mesh and falls; uncovered card is empty.
  mount('Offcut body with actual diagonally cut corner',laminate(
    [-.233,-.091,.156,-.091,.231,.021,.084,.089,-.227,.089],
    [0,1,2,0,2,3,0,3,4]),stock);
  const tip=mount('The cut corner that can curl and drop',laminate(
    [.231,.021,.231,.089,.084,.089],[0,1,2]),activeEdge,.002,.002,0);
  const tipAttr=tip.geometry.getAttribute('position') as THREE.Float32BufferAttribute;
  const tipRest=Float32Array.from(tipAttr.array);
  tipAttr.setUsage(THREE.DynamicDrawUsage);
  const seam=mount('Exposed char on the diagonal remaining edge',laminate(
    [.229,.020,.231,.026,.085,.090,.073,.085],[0,1,2,0,2,3]),char,0,.004,0);
  const fallGlow=new THREE.PointLight(0xff915c,0,.92,2);
  fallGlow.position.set(.17,.15,.077);root.add(fallGlow);
  fallGlow.name='One brief warm pool on neighbouring paper and machinery';
  const ribbons=Array.from({length:3},(_,i)=>{
    const g=new THREE.BufferGeometry(),a=new THREE.Float32BufferAttribute(new Float32Array(8*2*3),3);
    const face:number[]=[];
    for(let j=0;j<7;j++){const k=j*2;face.push(k,k+1,k+2,k+1,k+3,k+2);}
    g.setAttribute('position',a.setUsage(THREE.DynamicDrawUsage));g.setIndex(face);
    const m=new THREE.MeshBasicMaterial({color:[0xf87732,0xffa248,0xffd279][i],side:THREE.DoubleSide,
      transparent:true,opacity:0,depthWrite:false});
    const node=mount('Small twisting flame tongue '+(i+1),g,m,.211-i*.028,.007,.059+i*.012);
    node.frustumCulled=false;node.renderOrder=4+i;
    node.rotation.y=[-.14,.60,-.25][i];return {node,a,m,i};
  });
  const eligible=sample>=0&&sample<occurrence;
  let started=false,elapsed=0,priorCurl=-1;
  function update(canStrike:boolean,dt:number,reduced:boolean){
    if(eligible&&canStrike&&!started){started=true;elapsed=0;}
    else if(started&&!reduced)elapsed=Math.min(stageDuration,elapsed+Math.min(.075,Math.max(0,dt)));
    const s=offcutRead(eligible,started?elapsed:-1,reduced);
    const {curl,fall,heat}=s;
    if(priorCurl!==curl){
      priorCurl=curl;
      for(let i=0;i<tipAttr.count;i++){
        const dx=tipRest[i*3],dz=tipRest[i*3+2];
        const corner=Math.max(0,(dz-.089+(dx-.084)*.462)/.068);
        tipAttr.setXYZ(i,dx-.022*curl*corner,tipRest[i*3+1]+.046*curl*corner,dz-.031*curl*corner);
      }
      tipAttr.needsUpdate=true;tip.geometry.computeVertexNormals();
      activeEdge.color.copy(pale).lerp(dark,curl*.97);
    }
    tip.position.set(.002+.061*fall,.002+Math.sin(fall*Math.PI)*.025-.052*fall,.096*fall);
    tip.rotation.z=-.73*fall;
    seam.visible=curl>.46;
    fallGlow.intensity=heat*(1.28+.08*Math.sin(elapsed*41));
    for(const {node,a,m,i} of ribbons){
      node.visible=heat>.015;
      m.opacity=heat*[.78,.96,.96][i];
      if(!node.visible)continue;
      const height=(.158+i*.027)*(.55+.45*heat)*(1+.12*Math.sin(elapsed*(17+i*3)+i*2));
      for(let row=0;row<8;row++){
        const t=row/7;
        const width=(.053-i*.012)*Math.pow(1-t,1.12)*(.77+.23*Math.sin(.5+t*Math.PI));
        const flick=.039*t*t*Math.sin(16*elapsed+t*4.8+i)+(.022+i*.011)*t*t;
        const twist=.026*t*Math.sin(elapsed*21+t*4+i*1.14);
        for(const j of [-1,1])a.setXYZ(row*2+Number(j>0),flick+j*width/2,height*t,twist+j*width*.16*Math.sin(3*t));
      }
      a.needsUpdate=true;
    }
    return s;
  }
  return {root,update};
}
