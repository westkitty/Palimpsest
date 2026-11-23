import * as THREE from 'three';
import { f02InkRate, f02InkBeat } from './f02Motion.ts';
import { folioStock } from './livingPaperStock.ts';
import { planetPattern, sourceInkRegistration, type FolioActions, type FolioIndex } from './folioLogic.ts';

/**
 * This layer belongs to the Living Book only. Named Vault specimens were sourced
 * separately; their plate numbers are the revision's editorial mapping, not a claim
 * that the earlier anonymous teaching plates were ever canonically named.
 * https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/worldsvault-templates.body.html
 */
export const REVISION_VAULT_TEMPLATES = [
  {name:'Syrrian IV', motif:'Airborne islands above an atmospheric sea', stock:0x8dbac4, ink:0x3e6775},
  {name:'Nimbus III', motif:'Bioluminescence in eternal twilight', stock:0x524574, ink:0x423677},
  {name:'Cirrus I', motif:'Translucent continents in glass-like sky strata', stock:0x9bc4d5, ink:0x537c98},
] as const;
export type RevisionEarlyArt = {
  root:THREE.Group;
  update(state:FolioActions,dt:number,reduced:boolean):void;
};
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const ease=(v:number)=>{const n=clamp(v);return n*n*(3-2*n);};
const damp=(a:number,b:number,dt:number,r:boolean,lambda=6.4)=>r?b:THREE.MathUtils.damp(a,b,lambda,Math.min(Math.max(dt,0),0.07));
const std=(color:number,extra:THREE.MeshStandardMaterialParameters={})=>new THREE.MeshStandardMaterial({color,roughness:0.89,side:THREE.DoubleSide,...extra});
function mesh(root:THREE.Object3D,name:string,g:THREE.BufferGeometry,mat:THREE.Material,x=0,y=0,z=0):THREE.Mesh{
  const o=new THREE.Mesh(g,mat);o.name=name;o.position.set(x,y,z);root.add(o);return o;
}
function box(root:THREE.Object3D,name:string,mat:THREE.Material,w:number,h:number,d:number,x=0,y=0,z=0):THREE.Mesh{
  const o=mesh(root,name,new THREE.BoxGeometry(w,h,d),mat,x,y,z);o.receiveShadow=true;return o;
}
function sheet(root:THREE.Object3D,name:string,mat:THREE.Material,vertices:number[],indices:number[]):THREE.Mesh{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setIndex(indices);g.computeVertexNormals();
  const o=mesh(root,name,g,mat);o.receiveShadow=true;return o;
}
function setResource<T extends THREE.Material>(mat:T, resource:{dispose():void}):T {
  // previewV2 owns scene disposal; texture lifetime travels with the material.
  mat.addEventListener('dispose',()=>resource.dispose());return mat;
}
function disposeChildren(group:THREE.Group):void{
  const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();
  group.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.LineSegments){
    geometries.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
  }});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();
}

