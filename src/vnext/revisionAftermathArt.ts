import {paperFeedMotion,paperFeedStep} from './paperFeedMotion.ts';
import {F12_FEED_START,F12_PORTRAIT_DWELL,f12FeedTime,f12PortraitPose,f12ProcessionStep,paperFoot} from './folioPaperProcession.ts';
import * as THREE from 'three';
import { getOpenPageY } from '../engine/BookAndDeskRig';
import { createF11Challenger } from './challengerF11.ts';
import type { BaseFolioWorld } from '../engine/folios/BaseFolioWorld';
import type { FolioRuntimeState } from '../types/atlas';

type V = THREE.Vector3;
const vec = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const unit = (p: number) => THREE.MathUtils.clamp(p, 0, 1);
const smooth = (a: number, b: number, x: number) => {
  const p = unit((x - a) / (b - a));
  return p * p * (3 - 2 * p);
};
type MechanismArt = { root: THREE.Group; update: (state: FolioRuntimeState, dt: number, reduced: boolean) => void; dispose: () => void };

function artKit(root: THREE.Group) {
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const textures: THREE.Texture[] = [];
  function paper(color: number, glow = 0): THREE.MeshStandardMaterial {
    const key = color + ':' + glow;
    let found = materials.get(key);
    if (!found) {
      found = new THREE.MeshStandardMaterial({color, emissive: glow ? color : 0x000000, emissiveIntensity: glow, roughness: 0.82, metalness: 0, side: THREE.DoubleSide, flatShading: true});
      materials.set(key, found);
    }
    return found;
  }
  function mesh(g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D = root, xyz: V = vec(0, 0, 0)) {
    const o = new THREE.Mesh(g,m);
    o.position.copy(xyz);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(w: number, h: number, d: number, color: number, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    return mesh(new THREE.BoxGeometry(w,h,d),paper(color),parent,vec(x,y,z));
  }
  function strip(a: V, b: V, w: number, color: number, parent: THREE.Object3D, glow = 0) {
    const delta=b.clone().sub(a);
    const part=mesh(new THREE.BoxGeometry(w,delta.length(),Math.max(0.004,w * 0.3)),paper(color,glow),parent,a.clone().lerp(b,0.5));
    if (delta.lengthSq()) part.quaternion.setFromUnitVectors(vec(0,1,0),delta.normalize());
    return part;
  }
  function plate(parent: THREE.Object3D, w: number, h: number, title: string, subtitle: string, palette: [string, string, string], thickness = 0.025) {
    const g = new THREE.Group();
    parent.add(g);
    box(w,h,thickness,0xcdb890,g);
    const c=document.createElement('canvas');
    c.width=1024; c.height=384;
    const ctx=c.getContext('2d');
    if (!ctx) return g;
    const [bg,ink,edge]=palette;
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle=edge;ctx.lineWidth=8;ctx.strokeRect(23,23,978,338);
    ctx.lineWidth=3;ctx.strokeRect(39,39,946,306);
    ctx.beginPath();ctx.moveTo(88,222);ctx.lineTo(936,222);ctx.stroke();
    ctx.fillStyle=ink;ctx.textAlign='center';
    ctx.font='700 76px Georgia, serif';ctx.fillText(title,512,175,890);
    ctx.font='700 42px "Courier New", monospace';ctx.fillText(subtitle,512,288,890);
    for(const x of [60,964]) for(const y of [57,327]){ctx.beginPath();ctx.arc(x,y,6,0,2*Math.PI);ctx.fill();}
    const map=new THREE.CanvasTexture(c);
    map.colorSpace=THREE.SRGBColorSpace;
    map.anisotropy=4;
    textures.push(map);
    const inkMat=new THREE.MeshStandardMaterial({map,roughness:0.87,metalness:0,side:THREE.DoubleSide});
    const face=mesh(new THREE.PlaneGeometry(w-0.013,h-0.01),inkMat,g,vec(0,0,thickness/2+0.002));
    face.castShadow=false;
    return g;
  }
  function dispose() {
    const seenGeo=new Set<THREE.BufferGeometry>();
    const seenMat=new Set<THREE.Material>();
    root.traverse((o)=>{
      if (!(o instanceof THREE.Mesh)) return;
      seenGeo.add(o.geometry);
      for (const m of Array.isArray(o.material)?o.material:[o.material]) seenMat.add(m);
    });
    for (const g of seenGeo) g.dispose();
    for (const m of new Set([...seenMat,...materials.values()])) m.dispose();
    for (const t of textures) t.dispose();
    root.removeFromParent();
  }
  return {paper,mesh,box,strip,plate,dispose};
}

function findOriginal(world: BaseFolioWorld, x: number, z: number) {
  return world.root.children.find((o): o is THREE.Group => o instanceof THREE.Group && Math.abs(o.position.x - x) < 0.001 && Math.abs(o.position.z - z) < 0.001);
}
function smoothFold(t: number, min: number, max: number, reduced: boolean) {
  return reduced ? Number(t >= min) : smooth(min,max,t);
}

function f11Art(world: BaseFolioWorld): MechanismArt {
  const root=new THREE.Group();
  root.name='living-f11-first-dirt-revision';
  const {paper,mesh,box,strip,plate,dispose}=artKit(root);
  const y = (x: number) => Math.max(getOpenPageY(x)+0.012,getOpenPageY(0)+0.075);
  const oldMarcel=findOriginal(world,-1.38,-0.15);
  const oldCodec=findOriginal(world,1.24,-0.35);
  const oldTiger=findOriginal(world,1.42,0.25);
  const quote=findOriginal(world,0,0.96);
  // Keep actual A and B model/controls and the original C quote/lever. Hide quote until its independent control opens it.
  if (quote) quote.visible=false;
  const quoteCover=plate(root,1.48,0.33,'Attribution record','C · LIFT ARCHIVAL LEAF',['#f2e5c8','#514130','#b28755']);
  quoteCover.name='living-f11-quote-cover';
  quoteCover.rotation.x=-Math.PI/2+0.28;
  quoteCover.position.set(0,y(0)+0.08,1.03);
  quoteCover.userData={interactionType:'folioMechanism',worldId:10,slot:'C',label:'[C] Open attributed quotation leaf'};
  world.interactables.push(quoteCover);
  const caption=plate(root,2.36,0.37,'31 days after the war','NACREOUS VI · PAPER STUDY, NOT PLANET RECOVERY',['#252c26','#efe1bd','#ac9e63']);
  caption.name='living-f11-postwar-framing';
  caption.position.set(0,0.11,1.49);
  caption.rotation.x=-Math.PI/2+0.12;
  const pivots = [
    { model:oldCodec, name:'Codec',x:-1.29,z:0.32,sz:1.16,yaw:0.23 },
    { model:oldMarcel,name:'Marcel',x:0.74,z:0.38,sz:1.19,yaw:-0.17 },
    { model:oldTiger,name:'Tiger',x:1.80,z:0.56,sz:1.47,yaw:-0.55 },
  ];
  for(const r of pivots){
    if(!r.model) continue;
    r.model.name='living-f11-'+r.name.toLowerCase();
    r.model.position.set(r.x,y(r.x)+0.028,r.z);
    r.model.rotation.y=r.yaw;
    r.model.scale.setScalar(r.sz);
    r.model.visible=false;
    // Source models don't have foot tabs; these little gussets pin them to the page even while animating.
    const tab=box(0.34,0.024,0.19,r.name==='Codec'?0x793b35:r.name==='Marcel'?0x586647:0x324957,root,r.x,y(r.x)+0.011,r.z);
    tab.rotation.y=r.yaw;
    const brace=box(0.22,0.045,0.10,0x6f5f46,root,r.x,y(r.x)+0.018,r.z-0.102);
    brace.rotation.x=-0.29;
    tab.visible=false;brace.visible=false;
    tab.userData.actor=r.name;
    brace.userData.actor=r.name;
  }

  // Articulate the source silhouette. Codec and Marcel are faceless in these canonical paper models.
  function actorHead(model: THREE.Group | undefined, codec: boolean) {
    if(!model) return undefined;
    const headY=codec?0.605:0.575;
    const bits=model.children.filter(o=>o instanceof THREE.Mesh && ((Math.abs(o.position.y-headY)<0.001 && Math.abs(o.position.x)<0.001) || (Math.abs(o.position.y-(codec?0.645:0.605))<0.001 && Math.abs(o.position.x)<0.001) || (codec && Math.abs(o.position.y-0.575)<0.001 && Math.abs(o.position.x)<0.001)));
    if(!bits.length) return undefined;
    const head=new THREE.Group();
    head.position.set(0,headY,0);
    model.add(head);
    for(const p of bits) { p.position.y-=headY; head.add(p); }
    return head;
  }
  const codecHead=actorHead(oldCodec,true), marcelHead=actorHead(oldMarcel,false);
  const tigerHead=oldTiger?.children.find(o=>o instanceof THREE.Group && Math.abs(o.position.y-0.68)<0.001);
  const tigerEyes=tigerHead?.children.filter(o=>o instanceof THREE.Mesh && o.geometry.type==='BoxGeometry') ?? [];
  const celebrate=new THREE.Group();
  celebrate.name='living-f11-celebration-folds';
  root.add(celebrate);
  const cheers: Array<{g:THREE.Group;x:number;z:number; actor:1|2}>=[];
  for(const actor of [1,2] as const){
    const p=pivots[actor];
    const g=new THREE.Group();
    g.position.set(p.x,y(p.x)+0.06,p.z-0.025);
    celebrate.add(g);
    for(let i=0;i<4;i++){
      const a=(-1.5+i)*0.28;
      const x=(i<2?-1:1)*(0.29+(i%2)*0.08);
      const s=strip(vec(x,0.53,0),vec(x+a*0.13,0.73+0.03*(i%2),0),0.028,actor===1?0xe0b64f:0x81c9d3,g);
      s.rotation.y=0.1;
    }
    cheers.push({g,x:p.x,z:p.z,actor});
  }

  // A shallow cutaway with visible vellum and printed center seam. Roots travel under the transparent stock, not above actors.
  const win=new THREE.Group();
  win.name='living-f11-root-view-vellum-window';
  win.position.set(-1.85,getOpenPageY(-1.85)+0.015,1.05);
  root.add(win);
  box(1.05,0.026,0.54,0xa28863,win);
  box(0.98,0.012,0.475,0x39392b,win,0,0.021);
  const panel=plate(win,0.72,0.15,'Root view','VELLUM CUTAWAY',['#e9dfba','#493b2d','#9e8558'],0.013);
  panel.rotation.x=-Math.PI/2;
  panel.position.set(0,0.05,0.226);
  const vellumMat=new THREE.MeshPhysicalMaterial({color:0xe9e7c1,transparent:true,opacity:0.29,roughness:0.43,depthWrite:false,side:THREE.DoubleSide});
  const vellum=mesh(new THREE.PlaneGeometry(0.94,0.38),vellumMat,win,vec(0,0.059,-0.05));
  vellum.rotation.x=-Math.PI/2;
  vellum.renderOrder=3;
  vellum.castShadow=false;
  const rootStrips: Array<{pivot:THREE.Group;t:number}>=[];
  function rootVein(parent: THREE.Object3D, a: V,b: V,w:number,color:number,t:number){
    const hinge=new THREE.Group();
    hinge.position.copy(a);
    hinge.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);
    const len=Math.hypot(b.x-a.x,b.z-a.z);
    box(len,0.012,w,color,hinge,len/2,0,0);
    parent.add(hinge);
    rootStrips.push({pivot:hinge,t});
  }
  rootVein(win,vec(0.41,0.039,-0.075),vec(-0.42,0.039,-0.08),0.048,0xaaa949,0);
  for(let i=0;i<8;i++){
    const x=0.31-i*0.094, z=i%2?-0.216:0.098;
    rootVein(win,vec(x,0.04,-0.078),vec(x-0.16,0.04,z),0.025,i%2?0xa1b951:0xd6c876,0.08+i*0.055);
  }
  const center=vec(-0.22,y(0)+0.012,-0.17);
  const layout: [number,number,number,number][]=[
    [-2.10,-0.89,0.91,0],[-1.81,-1.35,1.40,1],[-1.18,-1.15,1.48,2],[-0.74,-1.48,1.66,1],
    [-0.23,-1.28,1.73,0],[0.22,-1.53,1.56,2],[0.68,-1.38,1.53,1],[1.12,-1.27,1.33,2],[1.69,-1.19,1.54,1],
    [2.08,-0.94,1.24,0],[2.24,-0.39,0.79,1],[-2.05,-0.25,0.90,2],[-1.79,0.21,0.62,0],[-1.39,-0.56,0.91,2],
    [-0.87,-0.55,0.80,0],[0.03,-0.67,0.95,1],[1.43,-0.45,0.82,2],[2.13,0.17,0.58,0],
    [-0.57,0.61,0.43,2],[0.35,0.59,0.38,0],[-1.48,0.77,0.34,1],[1.23,0.69,0.38,2]
  ];
  const canopy=new THREE.Group();
  canopy.name='living-f11-paper-jungle';
  root.add(canopy);
  const greens=[0x3b8657,0x77b95f,0x244c3a,0xa1c46f,0x328777,0x67c490,0x299061];
  const flowering=[0xf3ad52,0xe37260,0xecd36a];
  const plants: Array<{holder:THREE.Group;leaves:THREE.Group[];t:number;petal:THREE.Group;roll:number}>=[];
  for(const [i,[x,z,h,j]] of layout.entries()){
    const delay=(i*0.071+Math.hypot(x+0.22,z+0.17)*0.21)%0.86;
    // Forked veins pass under and join individual pop-up foot tabs.
    const mid=center.clone().lerp(vec(x,y(x)+0.02,z),0.55);mid.x+=Math.sin(i*1.73)*0.21;
    rootVein(root,center.clone(),mid,i%3===0?0.033:0.022,greens[0],delay*0.55);
    rootVein(root,mid,vec(x,y(x)+0.012,z),0.022,greens[1],0.16+delay*0.6);
    const tree=new THREE.Group();tree.name='living-f11-folded-plant-'+(i+1);tree.position.set(x,y(x),z);canopy.add(tree);
    const foot=box(0.13,0.023,0.11,0x69794c,tree,0,0.01,0);
    foot.rotation.y=i*0.92;
    const sway=Math.sin(i*1.8)*0.23;
    strip(vec(0,0.01,0),vec(sway,h,0),0.045+h*0.02,greens[2],tree);
    strip(vec(0.018,0.04,0.006),vec(sway+0.016,h*0.97,0.004),0.010,0xae8c52,tree);
    const leaves:THREE.Group[]=[];
    for(let k=0;k<6;k++){
      const slice=(k+1)/7,l=(0.28+0.14*(1-slice)+h*0.19)*(k===5?1.22:1);
      const fan=new THREE.Group();
      fan.position.set(sway*slice,h*slice,0);
      fan.rotation.y=i*0.79+k*2.22;
      tree.add(fan);leaves.push(fan);
      const w=l*(j===2?0.32:0.20);
      const verts=[0,0,0,l*0.43,w,0,l,w*0.27,0,l*0.46,w*0.52,0.07,l*0.50,-w*0.19,0] as const;
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
      geo.setIndex([0,1,3,1,2,3,0,3,4,3,2,4]);
      geo.computeVertexNormals();
      mesh(geo,paper(greens[(i+k+j)%greens.length]),fan);
      strip(vec(0,0,0.002),vec(l*0.46,w*0.52,0.071),0.011,greens[(i+k+1)%greens.length],fan);
    }
    const petal=new THREE.Group();petal.position.set(sway,h*0.84,0.062);tree.add(petal);
    if(i%3===0||h<0.62){
      for(let k=0;k<4;k++){
        const a=k*Math.PI/2;
        const g=mesh(new THREE.OctahedronGeometry(h>0.8?0.081:0.063),paper(flowering[j]),petal,vec(Math.cos(a)*0.073,Math.sin(a)*0.073,0.012));
        g.scale.set(0.95,0.71,0.43);g.rotation.z=a;
      }
      mesh(new THREE.OctahedronGeometry(0.038),paper(0xffdd8d),petal,vec(0,0,0.018));
    }
    tree.visible=false;
    plants.push({holder:tree,leaves,t:delay,petal,roll:sway});
  }

  const marcelEffect=new THREE.Group();
  marcelEffect.name='living-f11-marcel-gravity-wordstreaming';
  marcelEffect.position.set(0.76,y(0.76)+0.395,0.34);
  root.add(marcelEffect);
  const streams:THREE.Group[]=[];
  for(let k=0;k<2;k++){
    const strand=new THREE.Group();
    strand.rotation.set(0.49+k*0.36,0,k?0.68:-0.63);
    marcelEffect.add(strand);streams.push(strand);
    let previous=vec(0,0,0);
    for(let i=0;i<=15;i++){
      const a=-2.48+i*0.309, r=0.31+k*0.20;
      const next=vec(Math.cos(a)*r,0.025*i-0.18,Math.sin(a)*r);
      if(i) strip(previous,next,0.042,k?0x9ce4d9:0x45acba,strand,0.20);
      if(i%2===0){
        const mark=box(0.021,0.041,0.008,k?0xeff5ca:0xd6fbf6,strand,next.x,next.y+0.021,next.z+0.009);
        mark.rotation.z=a;
      }
      previous=next;
    }
  }
  const motes:THREE.Mesh[]=[];
  for(let i=0;i<10;i++){
    const m=mesh(new THREE.OctahedronGeometry(i%2===0?0.046:0.035),paper(i%2?0xcbb87d:0x7bcfd1,0.10),marcelEffect);
    motes.push(m);
  }

  const authored=createF11Challenger(y);
  root.add(authored.root);
  let time=0, idleClock=0;
  const update:MechanismArt['update']=(state,dt,reduced)=>{
    // Use mount-local timeline, independent of mutable Archive runtime, levers and hidden records.
    const step=Math.max(0,Math.min(1,dt));
    time=Math.min(10,time+step);
    idleClock=(idleClock+step)%600;
    const actorStart=[0,1.35,6.84],actorEnd=[0.65,2.03,7.59];
    const sadP=smoothFold(time,7.22,8.02,reduced);
    const calm=smooth(5.61,6.35,time);
    root.userData.phase=time<1.35?'codec':time<2.65?'marcel':time<5.58?'jungle-growing':time<6.84?'jungle-hold':time<7.22?'tiger-arrival':'emotional-split';
    root.userData.elapsed=time;
    root.userData.codecSad=sadP>=0.5;
    root.userData.rootWindowFilled=time>=4.04;
    root.userData.allPlantsUnfolded=time>=5.58;
    if(quote) quote.visible=state.interactions.C.active;
    quoteCover.visible=!state.interactions.C.active;
    authored.update(dt,reduced);
    root.userData.blenderState=authored.root.userData.assetState;
    if(authored.root.userData.assetState==='loading'){
      root.userData.phase='barren';
      for(const v of [win,canopy,celebrate,marcelEffect,...rootStrips.map(r=>r.pivot)])v.visible=false;
      return;
    }
    if(authored.root.userData.assetState==='ready'){
      const actual=authored.root.userData;
      root.userData.phase=actual.phase;
      root.userData.authoredFrame=actual.frame;
      root.userData.f11Story=actual.story;
      root.userData.codecSad=actual.codecSad;
      root.userData.rootWindowFilled=Number(actual.frame)>=63;
      root.userData.allPlantsUnfolded=actual.mature;
      for(const p of pivots)if(p.model)p.model.visible=false;
      for(const c of root.children)if(c.userData.actor)c.visible=false;
      for(const v of [win,canopy,celebrate,marcelEffect,...rootStrips.map(r=>r.pivot)])v.visible=false;
      return;
    }
    win.visible=true;canopy.visible=true;celebrate.visible=true;
    for(const [i,p] of pivots.entries()){
      const inP=smoothFold(time,actorStart[i],actorEnd[i],reduced);
      const g=p.model;
      if(!g) continue;
      g.visible=i===0||time>=actorStart[i];
      const anim=reduced?0:Math.sin(idleClock*(i===0?3.5:4.2)+i);
      const mood=i===0?1-sadP:1;
      const bounce=(reduced?0:Math.abs(anim)*0.042*mood)*inP;
      g.position.set(p.x,y(p.x)+0.026+bounce,p.z);
      g.scale.setScalar(p.sz);
      g.rotation.set((1-inP)*(-1.40)+(i===0?0.14*sadP:anim*0.03*inP),p.yaw+(i===0?-0.45*sadP:0),anim*0.036*mood*inP);
      for(const item of root.children) if(item.userData.actor===p.name) item.visible=g.visible;
    }
    const blink=(offset:number)=>reduced?1:Math.max(0.17, smooth(0.022,0.095,Math.abs(((idleClock+offset)%3.19)-1.53)));
    if(codecHead)codecHead.rotation.set(sadP*0.55,-sadP*0.40,0.12*sadP);
    if(marcelHead)marcelHead.rotation.x=reduced?-0.08:-0.08+Math.sin(idleClock*2.8)*0.08;
    if(tigerHead){tigerHead.rotation.x=reduced?-0.07:-0.15+Math.sin(idleClock*2.7)*0.095;}
    for(const l of tigerEyes) l.scale.y=blink(1.98);
    for(const p of cheers){
      const inP=smoothFold(time,p.actor===1?2.02:7.66,p.actor===1?2.39:8.19,reduced);
      p.g.visible=inP>0;
      p.g.scale.setScalar(0.005+inP*(0.93+(reduced?0:0.10*Math.sin(idleClock*3.3+p.actor))));
    }
    for (const r of rootStrips) {
      const amount=smoothFold(time,2.63+r.t,3.24+r.t,reduced);
      r.pivot.visible=amount>0;
      r.pivot.scale.x=Math.max(0.001,amount);
    }
    for (const p of plants){
      const up=smoothFold(time,3.12+p.t,4.46+p.t,reduced);
      p.holder.visible=up>0;
      p.holder.scale.set(0.80+0.2*up,Math.max(0.001,up),0.75+0.25*up);
      p.holder.rotation.z=reduced?0:Math.sin(idleClock*1.9+p.t*5)*0.029*up*(1-0.65*calm);
      for(let k=0;k<p.leaves.length;k++){
        const f=smoothFold(time,3.40+p.t+k*0.045,4.35+p.t+k*0.045,reduced);
        p.leaves[k].rotation.z=(1-f)*1.44;
        p.leaves[k].scale.set(0.20+0.8*f,0.2+0.8*f,1);
      }
      const blossom=smoothFold(time,4.31+p.t,4.79+p.t,reduced);
      p.petal.visible=blossom>0;p.petal.scale.setScalar(Math.max(0.001,blossom));
    }
    const effect=smoothFold(time,1.36,1.94,reduced);
    marcelEffect.visible=effect>0;
    marcelEffect.scale.setScalar(Math.max(0.001,effect));
    for(const [i,s] of streams.entries()) s.rotation.y=reduced?i*0.4:idleClock*(i?-.50:0.64)+i*0.4;
    for(const [i,m] of motes.entries()){
      const a=i*Math.PI*2/motes.length+(reduced?0:idleClock*1.8),pull=reduced?0.47:Math.max(0.25,0.9-0.45*effect-0.17*Math.sin(idleClock*1.6+i*0.61));
      m.position.set(Math.cos(a)*pull,0.065+Math.sin(a*2)*0.18,Math.sin(a)*pull);
      if(!reduced) m.rotation.y=idleClock*(0.9+i*0.07);
    }
  };
  return {root,update,dispose:()=>{
    const at=world.interactables.indexOf(quoteCover);if(at>=0)world.interactables.splice(at,1);
    authored.dispose();
    dispose();
  }};
}

