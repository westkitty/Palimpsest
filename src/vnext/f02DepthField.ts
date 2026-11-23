import * as THREE from 'three';

const clamp=(x:number)=>THREE.MathUtils.clamp(x,0,1);
const smooth=(x:number,a:number,b:number)=>THREE.MathUtils.smoothstep(x,a,b);
export function f02DepthRead(ink:number,frame:number){
  // Do not birth a world before the facing leaf is visibly soaked and the
  // authentic C strips have actually started to separate from their supports.
  const lift=smooth(ink,.684,.964)*smooth(frame,72,100);
  const wake=smooth(ink,.492,.664)*(.21+.79*lift);
  return {lift,wake,depthBeat:lift>.995?'deep-field':lift>.05?'lifting-veils':wake>.02?'condensing':'sealed'};
}
const vertex=/*glsl*/`
uniform float lift;
uniform float clock;
uniform float strand;
varying vec2 uvPlane;
varying vec3 sceneP;
void main(){
  uvPlane=uv;
  vec3 v=position;
  float rise=pow(lift,1.18);
  float shiver=sin(uv.x*19.-clock*.94+strand)*(.018+uv.x*.028)*rise;
  v.y=.220+(v.y-.220)*rise+shiver*uv.x;
  v.x+=sin(clock*.51+strand+uv.x*14.)*rise*uv.x*.063;
  sceneP=v;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);
}`;
const fragment=/*glsl*/`
uniform float wake;
uniform float lift;
uniform float clock;
uniform float strand;
uniform vec3 innerInk;
uniform vec3 outerInk;
varying vec2 uvPlane;
varying vec3 sceneP;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float n2(vec2 p){
 vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
}
void main(){
  float u=uvPlane.x, v=uvPlane.y;
  float spine=.5-v;
  float stream=clock*.082+strand*2.12;
  float drift=n2(vec2(u*8.-stream,v*5.+strand));
  float broad=n2(vec2(u*15.-stream*.78,v*5.+drift*2.));
  float fil=n2(vec2(u*59.-stream*1.23,v*18.+broad*2.7));
  float middle=exp(-abs(spine+.10*(drift-.5))*7.3);
  float feather=smoothstep(0.,.20,v)*(1.-smoothstep(.81,1.,v));
  float head=smoothstep(.015,.17,u)*(1.-smoothstep(.75,1.,u));
  float billow=.48*broad+.31*drift+.21*fil;
  float filament=pow(max(0.,.78*middle+.39*fil),3.7);
  float ink=smoothstep(.304,.75,billow+filament*.18);
  vec3 color=mix(outerInk,innerInk,smoothstep(.52,.98,filament*1.35+ink*.65));
  color*=.73+billow*.56;
  // Keep both actual source landmarks as foreground anchors, not silhouettes
  // covered up by an additive screen wash.
  float geode=smoothstep(.22,.87,length((sceneP.xz-vec2(2.27,.24))*vec2(1.,.83)));
  float zentrum=smoothstep(.17,.73,length((sceneP.xz-vec2(-2.39,.44))*vec2(1.,.94)));
  float shape=head*feather*(.36+.64*middle)*(.24+.55*ink+.23*filament);
  float alpha=shape*wake*(.30+.70*lift)*mix(.42,1.,geode*zentrum);
  if(alpha<.010) discard;
  gl_FragColor=vec4(color,alpha);
  #include <colorspace_fragment>
}`;
const dustVert=/*glsl*/`
attribute float order;
attribute float heft;
attribute vec3 ink;
uniform float lift;
uniform float clock;
varying vec3 luminous;
varying float emergence;
varying float grain;
void main(){
  vec3 p=position;
  float local=smoothstep(order-.25,order+.22,lift);
  p.y=.23+(p.y-.23)*local*lift;
  float wobble=sin(clock*.64+order*44.+heft*13.) *local*lift;
  p.x+=wobble*.065; p.z+=wobble*.039;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp(heft*230./max(1.,-mv.z),1.1,12.);
  luminous=ink;
  emergence=local*(.66+.34*sin(clock*1.7+order*21.));
  grain=heft;
}`;
const dustFrag=/*glsl*/`
uniform float lift;
varying vec3 luminous;
varying float emergence;
varying float grain;
void main(){
  vec2 p=gl_PointCoord-.5;
  float r=length(p);
  float core=exp(-r*r*39.);
  float soft=exp(-r*r*9.)*(1.-smoothstep(.24,.5,r));
  float flare=max(0.,1.-abs(p.x)*15.)*max(0.,1.-abs(p.y)*2.3)+max(0.,1.-abs(p.y)*15.)*max(0.,1.-abs(p.x)*2.3);
  float a=(core*.66+soft*.26+flare*.18*step(.155,grain))*emergence*lift;
  if(a<.014)discard;
  gl_FragColor=vec4(luminous,a);
  #include <colorspace_fragment>
}`;
const TAU=Math.PI*2;
function path(u:number,j:number,layer:number){
  const start=j*TAU/4+.16*layer;
  const a=start+u*4.4;
  const r=.13+3.23*u;
  return new THREE.Vector3(
    .10+Math.sin(a)*r,
    .23+(.29+.78*u+layer*.17)*Math.sin(Math.PI*u*.91)+u*(.18+layer*.125)+Math.sin(a*1.43)*u*.14,
    -.47+Math.cos(a)*r*.48,
  );
}
const palettes=[
  [0xa7eee9,0x1e698d],
  [0xffdca0,0x8d493c],
  [0xa3bcfc,0x4057a0],
  [0xffd391,0x784637],
] as const;