function registerF01(root:THREE.Group):RevisionEarlyArt['update']{
  const positions=[-2.67,0,2.67];
  const cut=std(0xb6976d);
  const face=std(0xdcc399);
  const dark=std(0x695442);
  const crease=std(0x806549);
  const frame=new THREE.Group();frame.name='F01 • three-aperture die-cut cardstock register';root.add(frame);
  frame.position.set(0,0.303,1.49);
  // Three punched apertures and beveled outside ends; the dark open space is
  // under the paper bridge, not printed onto it.
  const outline=new THREE.Shape();
  outline.moveTo(-3.92,-0.14);outline.lineTo(-3.78,-0.235);outline.lineTo(3.78,-0.235);
  outline.lineTo(3.92,-0.14);outline.lineTo(3.92,0.14);outline.lineTo(3.78,0.235);
  outline.lineTo(-3.78,0.235);outline.lineTo(-3.92,0.14);outline.closePath();
  for(const x of positions){
    const hole=new THREE.Path();hole.moveTo(x-0.23,-0.115);hole.lineTo(x-0.23,0.115);
    hole.lineTo(x+0.23,0.115);hole.lineTo(x+0.23,-0.115);hole.closePath();
    outline.holes.push(hole);
  }
  const register=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:0.026,bevelEnabled:false,curveSegments:1}),[face,cut]);
  register.rotation.x=-Math.PI/2;register.castShadow=true;register.receiveShadow=true;frame.add(register);
  for(const x of [-3.7,-1.36,1.36,3.7]){
    sheet(frame,'Scored register saddle',dark,[x-0.19,-0.083,0.21,x+0.19,-0.083,0.21,
      x+0.12,0.014,0.115,x-0.12,0.014,0.115],[0,1,2,0,2,3]);
    box(frame,'Saddle glue tab',cut,0.38,0.012,0.065,x,-0.079,0.24);
  }
  for(const x of [-3.5,-1.91,1.91,3.5]){
    box(frame,'Blind score mark',crease,0.015,0.004,0.33,x,0.028,0);
  }
  const tongues=positions.map((x,i)=>{
    const fixed=new THREE.Group();fixed.position.set(x,0.009,0.089);frame.add(fixed);
    fixed.name='Paired standee register tongue '+(i+1);
    box(fixed,'Tongue scored hinge',cut,0.35,0.019,0.060,0,0,0);
    const hinge=new THREE.Group();fixed.add(hinge);
    const t=box(hinge,'Slit-fitted paper tongue',cut,0.32,0.021,0.155,0,0,-0.076);
    t.castShadow=true;
    for(let s=0;s<i+1;s++){
      box(hinge,'Paper index tick',dark,0.019,0.002,0.047,(s-i/2)*0.061,0.012,-0.078);
    }
    return hinge;
  });
  return (state,dt,reduced)=>{
    tongues.forEach((t,i)=>{
      t.rotation.x=damp(t.rotation.x,state.f01.fold?-0.89-(i===1?0.10:0):0,dt,reduced);
      t.rotation.y=damp(t.rotation.y,state.f01.compare?(i-1)*0.07:0,dt,reduced);
    });
  };
}

/** Deterministic paper coordinates; a pixel of starlight is never composited outside soaked ink. */
const inkVertex = /* glsl */ `
uniform vec2 panelSize;
uniform vec2 panelCenter;
varying vec2 page;
void main(){
  page=(uv-.5)*panelSize*vec2(1.,-1.)+panelCenter;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}`;