function f12Art(world: BaseFolioWorld): MechanismArt {
  const root=new THREE.Group();
  root.name='living-f12-institutional-role-cycle';
  const {paper,mesh,box,strip,plate,dispose}=artKit(root);
  const old=findOriginal(world,0,0.94);
  if(old) old.visible=false; // Original archive's figure/card never appears in Living F12.
  const muted:[string,string,string]=['#e9dec1','#292720','#a27849'];
  const dusk:[string,string,string]=['#2a313b','#f5ead4','#b49b61'];
  const vermilion:[string,string,string]=['#6b302d','#ffecd5','#d5b286'];
  const recruitment=new THREE.Group();recruitment.name='living-f12-recruitment-mechanism';root.add(recruitment);
  const roof=plate(recruitment,1.80,0.29,'The Administration Calls','POSTWAR RECRUITMENT EXHIBIT',dusk);
  roof.position.set(0,1.13,-1.13);
  const rollers=new THREE.Group();rollers.position.set(0,0.65,-1.10);recruitment.add(rollers);
  const axle=box(1.84,0.044,0.052,0x78613d,rollers,0,-0.19,-0.015);
  axle.rotation.z=0.003;
  for(const s of [-1,1]){
    const support=box(0.046,0.68,0.11,0x74674e,recruitment,s*0.89,0.34,-1.20);
    support.rotation.x=-0.17;
    box(0.24,0.026,0.29,0x9f8558,recruitment,s*0.89,getOpenPageY(s*0.89)+0.019,-1.20);
  }
  const roles = [
    ['Rebuilders','REPAIR & CIVIC WORKS'],
    ['Surveyors','MAP & REASSESS'],
    ['Relief Crews','SUPPLY & RECOVERY'],
    ['Record Keepers','PRESERVE & FILE'],
  ] as const;
  const pages=roles.map(([title,sub],i)=>{
    const g=plate(rollers,1.57,0.60,title,sub,i%2===0?muted:dusk);
    g.name='living-f12-role-'+i;
    const prop=new THREE.Group();prop.position.set(-0.90,0.015,0.06);g.add(prop);
    if(i===0){
      const left=box(0.072,0.26,0.05,0xbb955d,prop,-0.08,-0.01,0);
      left.rotation.z=-0.15;
      const right=box(0.072,0.26,0.05,0xbb955d,prop,0.08,-0.01,0);
      right.rotation.z=0.15;
      box(0.27,0.07,0.05,0x7c4439,prop,0,0.122,0.006);
    }else if(i===1){
      box(0.13,0.11,0.09,0x4c7d82,prop,0,0.11);
      strip(vec(0,0.055,0.02),vec(-0.105,-0.15,0.025),0.026,0xbb955d,prop);
      strip(vec(0,0.055,0.02),vec(0.10,-0.15,0.025),0.026,0xbb955d,prop);
      mesh(new THREE.CylinderGeometry(0.045,0.045,0.035,10),paper(0x92aeb0),prop,vec(0,0.11,0.063)).rotation.x=Math.PI/2;
    }else if(i===2){
      box(0.21,0.19,0.10,0xa97954,prop);
      box(0.031,0.19,0.008,0xf7dcad,prop,0,0,0.054);
      box(0.17,0.028,0.008,0xf7dcad,prop,0,0,0.057);
    }else{
      for (const s of [-1,1]){
        const p=box(0.10,0.19,0.023,0xdcc38f,prop,s*0.055,0,0);
        p.rotation.y=-s*0.26;
        for(let k=0;k<3;k++)box(0.063,0.005,0.008,0x806448,p,0,0.054-k*0.04,0.016);
      }
    }
    g.visible=i===0;
    return g;
  });
  const leaf=new THREE.Group();
  leaf.name='living-f12-final-archive-leaf';
  const leafX=0.02,leafZ=1.02;
  leaf.position.set(leafX,getOpenPageY(leafX)+0.065,leafZ);
  leaf.userData={interactionType:'folioMechanism',worldId:11,slot:'C',label:'[C] Unseal the final archival leaf'};
  world.interactables.push(leaf);root.add(leaf);
  const archiveInset=plate(leaf,1.73,0.43,'Syrin 4','DESTRUCTION RECORDED · TOTALS UNRECORDED',muted);
  archiveInset.rotation.x=-Math.PI/2+0.23;
  const hinge=new THREE.Group();hinge.position.set(0,0.082,-0.21);leaf.add(hinge);
  const cover=plate(hinge,1.75,0.45,'Final archival leaf','C · UNSEAL RECORD',dusk);
  cover.rotation.x=-Math.PI/2+0.23;
  cover.position.set(0,0,0.21);
  const localSeal=mesh(new THREE.CylinderGeometry(0.068,0.068,0.017,12),paper(0x8b4439),hinge,vec(0,0.024,0.37));
  localSeal.rotation.z=0.07;

  const stamp=new THREE.Group();stamp.name='living-f12-administration-endorsement-stamp';
  stamp.position.set(2.10,getOpenPageY(2.10)+0.021,0.96);
  root.add(stamp);
  const base=box(0.73,0.036,0.49,0x6e4438,stamp,0,0.018,0);
  base.rotation.y=-0.11;
  const slip=plate(stamp,0.62,0.27,'Endorsed','ADMINISTRATION',vermilion,0.021);
  slip.rotation.set(-Math.PI/2+0.07,0,-0.11);
  slip.position.set(0,0.069,0.07);
  const stampBacking=box(0.68,0.030,0.45,0xa18962,stamp,0,0.037,-0.018);
  stampBacking.rotation.y=-0.11;
  const arm=new THREE.Group();arm.position.set(0,0.072,-0.16);stamp.add(arm);
  const strut=box(0.09,0.27,0.04,0xc6a26d,arm,0,0.12,0.04);strut.rotation.x=0.25;
  const stampHead=mesh(new THREE.CylinderGeometry(0.162,0.17,0.044,18),paper(0x9b6746),arm,vec(0,0.25,0.07));
  stampHead.rotation.x=Math.PI*0.25;
  const grip=mesh(new THREE.CylinderGeometry(0.052,0.037,0.08,10),paper(0x4f3d31),arm,vec(0,0.31,0.10));
  grip.rotation.x=Math.PI*0.25;
  const sign=new THREE.Group();sign.position.set(0,0.078,0.15);stamp.add(sign);
  const seal=mesh(new THREE.CylinderGeometry(0.091,0.094,0.012,16),paper(0xb87c5b),sign);
  seal.castShadow=false;
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    strip(vec(Math.cos(a)*0.027,0.008,Math.sin(a)*0.027),vec(Math.cos(a)*0.064,0.008,Math.sin(a)*0.064),0.009,0x65352e,sign);
  }

  // A built city in dusk paper stock, not another printed recruiting card.
  // Separate foundations are physical geometry: no piece traverses the cut.
  const city=new THREE.Group();city.name='living-f12-unfinished-city';city.visible=false;root.add(city);
  const containment=new THREE.Group(), harm=new THREE.Group();
  containment.name='living-f12-containment-foundation';
  harm.name='living-f12-unended-harm-foundation';city.add(containment,harm);
  const footings=[containment,harm] as const;
  const cityCenters=[-1.47,1.47] as const;
  for(const [i,group] of footings.entries()){
    group.position.set(cityCenters[i],.335,-1.88);
    const platform=box(2.38,.082,.80,i===0?0x8f7863:0x675965,group);
    platform.userData.slot='A';
    box(2.42,.030,.82,0x352f3c,group,0,-.052,0);
    // Each road stops at its own cut edge; neither sidewalks nor tool rails cross.
    const lane=box(2.23,.017,.255,i===0?0xb8a383:0x977c76,group,0,.050,.27);
    lane.userData.slot='A';
    for(let d=0;d<5;d++)box(.161,.009,.032,0xe0c89a,group,-.82+d*.41,.061,.27);
    for(let j=0;j<3;j++){
      const x=-.88+j*.81,h=(i===0?[.49,.72,.41]:[.67,.38,.87])[j];
      const shell=box(.51,h,.22,i===0?0x5e4b57:0x594755,group,x,h/2+.055,-.22);
      shell.userData.slot='A';
      for(let q=0;q<2;q++)for(let l=0;l<Math.floor(h/.14);l++){
        const pane=mesh(new THREE.PlaneGeometry(.063,.057),paper(i===0?0xeeaf69:0xcea9b1,.40),group,
          vec(x-.12+q*.22,.140+l*.122,-.104));
        pane.castShadow=false;pane.userData.slot='A';
      }
      // An exposed upright + broken lintel, without a finished roof plane.
      const mast=box(.047,.18,.075,0xaf8a77,group,x-.17,h+.12,-.19);
      mast.userData.slot='A';
      const incomplete=box(.20,.038,.068,0x997565,group,x-.09,h+.20,-.19);
      incomplete.userData.slot='A';
    }
    const edge=box(.025,.15,.79,0xf0c285,group,i===0?1.17:-1.17,.014,0);
    edge.userData.slot='A';
  }
  const cityHitMeshes:THREE.Mesh[]=[];
  city.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.slot==='A')cityHitMeshes.push(o);});
  city.userData.interactables=cityHitMeshes;

  // The selected Blender horizon already carries the setting sun.
  // An architectural facing around, never inside, the existing GLB dossier.
  // Its own untouched hinge and public record stay the only C surface/content.
  const recess=new THREE.Group();recess.name='living-f12-public-archive-recess';city.add(recess);
  for(const x of [.52,3.53]){
    box(.10,.20,3.02,0x6e5960,recess,x,.36,.42);
    box(.035,.023,2.99,0xc39f79,recess,x,.477,.42);
  }
  const facade=new THREE.Group();facade.position.set(3.75,.34,.10);city.add(facade);
  box(.62,.79,.16,0x715052,facade,0,.40,0);
  box(.56,.065,.22,0x9a7468,facade,0,.83,.02);
  box(.37,.33,.034,0xbe8b75,facade,0,.52,.102);
  const facadeMark=mesh(new THREE.CircleGeometry(.105,18),paper(0x9e423c,.14),facade,vec(0,.52,.122));
  facadeMark.visible=false;facadeMark.name='living-f12-facade-stamp-impression';

  // The existing endorsement arm acts on real bent slips running between
  // two desk rails and a visible roller. The strained sheet retains its
  // scored line and pressed seal as a small bounded tray of earlier slips.
  const feedRig=new THREE.Group();feedRig.name='living-f12-coupled-paper-feed';feedRig.position.set(3.75,.365,.70);city.add(feedRig);
  for(const side of [-1,1]){
    const rail=box(.036,.080,.86,0x73635a,feedRig,side*.30,.05,.36);
    rail.rotation.x=.15;
    box(.022,.018,.82,0xb79871,feedRig,side*.28,.094,.36).rotation.x=.15;
    strip(vec(side*.28,.085,.21),vec(side*.28,.31,-.45),.031,0x94796a,feedRig);
  }
  const roller=new THREE.Group();roller.position.set(0,.14,.63);feedRig.add(roller);
  const rollerAxle=mesh(new THREE.CylinderGeometry(.045,.045,.56,12),paper(0x8f7260),roller);
  rollerAxle.rotation.z=Math.PI/2;
  for(let j=0;j<5;j++)box(.49,.013,.013,0xbca586,roller,0,.031*Math.cos(j*1.26),.031*Math.sin(j*1.26));
  const movingSlip=new THREE.Group();movingSlip.name='F12 actual cutting, bending and marked recruitment slip';feedRig.add(movingSlip);
  box(.40,.014,.48,0xe1c9a0,movingSlip);
  for(let j=0;j<3;j++)box(.23-.042*j,.003,.009,0x918064,movingSlip,-.034,.009,.117-j*.068);
  const scoredTip=new THREE.Group();scoredTip.position.z=-.23;movingSlip.add(scoredTip);
  box(.399,.012,.18,0xd5ba8b,scoredTip,0,0,-.084);
  box(.39,.003,.012,0x9f8362,scoredTip,0,.008,.009);
  const slipSeal=mesh(new THREE.CircleGeometry(.074,14),paper(0x9e443f,.83),movingSlip,vec(.09,.010,-.109));
  slipSeal.rotation.x=-Math.PI/2;
  const tray=new THREE.Group();tray.position.set(-.62,.015,.24);feedRig.add(tray);
  box(.48,.04,.61,0x705750,tray);
  const residues=Array.from({length:4},(_,i)=>{
    const p=new THREE.Group();p.position.set(-.018+i*.018,.031+i*.013,-.047+i*.022);p.rotation.y=-.15+i*.10;tray.add(p);
    box(.34,.010,.42,i%2?0xc9ad83:0xdfc49b,p);
    box(.33,.004,.013,0xa08361,p,0,.006,-.097);
    const curl=box(.33,.011,.105,0xc6a984,p,0,.011,-.228);curl.rotation.x=.15;
    const mark=mesh(new THREE.CircleGeometry(.058,12),paper(0x884540,.87),p,vec(.066,.008,-.054));mark.rotation.x=-Math.PI/2;
    p.visible=false;return p;
  });
  const stations=new THREE.Group();stations.name='living-f12-four-occupied-recruitment-stations';
  // Keep the entire recruitment installation behind the two lower authored
  // A claim slips. Their exact GLB contact surfaces and titles remain clear.
  stations.position.set(-2.30,.35,-1.21);city.add(stations);
  const procession=new THREE.Group();procession.name='F12 · original Administration role-figure procession';stations.add(procession);
  const boothScale=.55;
  const laneMarks=[-1.32,-.44,.44,1.32];
  const portraits=[-1.03,-.343,.343,1.03];
  const finalZ=1.28, sole=.079;
  const platform=box(2.78,.041,.57,0x674956,procession,0,sole-.0205,finalZ);
  platform.name='F12 · paper portrait plinth physically contiguous with the four stations';
  for(const x of [-1.38,1.38])box(.019,.018,.56,0xb28d63,procession,x,sole-.01,finalZ);
  box(2.78,.014,.018,0xd3a471,procession,0,sole-.005,finalZ+.285);
  const portraitRail=new THREE.Group();portraitRail.name='F12 · portrait paper frame seats with stamp contact';
  portraitRail.position.set(0,.052,finalZ-.26);procession.add(portraitRail);
  const crest=box(2.49,.039,.035,0xca9365,portraitRail,0,.494,0);
  crest.rotation.y=.006;
  for(const x of [-1.235,1.235]){
    box(.035,.53,.041,0xa9766a,portraitRail,x,.253,0);
    box(.12,.055,.14,0x654554,procession,x,.060,finalZ-.26);
  }
  const pressedBorder=paper(0xfab978,.36);
  const pressAccents=[-.95,.95].map(x=>mesh(new THREE.BoxGeometry(.26,.026,.010),pressedBorder,portraitRail,vec(x,.492,.022)));
  const lines=laneMarks.map((x,i)=>{
    const base=box(.205,.028,.89,0x786858,procession,(x+portraits[i])*.5,.039,.70);
    base.rotation.y=Math.atan2(portraits[i]-x,.89);base.name='F12 · scored walk from role desk to portrait';
    for(let n=0;n<3;n++)box(.138,.006,.012,0xb49c76,procession,x+(portraits[i]-x)*n*.23,.056,.44+n*.25);
    return box(.16,.010,.024,0xd09a77,procession,portraits[i],sole+.005,finalZ+.14);
  });
  const roleLegs:{boot:THREE.Mesh;leg:THREE.Mesh}[][]=[];
  const roleFigures:{body:THREE.Group;head:THREE.Group;arm:THREE.Group}[]=[];
  const roleTitles:THREE.Group[]=[];
  const rolePalette=[0x86665d,0x587679,0x8e7157,0x79677d];
  roles.forEach(([name],i)=>{
    const g=new THREE.Group();g.name='living-f12-lit-station-'+i;
    g.position.x=laneMarks[i]+.13;g.scale.setScalar(boothScale);stations.add(g);
    const light=[0xe3a16d,0x86babd,0xe4b56d,0xc7a4c9][i];
    box(1.53,.09,.90,0x614957,g,0,.025,.03);
    box(1.39,.85,.062,0x5c4d5f,g,0,.51,-.35);
    const screen=mesh(new THREE.PlaneGeometry(1.22,.72),paper(light,.43),g,vec(0,.53,-.309));
    screen.castShadow=false;screen.receiveShadow=false;
    // Move the actual anonymous role silhouette, not a second mascot or
    // frozen duplicate. The original torso, head and work sleeve are reused.
    const body=new THREE.Group();body.name='F12 · '+name+' walks to the official portrait';
    body.scale.setScalar(.78);procession.add(body);
    mesh(new THREE.CylinderGeometry(.118,.151,.34,7),paper(0x372d39),body,vec(0,.14,0));
    box(.157,.089,.045,rolePalette[i],body,0,.15,.095);
    body.rotation.z=i===1?-.20:i===0?.17:0;
    const head=new THREE.Group();head.position.set(0,.40,.005);body.add(head);
    mesh(new THREE.SphereGeometry(.095,8,5),paper(0x382c39),head);
    const sleeve=new THREE.Group();sleeve.position.set(.05,.26,.078);body.add(sleeve);
    const e=i===0?vec(.43,.22,.032):vec(.54,-.08,.062);
    const ePaper=e.multiplyScalar(.41);
    strip(vec(0,0,0),ePaper,.085,rolePalette[i],sleeve);
    const palm=box(.047,.045,.048,0x9b745c,sleeve,ePaper.x,ePaper.y,ePaper.z);
    palm.name='F12 · plain cut-stock hand, no facial additions';
    roleFigures.push({body,head,arm:sleeve});
    roleLegs.push([-1,1].map(()=>{
      const leg=box(.058,1,.036,0x4a3946,procession);
      const boot=box(.064,.020,.103,0x453440,procession);
      return {boot,leg};
    }));
    if(i===0){
      // Unfinished workbench lintel being set.
      box(.61,.07,.10,0x523742,g,.35,.62,.024);
      box(.07,.49,.10,0x523742,g,.57,.36,.024);
      box(.31,.07,.072,0x903f48,g,.22,.74,.04).rotation.z=.24;
    }else if(i===1){
      // A survey head on three legs.
      for(const [dx,dz] of [[-.15,.10],[.16,.09],[.02,-.09]]){
        strip(vec(.35,.477,.04),vec(.35+dx,.09,.04+dz),.030,0x524251,g);
      }
      box(.31,.134,.15,0x3b5968,g,.355,.52,.063).rotation.z=.14;
    }else if(i===2){
      // Stacked supplies at the relief counter.
      for(const [x,y] of [[.10,.17],[.43,.17],[.29,.35]]){
        box(.27,.17,.20,0x69464a,g,x,y,.08);
        box(.027,.174,.009,0xe8c7a3,g,x,y,.187);
        box(.11,.028,.012,0xe8c7a3,g,x,y,.190);
      }
    }else{
      // Several folded files in a distinct stepped rack.
      for(let j=0;j<3;j++){
        box(.11,.32,.20,0x6f535e,g,.2+j*.14,.25,.07).rotation.z=-.10;
        box(.07,.02,.008,0xe8c7a3,g,.2+j*.14,.34,.177);
      }
      box(.60,.064,.26,0x4f3b4f,g,.31,.096,.07);
    }
    const title=plate(stations,1.40,.274,name,'POSTWAR RECRUITMENT',dusk,.014);
    title.position.set(0,.735,-.29);
    title.visible=i===0;roleTitles.push(title);
  });
  let mountedEnvironment=false;
  const stampPivot=arm.position.clone();
  root.userData.mountF12Environment=()=>{
    mountedEnvironment=true;city.visible=true;recruitment.visible=false;leaf.visible=false;
    // Native loading can take longer than the first beat. Never mount
    // midway through the entrance or skip the station work on first viewing.
    cyclePosition=folioMotion=0;previousRoleTick=undefined;printed=0;
    // Remount the same press, towards the upright insert at z=0.22.
    stamp.position.set(3.75,.35,.535);stamp.scale.setScalar(.92);
    sign.visible=false;slip.visible=false;
  };
  root.userData.f12CityHitMeshes=cityHitMeshes;
  root.userData.sampleF12NativeClaims=(distance:number)=>{
    const shift=.5*Math.max(0,distance-1.57);
    containment.position.x=cityCenters[0]-shift;
    harm.position.x=cityCenters[1]+shift;
    root.userData.cityGap=harm.position.x-containment.position.x-2.42;
  };
  let cyclePosition=0, folioMotion=0, sealFlap=0, previousRoleTick:number|undefined, printed=0;
  const update:MechanismArt['update']=(state,dt,reduced)=>{
    const step=Math.max(0,Math.min(dt,1));
    const now=performance.now();
    let roleDelta=previousRoleTick===undefined||step===0||document.hidden?0:Math.min(.55,(now-previousRoleTick)/1000);
    previousRoleTick=now;
    // The reading dwell is clock time, not a frame count. This also keeps
    // the role plates readable when the paper theatre is costly to render.
    const dwell=reduced?5.5:mountedEnvironment?F12_PORTRAIT_DWELL:4.4;
    if(mountedEnvironment&&!reduced){
      const seconds=(cyclePosition%1)*dwell;
      roleDelta=f12ProcessionStep(seconds,roleDelta);
      if(seconds>=F12_FEED_START)roleDelta=paperFeedStep(f12FeedTime(seconds),roleDelta);
    }
    folioMotion+=roleDelta;
    cyclePosition=(cyclePosition+roleDelta/dwell)%roles.length;
    const idx=Math.floor(cyclePosition);
    const cyc=(cyclePosition-idx)*dwell;
    const turn=idx!==0||folioMotion>=dwell;
    const pop=reduced||!turn?1:smooth(0,0.38,cyc);
    // One readable role at a time; no mixed text and no flashy motion in reduced mode.
    for(const [i,p] of pages.entries()){
      p.visible=i===idx;
      p.rotation.x=(1-pop)*-1.17+0.09;
      p.position.y=(1-pop)*-0.10;
    }
    const strike=reduced?0:Math.sin(Math.PI*unit((cyc-0.19)/0.46))**2;
    arm.rotation.x=reduced?0.33+Number(state.interactions.C.active)*0.28:0.22+strike*1.23;
    stampBacking.position.y=0.038-0.010*strike;
    sign.visible=reduced||cyc>0.37||folioMotion<dwell;
    sealFlap=reduced?Number(state.interactions.C.active):THREE.MathUtils.lerp(sealFlap,Number(state.interactions.C.active),1-Math.exp(-8*step));
    hinge.rotation.x=-1.28*sealFlap;
    if(mountedEnvironment){
      for(const [i,role] of roleTitles.entries())role.visible=i===idx;
      const feed=paperFeedMotion(f12FeedTime(cyc),reduced);
      const cue=f12PortraitPose(cyc,reduced);
      portraitRail.rotation.x=cue.grouped?-.026*feed.press:-.46*(1-smooth(1.26,2.52,cyc))+.28*smooth(5.12,5.66,cyc);
      for(const accent of pressAccents)accent.visible=feed.marked;
      const stepsDashboard=[] as {x:number;z:number;glance:number;feet:number[]}[];
      for(const [i,costume] of roleFigures.entries()){
        const {move,miss,give,glance,returning}=cue.actors[i];
        const towardMark=()=>laneMarks[i]+(portraits[i]-laneMarks[i])*move;
        const x=towardMark()-give*.17+miss*.18,z=-.04+(finalZ+.04)*move+miss*.20;
        const floor=(z:number)=>.051+smooth(.85,1.07,z)*(sole-.051);
        const idleTime=reduced?0:folioMotion*[1.87,1.34,1.58,2.36][i];
        const land=move<=.0001||move>=.9999;
        // Only the leading toe lifts; each supported foot stays on its cut
        // mark. Retain the old job gestures until the character leaves it.
        const swing=land?0:Math.sin(move*Math.PI*8);
        costume.body.position.set(x,floor(z)+.108+Math.abs(swing)*.015,z);
        costume.body.rotation.set(-.028*Math.abs(swing),returning?Math.PI*(1-smooth(5.97,F12_PORTRAIT_DWELL,cyc)):
          [-.19,.15,-.18,.14][i]*(1-move)+glance*(i===2?.47:-.61),reduced?0:.045*swing+.062*miss-.04*give);
        costume.head.rotation.y=glance*(i===2?.33:-.29);
        costume.head.rotation.x=reduced?0:.050*Math.sin(idleTime*.71+.6*i)*(1-move)-.13*glance;
        costume.arm.rotation.x=swing*.25;
        costume.arm.rotation.z=reduced?-.86:(1-move)*Math.sin(idleTime+.6)*[.18,.08,.11,.14][i]
          -move*.86+glance*(i===2?.74:-.36);
        const footLifts:number[]=[];
        roleLegs[i].forEach(({boot,leg},j)=>{
          const offset=(j-.5)*.143;
          const [advance,raise]=paperFoot(returning?1-move:move,4,j as 0|1);
          const footprint=returning?1-advance:advance;
          // The small correction is two alternating sidesteps as well. The
          // out-of-line figure cannot drift both shoes sideways at once.
          const delay=j===1?.08:0;
          const keepGap=reduced||i!==2?0:smooth(1.66+delay,1.92+delay,cyc)*(1-smooth(2.26+delay,2.43+delay,cyc));
          const stillLate=reduced||i!==3?0:smooth(1.11+delay,1.37+delay,cyc)*(1-smooth(2.12+delay,2.33+delay,cyc));
          const laterFootX=laneMarks[i]+(portraits[i]-laneMarks[i])*footprint+offset-keepGap*.17+stillLate*.18;
          const laterFootZ=-.04+(finalZ+.04)*footprint+stillLate*.20;
          const correction=i===2?Math.abs(keepGap-give):i===3?Math.abs(stillLate-miss):0;
          const lift=raise*.046+correction*.066;
          const bottom=vec(laterFootX,floor(laterFootZ)+.019+lift,laterFootZ);
          const knee=vec(x+offset*.92,costume.body.position.y+.030,z);
          boot.position.copy(bottom);boot.position.y-=.01;
          boot.rotation.y=costume.body.rotation.y;
          leg.position.copy(bottom).lerp(knee,.5);
          const axis=knee.clone().sub(bottom);leg.scale.y=axis.length();
          leg.quaternion.setFromUnitVectors(vec(0,1,0),axis.normalize());
          footLifts.push(Number(lift.toFixed(3)));
        });
        stepsDashboard.push({x:Number(x.toFixed(3)),z:Number(z.toFixed(3)),glance,feet:footLifts});
      }
      lines.forEach((mark,i)=>{mark.scale.x=1-.24*cue.actors[i].miss;});
      const ord=Math.floor(folioMotion/dwell);
      printed=Math.max(printed,Math.min(4,ord+Number(feed.stage==='residue'||reduced)));
      for(const [i,residue] of residues.entries())residue.visible=i<printed;
      roller.rotation.x=(feed.feed+.31*feed.eject)*-6.2;
      movingSlip.position.set(-.58*feed.eject,.105+.30*feed.feed-.35*feed.eject,.61-1.08*feed.feed+.64*feed.eject);
      movingSlip.rotation.x=.10+1.36*feed.feed-1.38*feed.eject;
      movingSlip.rotation.z=.12*feed.eject;
      scoredTip.rotation.x=.07-.36*feed.grip+.15*feed.eject;
      slipSeal.visible=feed.marked;
      movingSlip.visible=reduced||feed.eject<.999;
      const figure=roleFigures[idx];
      root.userData.paperFeed={...feed,residues:printed,roller:roller.rotation.x,body:figure.body.rotation.z,
        head:figure.head.rotation.x,arm:figure.arm.rotation.z,portrait:{phase:cue.phase,grouped:cue.grouped,poses:stepsDashboard}};
      // The same transmission closes the arm only after the slip seats.
      const press=feed.press;
      arm.rotation.x=-1.16-.54*press;
      arm.position.set(stampPivot.x,stampPivot.y+.16+.28*press,stampPivot.z+.09-.004*press);
      stampHead.rotation.x=.25-.12*press;
      grip.rotation.x=.45+.12*press;
      stampBacking.position.y=.037-.005*press;
      sign.visible=false;
      facadeMark.visible=feed.marked;
      root.userData.stationIndex=idx;
      root.userData.stationCount=roles.length;
      root.userData.stampPress=press;
      root.userData.stampFaceMarked=facadeMark.visible;
      root.userData.archiveRecessVisible=recess.visible;
    }
    root.userData.role=roles[idx][0];
    root.userData.roleIndex=idx;
    root.userData.archivalLeafOpen=state.interactions.C.active;
  };
  return {root,update,dispose:()=>{
    const at=world.interactables.indexOf(leaf);if(at>=0)world.interactables.splice(at,1);
    dispose();
  }};
}

/** Living-only overrides, attached by the stage owner under world.root. Shared Archive source stays intact. */
export function createRevisionAftermathArt(index:10|11,world: BaseFolioWorld): MechanismArt {
  return index===10?f11Art(world):f12Art(world);
}