/** Billowed, die-cut laminae occupy different world depths; the witness
 * camera passes among them. None of these sources is a page-sized billboard. */
export function makeF02DepthField(parent:THREE.Group){
  const root=new THREE.Group();root.name='F02 • ink becomes suspended deep field';root.visible=false;parent.add(root);
  const wake={value:0},lift={value:0},clock={value:0};
  const owned: {geometry:THREE.BufferGeometry;material:THREE.Material}[]=[];
  for(let strand=0;strand<12;strand++){
    const arm=strand%4, layer=Math.floor(strand/4);
    const v:number[]=[],uv:number[]=[],ix:number[]=[];
    const divisions=82,widthSamples=4;
    for(let i=0;i<=divisions;i++){
      const u=i/divisions,center=path(u,arm,layer), ahead=path(Math.min(1,u+.008),arm,layer);
      const side=new THREE.Vector3(-(ahead.z-center.z),0,ahead.x-center.x).normalize();
      if(i===divisions)side.set(Math.cos(arm*1.3),0,Math.sin(arm*1.3));
      for(let j=0;j<=widthSamples;j++){
        const f=j/widthSamples, w=(f-.50)*(.36+.68*Math.sin(Math.PI*u*.77)+layer*.095);
        const y=center.y+(Math.sin(f*Math.PI)*.24+Math.sin(u*11.+strand)*.13)*(0.1+.9*u)+w*.26;
        v.push(center.x+side.x*w,y,center.z+side.z*w);uv.push(u,f);
        if(i&&j){let k=i*(widthSamples+1)+j;ix.push(k-widthSamples-2,k-1,k-widthSamples-1,k-1,k,k-widthSamples-1);}
      }
    }
    const geometry=new THREE.BufferGeometry().setIndex(ix);
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    const [inside,outside]=palettes[arm];
    const material=new THREE.ShaderMaterial({
      vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,side:THREE.DoubleSide,
      toneMapped:false,
      uniforms:{lift,wake,clock,strand:{value:strand},innerInk:{value:new THREE.Color(inside)},outerInk:{value:new THREE.Color(outside)}},
    });
    material.forceSinglePass=true;
    const strip=new THREE.Mesh(geometry,material);
    strip.name='F02 • floating fold veil '+strand;
    strip.renderOrder=1+layer;
    strip.frustumCulled=false;root.add(strip);owned.push({geometry,material});
  }
  // Same fold curves seed their own knots, sparsely across and between the
  // actual layers. No all-scene particle spray above the white stage.
  const positions:number[]=[],orders:number[]=[],sizes:number[]=[],ink:number[]=[];
  let rng=0x5271c239;
  const rand=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
  for(let n=0;n<530;n++){
    const u=.055+rand()*.92, arm=n%4, layer=n%3;
    const p=path(u,arm,layer);
    p.x+=(rand()-.5)*.59;p.z+=(rand()-.5)*.43;p.y+=(rand()-.38)*.57;
    positions.push(p.x,p.y,p.z);
    orders.push(.20+u*.66+rand()*.11);sizes.push(n%13===0?.17+rand()*.065:.031+rand()*.073);
    const col=new THREE.Color(n%13===0?0xffedc2:palettes[arm][0]);ink.push(col.r,col.g,col.b);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('order',new THREE.Float32BufferAttribute(orders,1));
  geometry.setAttribute('heft',new THREE.Float32BufferAttribute(sizes,1));
  geometry.setAttribute('ink',new THREE.Float32BufferAttribute(ink,3));
  const material=new THREE.ShaderMaterial({
    vertexShader:dustVert,fragmentShader:dustFrag,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
    uniforms:{lift,clock},
  });
  const dust=new THREE.Points(geometry,material);dust.name='F02 • shear knots seeded off the actual folds';
  dust.renderOrder=7;dust.frustumCulled=false;root.add(dust);owned.push({geometry,material});
  return {update(ink:number,frame:number,dt:number,reduce:boolean){
    const read=f02DepthRead(ink,frame);
    root.visible=read.lift>.002;
    wake.value=read.wake;lift.value=read.lift;
    if(root.visible&&!reduce)clock.value+=Math.min(.065,Math.max(0,dt));
    return read;
  },dispose(){
    root.removeFromParent();owned.forEach(({geometry,material})=>{geometry.dispose();material.dispose();});
  }};
}