const inkFragment = /* glsl */ `
uniform float advance;
uniform sampler2D atlas;
uniform vec3 vellumWhite;
varying vec2 page;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
float noise(vec2 p){
 vec2 i=floor(p),r=fract(p);r=r*r*(3.-2.*r);
 return mix(mix(hash(i),hash(i+vec2(1,0)),r.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),r.x),r.y);
}
// Arrival down a scored fiber direction, then cross-fiber osmosis.
float channel(vec2 p,vec2 a,vec2 b,float inlet,float outlet,float bleed) {
  vec2 v=b-a;
  float t=clamp(dot(p-a,v)/dot(v,v),0.,1.);
  vec2 d=p-a-v*t;
  return mix(inlet,outlet,t)+length(d)*bleed;
}
void main(){
  vec2 p=page;
  vec2 origin=vec2(-3.77,1.57), delta=p-origin;
  float broad=length(vec2(delta.x*.38,(delta.y+delta.x*.10)*.69));
  float rough=(noise(p*2.1)-.5)*.058+(noise(p*5.1)-.5)*.036+(noise(p*18.)-.5)*.015;
  float dryEdge=max(0.,abs(p.x)-4.25)*.11+max(0.,abs(p.y)-2.55)*.16;
  float diffuseTime=.022+broad*.215+dryEdge;
  // Branches are elongated fibers with different tip speeds, not colored particles.
  vec2 branch=vec2(-2.58,1.14), gutter=vec2(-.09,.27);
  float fiberTime=channel(p,origin,branch,.017,.079,.34);
  fiberTime=min(fiberTime,channel(p,branch,vec2(-1.44,1.90),.079,.176,.43));
  fiberTime=min(fiberTime,channel(p,branch,vec2(-2.93,-.14),.079,.222,.37));
  fiberTime=min(fiberTime,channel(p,branch,vec2(-1.35,.76),.079,.218,.41));
  fiberTime=min(fiberTime,channel(p,vec2(-1.35,.76),gutter,.218,.345,.36));
  float left=min(diffuseTime,fiberTime)+rough*clamp(broad*1.8,0.,1.);
  // Pearl-black ink runs along the exposed edge while there is no wet
  // continuation on the opposite leaf. Then two faster fingers carry it across.
  float gather=channel(p,gutter,vec2(-.09,1.98),.342,.502,.35);
  gather=min(gather,channel(p,gutter,vec2(-.09,-2.02),.342,.527,.32));
  left=min(left,gather+rough*.46);
  vec2 spill=vec2(.095,.27), split=vec2(2.28,.30);
  float flood=.482+length(vec2((p.x-spill.x)*.50,(p.y-spill.y)*.83))*.133;
  float right=min(flood,channel(p,spill,split,.474,.546,.24));
  right=min(right,channel(p,split,vec2(4.27,-1.34),.546,.674,.28));
  right=min(right,channel(p,split,vec2(4.08,1.96),.546,.641,.28));
  right=max(.472,right+rough*.63+dryEdge);
  float arrive=p.x<0.?left:right;
  float grain=noise(vec2(p.x*85.,p.y*29.));
  float fine=hash(floor(p*208.));
  float fiber=grain*.60+fine*.40;
  float tide=advance-arrive;
  float spread=smoothstep(-.009,.021,tide) * step(.001,advance);
  float soak=smoothstep(.005,.055,tide)*step(.001,advance);
  float wet=smoothstep(-.002,.018,tide)*(1.-smoothstep(.025,.073,tide))*spread;
  vec3 vellum=vellumWhite*mix(.945,1.013,fiber);
  float press=noise(vec2(p.x*0.9,p.y*2.0));
  float score=1.-smoothstep(.002,.016,abs(p.y+1.43+abs(p.x)*.029));
  vellum *= 1.-.060*score-.034*press;
  float rings=.18+.82*noise(p*6.3);
  vec3 ink=mix(vec3(.012,.018,.027),vec3(.0035,.0061,.011),soak);
  // Thin moving meniscus followed by a low standing film, then matte soak.
  // Finer fibers stay legible without turning the dark page into gravel.
  float rimTide=(1.-smoothstep(.002,.014,abs(tide-.010)))*spread;
  float runnels=.24+.76*noise(vec2(p.x*8.3+p.y*3.1,p.y*15.2)-vec2(advance*.9,0.));
  ink+=wet*vec3(.043,.065,.101)*rings;
  ink+=rimTide*vec3(.085,.120,.162)*runnels;
  ink+=(grain-.5)*.0055;
  vec3 paper=mix(vellum,ink,spread);
  vec2 cell=clamp(vec2((p.x+4.56)/9.12,(p.y+2.85)/5.70),.002,.998);
  vec3 stars=texture2D(atlas,cell).rgb;
  // Three individual phases; the first two develop in the dark rather than
  // being revealed through a global page fade. Tide clips every star pixel.
  float safeInterior=smoothstep(.059,.090,tide)*step(.001,advance);
  float points=smoothstep(.123,.251,advance);
  float clusters=smoothstep(.411,.598,advance);
  float galaxies=smoothstep(.683,.903,advance);
  vec3 stellar=stars.r*points*vec3(.66,.83,.99)
    +stars.g*clusters*vec3(.20,.56,.85)
    +stars.b*galaxies*vec3(.44,.34,.22);
  paper+=stellar*safeInterior;
  gl_FragColor=vec4(paper,1.);
  #include <colorspace_fragment>
}`;
function atlasStars():THREE.DataTexture{
  const w=1024,h=640;
  const data=new Uint8Array(w*h*4);
  let seed=0x68e616fd;
  const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const point=(x:number,y:number,r:number,a:number,channel:number)=>{
    for(let iy=Math.max(0,Math.floor(y-r));iy<Math.min(h,Math.ceil(y+r+1));iy++){
      for(let ix=Math.max(0,Math.floor(x-r));ix<Math.min(w,Math.ceil(x+r+1));ix++){
        const t=((ix-x)**2+(iy-y)**2)/(r*r);
        if(t>1)continue;
        const k=(iy*w+ix)*4+channel;
        data[k]=Math.min(255,data[k]+Math.round(a*Math.exp(-t*3.4)));
      }
    }
  };
  for(let i=0;i<660;i++){
    const x=8+rnd()*(w-16),y=7+rnd()*(h-14);
    const bright=rnd()>.90;
    point(x,y,bright?3.7:1.8,bright?215:50+rnd()*135,0);
    if(i%47===0){
      for(let q=-5;q<=5;q++){
        point(x+q,y,0.94,115/(Math.abs(q)+1),0);point(x,y+q,0.94,115/(Math.abs(q)+1),0);
      }
    }
  }
  for(const [cx,cy,r] of [[201,422,54],[365,191,38],[650,423,70],[802,126,37],[920,293,39],[130,192,31],[827,539,31]]){
    for(let j=0;j<108;j++){
      const a=rnd()*Math.PI*2;const d=(rnd()**1.8)*r;
      point(cx+Math.cos(a)*d,cy+Math.sin(a)*d*.59,1.25+rnd()*3,18+rnd()*115,1);
    }
    point(cx,cy,r*.91,36,1);
  }
  // Curved stellar dust bands, not a cosmological scale diagram.
  const cx=586,cy=338;
  for(let arm=0;arm<4;arm++){
    for(let j=0;j<470;j++){
      const t=(j+rnd())/470;
      const a=arm*Math.PI*.5+t*5.12;
      const r=12+t*303;
      const sx=Math.sin(a)*r;const sy=Math.cos(a)*r*.51;
      const x=cx+sx+sy*.38+(rnd()-.5)*(14+t*35);
      const y=cy+sy-sx*.23+(rnd()-.5)*(10+t*25);
      point(x,y,(1.4+rnd()*8)*(1.25-t*.45),15+rnd()*65,2);
      if(j%4===0)point(x,y,1.9+rnd()*1.3,30+rnd()*95,2);
    }
  }
  point(cx,cy,54,68,2);point(cx,cy,25,155,2);point(cx,cy,7,195,2);
  const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);
  texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
  texture.needsUpdate=true;return texture;
}
function vellumF02(root:THREE.Group):RevisionEarlyArt['update']{
  const advance={value:0};
  const atlas=atlasStars();
  const size=new THREE.Vector2(4.47,5.76);
  const vellumWhite={value:new THREE.Color(folioStock(1).face)};
  for(const [i,x] of [-2.32,2.32].entries()){
    const mat=new THREE.ShaderMaterial({
      vertexShader:inkVertex,fragmentShader:inkFragment,
      uniforms:{advance,vellumWhite,atlas:{value:atlas},panelSize:{value:size},panelCenter:{value:new THREE.Vector2(x,0)}},
      side:THREE.FrontSide, toneMapped:false,
    });
    if(i===0)setResource(mat,atlas);
    const panel=mesh(root,'F02 • white vellum with an ink-bound stellar mask',new THREE.PlaneGeometry(size.x,size.y),mat,x,0.210,0);
    panel.rotation.x=-Math.PI/2;
  }
  const drop=mesh(root,'F02 first ink drop',new THREE.SphereGeometry(.096,12,8),
    std(0x080c15,{roughness:.22,metalness:.24}),-3.77,.34,1.57);
  drop.visible=false;
  const wick=new THREE.Group();wick.name='F02 • folded rag-fiber ink witness';wick.position.set(-3.79,0.225,1.60);
  wick.rotation.y=0.39;root.add(wick);
  const cut=std(0xcbb98f);
  const wickFace=std(0xf1e6c7);
  const fiberTips=Array.from({length:10},()=>std(0xe4d1a8));
  const dry=[new THREE.Color(0xe4d1a8),new THREE.Color(0xcbb98f),new THREE.Color(0xf1e6c7)];
  const wetColor=new THREE.Color(0x171923);
  const body=sheet(wick,'Wick • accordion scores and cut edge',wickFace,
    [-.32,0,-.17,-.16,.09,-.16,-.03,.024,-.10,.115,.095,-.035,.22,.016,.097,
      -.34,.003,.113,-.18,.07,.184,-.03,.02,.201,.107,.08,.264,.205,.008,.290],
    [0,1,5,1,6,5,1,2,6,2,7,6,2,3,7,3,8,7,3,4,8,4,9,8]);
  body.castShadow=true;
  box(wick,'Glued tail foot',cut,0.29,0.017,0.19,-.265,0.012,-.008);
  for(let i=0;i<10;i++){
    const t=box(wick,'Visible cut fiber '+(i+1),fiberTips[i],0.114+0.085*((i*13)%9)/8,0.015,0.018,
      0.235-0.042*(i%3),0.020+(i%2)*0.007,0.069+i*0.022);
    t.rotation.y=-0.38-(i%4)*0.10;
  }
  const destination=[0,.31,.66,1.0] as const;
  let init=false;
  let lastReveal=0;
  return (state,dt,reduced)=>{
    const reveal=state.f02.reveal;
    const target=destination[reveal];
    if(!init||reduced||reveal<lastReveal)advance.value=target;
    else advance.value=Math.min(target,advance.value+Math.min(0.07,Math.max(0,dt))*f02InkRate(advance.value));
    init=true;lastReveal=reveal;
    const a=advance.value;
    const impact=ease(a/.040), absorb=ease((a-.039)/.088);
    drop.visible=!reduced&&a>0&&a<.127;
    drop.position.y=.23+.17*(1-impact);
    drop.scale.set((.6+.83*impact)*(1-absorb*.82),Math.max(.02,(1.05-impact*.86)*(1-absorb)),(.6+.83*impact)*(1-absorb*.82));
    root.userData.inkBeat=f02InkBeat(a);
    for(let i=0;i<fiberTips.length;i++)fiberTips[i].color.copy(dry[0]).lerp(wetColor,ease(advance.value*30-i*.055));
    cut.color.copy(dry[1]).lerp(wetColor,ease(advance.value*8-.14));
    wickFace.color.copy(dry[2]).lerp(wetColor,ease(advance.value*6-.16)*.78);
    root.userData.inkAdvance=advance.value;
  };
}

const markAt=(angle:number,y:number,r:number)=>new THREE.Vector3(Math.cos(angle)*r,y,Math.sin(angle)*r);
function creaseLines(group:THREE.Group,name:string,positions:number[],color:number,opacity:number):void{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,opacity,transparent:opacity<1}));
  l.name=name;group.add(l);
}
function nameCard(root:THREE.Group,template:0|1|2):void{
  const meta=REVISION_VAULT_TEMPLATES[template];
  const surface=document.createElement('canvas');surface.width=670;surface.height=172;
  const ctx=surface.getContext('2d');if(!ctx)throw new Error('F03 paper index requires 2D canvas');
  ctx.fillStyle='#e6d7b4';ctx.fillRect(0,0,surface.width,surface.height);
  ctx.strokeStyle='#98815c';ctx.lineWidth=4;ctx.strokeRect(9,9,652,154);
  ctx.fillStyle='#292820';ctx.font='600 58px Georgia,serif';ctx.textAlign='center';
  ctx.fillText(meta.name,335,84,586);
  ctx.fillStyle='#604b36';ctx.font='500 29px Georgia,serif';ctx.fillText('VAULT  •  PLATE '+(template+1),335,131,565);
  const tex=new THREE.CanvasTexture(surface);tex.colorSpace=THREE.SRGBColorSpace;
  const mat=setResource(new THREE.MeshBasicMaterial({map:tex}),tex);
  const card=mesh(root,meta.name+' template index card',new THREE.PlaneGeometry(1.55,.40),mat,-1.95,.296,1.66);
  card.rotation.x=-Math.PI/2;
}
function registerF03(root:THREE.Group,template:0|1|2,x:number,y:number,z:number):void{
  const bits=sourceInkRegistration(template);
  const g=new THREE.Group();g.name='F03 traced template ink registration '+bits.join('');
  g.userData.family=template;g.userData.mark=bits.join('');g.position.set(x,y,z);root.add(g);
  const ink=std(0x266681),dry=std(0xbcab89);
  for(let i=0;i<4;i++)box(g,'Source notch '+(i+1),bits[i]===1?ink:dry,.086,.008,.106,(i-1.5)*.120,0,0);
}

export function foldedGlobe(parent:THREE.Group,template:0|1|2,generation:number,radius:number,isSource:boolean):THREE.Group{
  const meta=REVISION_VAULT_TEMPLATES[template],variation=planetPattern(template,generation);
  const globe=new THREE.Group();globe.name=(isSource?'Vault specimen • ':'Notebook output • ')+meta.name;
  globe.userData={family:template,generation,model:isSource?'source template':'bounded Notebook variant',templateName:meta.name,motif:meta.motif};
  parent.add(globe);
  const n=variation.facet;
  const steps=7;
  const stock=std(meta.stock,{vertexColors:true});
  const seam=std(meta.ink,{roughness:.96});
  const edge:number[]=[];
  const color=new THREE.Color();
  const tone=new THREE.Color(1,1,1);
  const vertex=(col:number,row:number,ridgeLift=0)=>{
    const polar=(row/steps)*Math.PI;
    const az=(col/n)*Math.PI*2;
    const rr=Math.sin(polar)*radius*(1+ridgeLift);
    return markAt(az,Math.cos(polar)*radius,rr);
  };
  // Distinct die-cut cardstock gores meet along real paper ridges at the
  // poles. They are triangulated from a ruled strip rather than a smooth globe.
  for(let j=0;j<n;j++){
    const points:number[]=[],colors:number[]=[],idx:number[]=[];
    for(let row=0;row<=steps;row++){
      const left=vertex(j,row),ridge=vertex(j+.5,row,.021),right=vertex(j+1,row);
      const w=row/steps;
      const twoTone=(j*5+row*3+template)%7/6;
      for(const [i,p] of [left,ridge,right].entries()){
        points.push(p.x,p.y,p.z);
        tone.setScalar(.82+Math.sin(w*9+j*2.35)*.09+twoTone*.08+i*.05);
        color.copy(tone);colors.push(color.r,color.g,color.b);
      }
      if(row>0){
        const old=(row-1)*3;
        idx.push(old,old+3,old+1,old+1,old+3,old+4,old+1,old+4,old+2,old+2,old+4,old+5);
        edge.push(...vertex(j,row-1,.013).toArray(),...vertex(j,row,.013).toArray());
      }
    }
    const panel=sheet(globe,'Scored and folded cardstock gore '+(j+1),stock,points,idx);
    panel.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    panel.castShadow=true;
  }
  creaseLines(globe,'Raised paper seams',edge,meta.ink,.85);
  for(const sign of [-1,1]){
    const cap=mesh(globe,'Pinned polar fold stack',new THREE.CylinderGeometry(radius*.088,radius*.092,.020,6),seam,0,sign*(radius-.001),0);
    cap.rotation.y=.31;
  }

  if(template===0) {
    // Airborne plate fragments clear the impressed atmospheric bands.
    const bands=std(0xcde5df);
    const top=std(0xe1c484);
    const underside=std(0x677787);
    for(let i=0;i<5;i++){
      const a=i*2.399+variation.seamAngle;
      const y=(.14+((i*3)%5)*.099)*radius;
      const local=new THREE.Group();local.position.copy(markAt(a,y,Math.sqrt(radius*radius-y*y)*1.14));
      local.rotation.y=-a+Math.PI*.5;globe.add(local);
      const w=radius*(.24+(i%3)*.074);const d=radius*(.10+(i%2)*.058);
      sheet(local,'Suspended island, visible paper cut edge',top,[-w,.024,0,-w*.34,.042,-d,w*.8,.030,-d*.67,
        w,.020,d*.45,-w*.44,.013,d,-w*.53,-.036,d*.25],[0,1,4,1,2,4,2,3,4,0,4,5,4,3,5]);
      sheet(local,'Paper island underside',underside,[-w,.022,0,-w*.53,-.036,d*.25,w,.020,d*.45,0,-.077,0],[0,1,3,1,2,3]);
    }
    makeStrata(globe,bands,radius,[-.43,-.18],.027,.70+variation.oceanShare*.09,'Atmospheric sea layers');
  } else if(template===1) {
    makeStrata(globe,std(0x7765a0),radius,[.28,-.30],.012,.77,'Twilight horizon fold bands');
    const speck=new THREE.MeshBasicMaterial({color:0xd5ffd6,side:THREE.DoubleSide});
    const b=std(0x68b5a2);
    for(let i=0;i<53;i++){
      const a=2.399*i+variation.seamAngle;
      const y=radius*Math.sin(i*8.21)*.74;
      const r=Math.sqrt(radius*radius-y*y)*1.035;
      const pos=markAt(a,y,r);
      const o=mesh(globe,'Print-lit bioluminescent mark',new THREE.PlaneGeometry(radius*(i%5===0?.086:.037),radius*(i%5===0?.024:.013)),i%3?speck:b);
      o.position.copy(pos);o.lookAt(pos.clone().multiplyScalar(2));o.rotateZ(a*.26);
    }
  } else {
    const glass=std(0xd7f0ef,{transparent:true,opacity:.56,depthWrite:false,roughness:.50});
    const cold=std(0xe4f6f8,{transparent:true,opacity:.65,depthWrite:false});
    makeStrata(globe,glass,radius,[-.46,-.19,.11,.37],.042,.72,'Clear folded sky strata');
    for(let i=0;i<6;i++){
      const a=i*2.399+variation.seamAngle;
      const y=radius*.60*Math.sin(i*2.1);
      const pos=markAt(a,y,Math.sqrt(radius*radius-y*y)*1.108);
      const s=radius*(.24+((i*7)%5)*.033);
      const poly=sheet(globe,'Translucent continent facets',cold,
        [-s,-s*.18,0,-s*.54,s*.84,0,s*.31,s*.61,s*.09,s,s*.25,0,s*.5,-s*.5,0,0,0,s*.11],
        [0,1,5,1,2,5,2,3,5,3,4,5,4,0,5]);
      poly.position.copy(pos);poly.lookAt(pos.clone().multiplyScalar(2));
    }
  }
  globe.rotation.z=variation.tilt;
  globe.rotation.y=variation.seamAngle;
  return globe;
}
function makeStrata(root:THREE.Group,mat:THREE.Material,r:number,heights:number[],w:number,open:number,name:string):void{
  heights.forEach((h,j)=>{
    const vertices:number[]=[],indices:number[]=[];
    const rr=Math.sqrt(Math.max(0,1-h*h))*r*1.024;
    for(let i=0;i<=22;i++){
      const a=j*.66+(i/22)*Math.PI*2*open;
      const lo=markAt(a,r*h-w*.5,rr),hi=markAt(a,r*h+w*.5,rr+w*.60);
      vertices.push(...lo.toArray(),...hi.toArray());
      if(i>0){const k=i*2;indices.push(k-2,k,k-1,k-1,k,k+1);}
    }
    sheet(root,name,mat,vertices,indices);
  });
}
function cradleAt(root:THREE.Group,x:number,y:number,z:number,large:boolean):void {
  const cradle=new THREE.Group();cradle.position.set(x,y,z);cradle.name='F03 • notched cardstock globe cradle';root.add(cradle);
  const base=std(0xa89065),dark=std(0x685f4d),stock=std(0xd6b98b);
  const w=large?1.02:.69;
  box(cradle,'Die cut paper cradle slab',base,w,.040,w*.66);
  box(cradle,'Scored cradle step',dark,w*.81,.029,w*.51,0,.023,0);
  for(const k of [-1,1]){
    const notch=new THREE.Shape();
    notch.moveTo(-w*.46,0);notch.lineTo(-w*.46,w*.21);notch.lineTo(-w*.27,w*.21);notch.lineTo(-w*.11,w*.076);
    notch.lineTo(w*.11,w*.076);notch.lineTo(w*.27,w*.21);notch.lineTo(w*.46,w*.21);notch.lineTo(w*.46,0);notch.closePath();
    const jaw=mesh(cradle,'Open V notch • creased paper jaw',new THREE.ExtrudeGeometry(notch,{depth:.041,bevelEnabled:false}),stock,0,.043,k*w*.19);
    jaw.rotation.x=k*.18;jaw.castShadow=true;
    const glue=box(cradle,'Cradle glue flap',base,w*.88,.016,w*.115,0,.042,k*w*.28);glue.rotation.x=k*.09;
  }
}
function vaultF03(root:THREE.Group):RevisionEarlyArt['update']{
  const bank=new THREE.Group();bank.name='Vault • source-verified dossier template mapping';root.add(bank);
  const cradles=[[-1.95,.293,1.06],[1.76,.279,-.36],[3.23,.279,-.20]] as const;
  cradles.forEach(([x,y,z],i)=>cradleAt(root,x,y,z,i===0));
  const follower=new THREE.Group();root.add(follower);
  follower.name='F03 • hinged paper result follower';
  follower.position.set(.76,.298,.02);
  const gold=std(0xae8756),stock=std(0xe2cea4);
  box(follower,'Follower end scored onto die guide',gold,.15,.032,.21,0,0,0);
  const ribbon=box(follower,'Fold-down paper transfer tongue',stock,.72,.028,.15,.338,.040,0);
  ribbon.rotation.z=.095;
  let family=-1,generation=-1,vaultRise=0,previousVault=false;
  let pulse=0;
  let reference:THREE.Group|null=null;
  let outputs:THREE.Group[]=[];
  return (state,dt,reduced)=>{
    const s=state.f03;
    if(family!==s.template||generation!==s.generation){
      pulse=family===-1?0:1;
      family=s.template;generation=s.generation;
      disposeChildren(bank);
      const x=cradles[0][0],z=cradles[0][2];
      reference=foldedGlobe(bank,s.template,0,.535,true);
      reference.position.set(x,.905,z);
      nameCard(bank,s.template);
      registerF03(bank,s.template,x,.289,z+.415);
      outputs=cradles.slice(1).map(([x,y,z],i)=>{
        const output=foldedGlobe(bank,s.template,s.generation+i,.407,false);
        output.position.set(x,y+.479,z);
        registerF03(bank,s.template,x,.288,z+.431);
        return output;
      });
      root.userData.family=family;root.userData.generation=generation;root.userData.template=REVISION_VAULT_TEMPLATES[s.template].name;
    }
    // A opens the Vault's own source object, not the already registered outputs.
    const hasWindow=Boolean(reference)&&(s.vaultOpen||vaultRise>.023);
    if(previousVault!==s.vaultOpen&&reduced)vaultRise=s.vaultOpen?1:0;
    vaultRise=damp(vaultRise,s.vaultOpen?1:0,dt,reduced,7.0);
    previousVault=s.vaultOpen;
    if(reference){
      reference.visible=hasWindow;
      const f=ease(vaultRise);
      reference.position.y=.358+.541*f;
      reference.scale.set(1-.22*(1-f),.045+.955*f,1-.22*(1-f));
    }
    pulse=Math.max(0,pulse-(reduced?1:Math.min(Math.max(dt,0),.07)*1.42));
    const seq=Math.sin(pulse*Math.PI);
    follower.rotation.z=-seq*.29;
    follower.position.x=.76+seq*.12;
    outputs.forEach((g,i)=>{
      const f=pulse===0?1:ease((1-pulse)*1.44-i*.18);
      g.scale.y=.43+.57*f;
      g.position.y=cradles[i+1][1]+.261+.218*f;
      g.rotation.z=planetPattern(family,generation+i).tilt+seq*.07;
    });
  };
}

export function createRevisionEarlyArt(index:FolioIndex):RevisionEarlyArt{
  const root=new THREE.Group();
  root.name='Living Book • revised early paper F0'+(index+1);
  return {root,update:index===0?registerF01(root):index===1?vellumF02(root):vaultF03(root)};
}
