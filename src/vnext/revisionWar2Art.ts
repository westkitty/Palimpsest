import {historicalMachineBeat} from './livingPaperBeats';
import { makeF09RuptureBed, newF09CollapsingPaperGround } from './f09EnvironmentalTheatre.ts';
import * as THREE from 'three';
import { createF07ReliefChoreography } from './f07ReliefChoreography.ts';
import { f08CueClock, f08Cue } from './f08Motion.ts';
import { newF08ThresholdResponse } from './f08ThresholdResponse.ts';
import { createF08HookshotTraffic } from './f08HookshotTraffic.ts';
import type { FolioRuntimeState } from '../types/atlas';
import type { BaseFolioWorld } from '../engine/folios/BaseFolioWorld';
import { getOpenPageY as pageY } from '../engine/BookAndDeskRig';
import { buildMarcelFigure } from '../engine/drakken/CharacterFigures';
import { buildDraxisModel } from '../engine/drakken/DraxisModels';
import { createF10Challenger } from './challengerF10.ts';
import { createF10StoryPaper } from './f10StoryPaper.ts';
import { bindDraxisFigurePerformance } from './draxisFigurePerformance.ts';
import { F10FolioWorld } from '../engine/folios/FoliosAftermath';

type RevisionArt = {
  root: THREE.Group;
  update(state: FolioRuntimeState, dt: number, reduced: boolean): void;
  dispose(): void;
};
type UpdateArt = RevisionArt['update'];
const clamp = (x: number) => THREE.MathUtils.clamp(x, 0, 1);
const ease = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);
const toward = (from: number, to: number, dt: number, speed = 7) =>
  THREE.MathUtils.lerp(from, to, 1 - Math.exp(-Math.max(0, dt) * speed));

function paper(color: number, bump?: THREE.Texture, roughness = .84, metalness = .03) {
  return new THREE.MeshStandardMaterial({
    color, roughness, metalness, bumpMap: bump ?? null, bumpScale: .006,
    flatShading: true, side: THREE.DoubleSide,
  });
}
function mesh(root: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material,
  x = 0, y = 0, z = 0) {
  const piece = new THREE.Mesh(geometry, material);
  piece.position.set(x, y, z);
  piece.castShadow = true;
  piece.receiveShadow = true;
  root.add(piece);
  return piece;
}
function slab(root: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material,
  x = 0, y = 0, z = 0) {
  return mesh(root, new THREE.BoxGeometry(w, h, d), material, x, y, z);
}
function arc(root: THREE.Object3D, shape: THREE.BufferGeometry, material: THREE.Material, y = 0, z = 0) {
  return mesh(root, shape, material, 0, y, z);
}
function paperBump(world: BaseFolioWorld) {
  let texture: THREE.Texture | undefined;
  world.root.traverse(object => {
    if (texture || !(object instanceof THREE.Mesh)) return;
    const material = Array.isArray(object.material) ? object.material[0] : object.material;
    if (material instanceof THREE.MeshStandardMaterial && material.bumpMap) texture = material.bumpMap;
  });
  return texture;
}
function disposeArt(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    if (Array.isArray(object.material)) object.material.forEach(m => materials.add(m));
    else materials.add(object.material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  // Maps are shared with the existing scene or the DRAXIS model library.
  root.removeFromParent();
}

/** Re-seat the unchanged functional portal and Marcel inside the Blender paper theatre. */
export function mountF08FunctionalTheatre(root:THREE.Group):void{
  const gate=root.getObjectByName('F08 · circular Hookshot portal');
  const collar=root.getObjectByName('F08 · Hookshot registration collar');
  const marcel=root.getObjectByName('F08 · Marcel');
  const shoes=root.getObjectByName('F08 · Marcel paper foot anchors');
  if(!gate||!collar||!marcel||!shoes)throw new Error('F08 functional portal assembly is incomplete');
  gate.position.set(-1.66,.965,-.287);gate.scale.setScalar(1.14);
  // Shoulder-height aperture fits the original left theatrical cut; collar still leads into it.
  collar.position.set(-.47,.285,-.27);collar.rotation.y=.31;
  for(const n of [marcel,shoes])n.position.z=1.46;
  root.userData.f08NativeThreshold=true;
}

function aureal(root: THREE.Group, bump: THREE.Texture | undefined): UpdateArt {
  const ink = paper(0x1b2432,bump), brass = paper(0xbe985c,bump,.50,.21);
  const innerPaper = paper(0x37647a,bump), pearl = paper(0x8bd4d4,bump,.68);
  const gate = new THREE.Group();
  gate.name='F08 · circular Hookshot portal'; gate.position.set(-.35,pageY(-.35)+.58,-.54);
  root.add(gate);
  arc(gate,new THREE.CircleGeometry(.47,48),new THREE.MeshBasicMaterial({color:0x131d2c}),0,-.036).castShadow=false;
  arc(gate,new THREE.TorusGeometry(.498,.060,8,42),ink);
  arc(gate,new THREE.TorusGeometry(.474,.023,6,42),brass,0,.036);
  arc(gate,new THREE.TorusGeometry(.447,.010,5,42),innerPaper,0,.05);
  for (let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const register=slab(gate,i%3===0?.085:.048,.023,.019,i%3===0?pearl:brass,.508*Math.cos(a),.508*Math.sin(a),.055);
    register.rotation.z=a;
  }
  for (const sign of [-1,1]){
    const foot=slab(gate,.14,.15,.25,ink,sign*.38,-.50,-.024);foot.rotation.z=sign*.33;
    slab(gate,.18,.035,.36,brass,sign*.41,-.57,.007);
  }

  const plasmaMaterial=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uEnergy:{value:0},uImpulse:{value:0}},
    vertexShader:`
      varying vec2 p;
      void main(){
        p=uv*2.0-1.0;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }
    `,
    fragmentShader:`
      varying vec2 p;
      uniform float uTime;
      uniform float uEnergy;
      uniform float uImpulse;
      void main(){
        float r=length(p), a=atan(p.y,p.x);
        float swirl=sin(a*3.0-r*14.0+uTime*1.75);
        float curl=sin(a*7.0+r*20.0-uTime*1.0+swirl*1.4);
        float seam=pow(max(0.0,0.55+0.30*swirl+0.30*curl),3.0);
        float sheath=exp(-50.0*abs(r-0.90));
        float corona=smoothstep(.15,.90,r);
        vec3 base=mix(vec3(.01,.05,.11),vec3(.13,.70,.79),clamp(seam*.75+corona*.35,0.,1.));
        vec3 surge=vec3(.37,.88,1.)*min(1.0,sheath*(.48+.36*swirl)+seam*.37);
        vec3 body=base*.87+surge*(.63+uImpulse*.38);
        gl_FragColor=vec4(body,uEnergy*(1.0-smoothstep(.974,1.0,r)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent:true, depthWrite:false, side:THREE.DoubleSide,
  });
  const plasma=arc(gate,new THREE.CircleGeometry(.449,50),plasmaMaterial,0,.029);
  plasma.castShadow=plasma.receiveShadow=false;
  plasma.visible=false;

  const rimEnergy:THREE.Mesh[]=[];
  const rimMat=new THREE.MeshBasicMaterial({color:0x70dbee});
  for(let i=0;i<12;i++){
    // A small directional surge traces the already-built circle; it never
    // turns the aperture itself into another shape or affects B/C.
    const rim=arc(gate,new THREE.TorusGeometry(.459,.009,4,9,Math.PI/5.85),rimMat,0,.055);
    rim.rotation.z=-.55+i*Math.PI/6;rim.castShadow=false;rim.visible=false;rimEnergy.push(rim);
  }
  const foldSpill=new THREE.PointLight(0x72d7ff,0,3.28,2);
  foldSpill.name='F08 reflected Hookshot light on shutters and folds';foldSpill.position.set(0,.08,.39);gate.add(foldSpill);
  const marcelSpill=new THREE.PointLight(0x97cfff,0,1.65,2);
  marcelSpill.name='F08 reflected Hookshot light on Marcel';root.add(marcelSpill);

  const collar=new THREE.Group();
  collar.name='F08 · Hookshot registration collar';collar.position.set(.41,pageY(.41)+.061,-.36);root.add(collar);
  slab(collar,.34,.042,.32,ink,0,.02,.05);
  slab(collar,.29,.011,.26,brass,0,.047,.05);
  const clip=arc(collar,new THREE.TorusGeometry(.128,.021,5,16,Math.PI*1.62),innerPaper,.093,.06);
  clip.rotation.set(-.49,0,-.19);
  const leads: THREE.Mesh[]=[];
  const leadOn=new THREE.MeshBasicMaterial({color:0x8ef8f2});
  for(let i=0;i<7;i++){
    const x=.05-i*.057,y=.066+i*i*.008,z=.016-i*.025;
    const cut=slab(collar,.080,.026,.042,brass,x,y,z);cut.rotation.z=-.24-i*.11;
    const lit=slab(collar,.055,.008,.019,leadOn,x,y+.016,z+.012);lit.visible=false;
    lit.castShadow=false;leads.push(lit);
  }

  // Use the repository's authored Marcel character, not a lookalike.
  const bumpSource=bump ?? new THREE.Texture();
  const actor=buildMarcelFigure(bumpSource,1.0);
  actor.name='F08 · Marcel';actor.position.set(1.59,pageY(1.59)+.025,.38);
  root.add(actor);
  // Turn only the three original head meshes. The feet and crook remain on
  // their original marks; no facial likeness or character geometry is invented.
  const neck=new THREE.Group();neck.name='F08 · Marcel follows the carrier with the authored head';
  neck.position.set(0,.535,0);
  const headParts=actor.children.filter(o=>o.position.y>.55&&o.position.y<.63);
  actor.add(neck);
  for(const part of headParts){neck.add(part);part.position.y-=neck.position.y;}
  if(!bump) actor.userData.revisionOwnedBump=bumpSource;
  const shoes=new THREE.Group();shoes.name='F08 · Marcel paper foot anchors';
  shoes.position.set(1.59,pageY(1.59)+.012,.38);root.add(shoes);
  for(const dz of [-.075,.075])slab(shoes,.40,.018,.06,ink,0,0,dz);
  const threshold=newF08ThresholdResponse(pageY,shoes);root.add(threshold.root);
  const traffic=createF08HookshotTraffic(pageY);root.add(traffic.root);
  let t=0,cueTime=0,wasOn=false,initialized=false,follow=0;
  return (state,dt,reduced) => {
    const on = state.interactions.A.active;
    cueTime=typeof root.userData.authoredCue==='number'?root.userData.authoredCue:
      f08CueClock(cueTime,wasOn,on,dt,reduced||!initialized);
    initialized=true;wasOn=on;
    const cue=f08Cue(cueTime,on);
    t+=reduced?0:Math.min(.07,Math.max(0,dt))*(cue.impulse>.001?1.66:.32);
    root.userData.portalPower=cue.plasma;
    root.userData.portalCue=cue.phase;
    root.userData.collarPower=cue.collar;
    root.userData.rimPower=cue.rim;
    root.userData.foldLight=cue.plasma*3.3+cue.rim*.28+cue.impulse*2.5;
    const liveThreshold=root.userData.f08NativeThreshold===true;
    threshold.root.visible=liveThreshold;
    const witness=threshold.update(liveThreshold?cueTime:0,liveThreshold&&on,reduced,dt);
    root.userData.thresholdResponse=liveThreshold?witness:undefined;
    const carrier=traffic.update(liveThreshold,on,cue.plasma,dt,reduced);
    root.userData.marcelLight=liveThreshold?witness.actorLight:cue.plasma*.84+cue.impulse*.68;
    plasma.visible=cue.plasma>.005;
    plasmaMaterial.uniforms.uEnergy.value=cue.plasma*.96;
    plasmaMaterial.uniforms.uImpulse.value=cue.impulse;
    plasmaMaterial.uniforms.uTime.value=reduced?0:t;
    clip.rotation.z=-.24+cue.collar*.27;
    leads.forEach((light,i)=>{light.visible=on&&cue.collar>.055+i*.128;});
    rimEnergy.forEach((rim,i)=>{rim.visible=on&&cue.rim>(i+.55)/12;});
    foldSpill.intensity=root.userData.foldLight;
    marcelSpill.intensity=root.userData.marcelLight;
    // Light travels onto Marcel from his anchored boots to the existing vest.
    // This is reflected Hookshot light, not emissive anatomy or a new power.
    marcelSpill.distance=liveThreshold?.84:1.65;
    marcelSpill.position.set(actor.position.x-(liveThreshold?.20:.38),actor.position.y+(liveThreshold?.10+.48*witness.climb:.46),actor.position.z+.22);
    actor.rotation.y=-.52-cue.plasma*.22+(reduced?0:Math.sin(t*.8)*.035);
    actor.rotation.z=-cue.plasma*.048-cue.impulse*.059+(reduced?0:Math.sin(t*.9)*.020);
    actor.position.y=pageY(1.59)+.025; // anchored paper weight shift, not levitation
    const watches=carrier?.crew.clear&&carrier.permitted;
    const angle=carrier?Math.atan2(carrier.x-actor.position.x,carrier.z-actor.position.z)-actor.rotation.y:0;
    const target=watches?THREE.MathUtils.clamp(angle,-1.19,.45):0;
    follow=reduced?target:THREE.MathUtils.lerp(follow,target,1-Math.exp(-Math.min(.085,Math.max(0,dt))*9));
    neck.rotation.set(watches?-.06+Math.max(0,(carrier.y-.55))*.19:0,follow,0);
    root.userData.hookshotTraffic=carrier?{...carrier,marcelLook:Number(follow.toFixed(3))}:undefined;
  };
}

function heliocide(root: THREE.Group, bump: THREE.Texture | undefined): UpdateArt {
  const frame=paper(0x33323b,bump), cream=paper(0xd5bd84,bump), score=paper(0x947850,bump);
  const cyan=paper(0x5fa3ae,bump), light=new THREE.MeshBasicMaterial({color:0xa4ded9});
  const star = new THREE.Vector3(-1.02,pageY(-1.02)+.56,-.34);
  const comb=new THREE.Group();
  comb.name='F09 · three-tab model gravity witness comb';
  comb.position.set(-.44,pageY(-.44)+.04,.59);root.add(comb);
  slab(comb,.69,.038,.19,frame);
  slab(comb,.62,.018,.15,score,0,.026);
  const blades = [0,1,2].map(i=>{
    const tab=new THREE.Group();
    tab.name=['nearest witness tab','middle witness tab','far witness tab'][i];
    tab.position.set(-.22+i*.21,.036,0);comb.add(tab);
    slab(tab,.082,.14,.030,cream,0,.069);
    const elbow=new THREE.Group();elbow.position.y=.133;tab.add(elbow);
    slab(elbow,.074,.14,.026,cream,0,.070);
    slab(elbow,.058,.013,.031,cyan,0,.114,0);
    slab(comb,.09,.009,.095,frame,tab.position.x,.036,0);
    return {tab,elbow};
  });
  // Paper slivers and tail markings visibly stream toward the model star.
  // Keep every sliver on the model/fore-margin side, away from the historical stars.
  const fibers=Array.from({length:15},(_,i)=>{
    const a=i*Math.PI*2/15;
    const start=new THREE.Vector3(star.x+Math.cos(a)*(.48+(i%3)*.08),
      star.y+Math.sin(a)*(.33+(i%2)*.15),star.z+.22+(i%4)*.13);
    const fragment=slab(root,.10+(i%3)*.055,.018,.018,i%3===0?light:cyan);
    fragment.name='F09 · inward witness filament';
    fragment.visible=false;fragment.castShadow=false;
    return {fragment,start};
  });
  const extraction=new THREE.Group();
  extraction.name='F09 · Starsilk slip pulled from the model';
  extraction.position.set(star.x+.33,star.y+.035,star.z+.13);
  root.add(extraction);
  const slipMat=paper(0x63ced8,bump,.38,.09);
  const slip=slab(extraction,.39,.021,.022,slipMat,.185);
  const grip=arc(extraction,new THREE.TorusGeometry(.070,.016,5,14),slipMat);
  grip.position.set(.39,0,0);
  grip.rotation.x=-.46;
  const dir=new THREE.Vector3(), pos=new THREE.Vector3(), unitX=new THREE.Vector3(1,0,0);
  const fallbackRupture=makeF09RuptureBed(root,star.clone().setY(pageY(star.x)+.47));
  const historicalBed=makeF09RuptureBed(root,new THREE.Vector3(1.22,pageY(1.22)+.48,-.53));
  const nextBed=makeF09RuptureBed(root,new THREE.Vector3(1.78,pageY(1.78)+.48,-.53));
  const leftFold=makeF09RuptureBed(root,new THREE.Vector3(.62,pageY(.62)+.48,-.53));
  const clockMount=new THREE.Group();
  clockMount.name='F09 · historical machine mechanical witness';
  clockMount.position.set(.74,pageY(.74)+.028,.37);root.add(clockMount);
  const tickMetal=paper(0x8c7757,bump,.39,.33);
  const struck=paper(0x5d4231,bump,.44,.14);
  slab(clockMount,.31,.024,.18,frame);
  const hammer=new THREE.Group();clockMount.add(hammer);
  slab(hammer,.30,.015,.052,tickMetal,0,.059,0);
  slab(hammer,.064,.020,.061,struck,.105,.071,0);
  let historicalClock=0;
  let was=false, initialized=false, t=0;
  return (state,dt,reduced)=>{
    const on=state.interactions.A.active||state.interactions.A.locked;
    if(!initialized){initialized=true;t=on?1.25:0;}
    else if(on&&!was)t=0;
    else if(on)t+=dt;
    else t=0;
    was=on;
    const authoredFrame = root.userData.f09AuthoredFrame as number|undefined;
    const rupture=root.userData.f09RuptureBed as ReturnType<typeof makeF09RuptureBed>|undefined;
    const destructionClock=authoredFrame??(on?1+t*18:1);
    const destruction=destructionClock<46?-1:(destructionClock-46)/19;
    if(rupture)fallbackRupture.update(-1,reduced);
    root.userData.f09RuptureBedFractures=(rupture??fallbackRupture).update(destruction,reduced);
    comb.visible=destructionClock<55;
    const historical=root.userData.f09HistoricalFinale??-1;
    historicalClock+=Math.max(0,dt);
    const rhythm=historicalMachineBeat(historicalClock,historical,state.interactions.B.locked,reduced);
    hammer.rotation.z=rhythm.beat*.40;
    struck.emissive.setHex(0xa36730);
    struck.emissiveIntensity=rhythm.beat*.45;
    root.userData.f09HistoricalPulse=rhythm.beat;
    const bedAt=(start:number,duration:number)=>historical<start?-1:(historical-start)/duration;
    root.userData.f09HistoricalFractures=historicalBed.update(bedAt(2.31,.94),reduced)+
      nextBed.update(bedAt(2.53,1.02),reduced)+leftFold.update(bedAt(2.14,.91),reduced);
    const foldingPaper=root.userData.f09PaperGround as ReturnType<typeof newF09CollapsingPaperGround>|undefined;
    root.userData.f09WholePaperWaves=foldingPaper?.update(authoredFrame??1,reduced)??[0,0,0];
    const drawn=on?(reduced?1:ease(0,.27,t)):0;
    extraction.position.x=star.x+.33+drawn*.11;
    slip.scale.x=1+drawn*.21;
    grip.position.x=.39+drawn*.078;
    blades.forEach(({tab,elbow},i)=>{
      const progress=on?reduced?1:authoredFrame===undefined?ease(.17,.75,t):ease(18+i*3,44+i*2,authoredFrame):0;
      tab.rotation.z=progress*(.93-i*.19);
      tab.rotation.x=-progress*(.48-i*.06);
      elbow.rotation.z=progress*(.56-i*.105);
    });
    fibers.forEach(({fragment,start},i)=>{
      const flight=authoredFrame===undefined ? clamp((t-.16-i%5*.036)/.72)
        : clamp((authoredFrame-19-i%5*.57)/27);
      fragment.visible=on&&!reduced&&flight>0&&flight<1;
      if(!fragment.visible)return;
      const inward=Math.pow(flight,1.28);
      // When the real armillary is loaded, the physical lens seats slightly left/lower.
      // The witness still begins at the same printed stock and is pulled into the actual center.
      const target=(root.userData.f09ModelCenter as THREE.Vector3|undefined)??star;
      pos.copy(start).lerp(target,inward);
      pos.y+=Math.sin(inward*Math.PI)*(.05+i%4*.018);
      fragment.position.copy(pos);
      dir.copy(target).sub(pos).normalize();
      fragment.quaternion.setFromUnitVectors(unitX,dir);
      fragment.scale.set(1+inward*.75,Math.max(.25,1-inward),1);
    });
    root.userData.f09Witness=blades.map(({tab})=>Number(tab.rotation.z.toFixed(3)));
    root.userData.f09InwardSlivers=fibers.filter(({fragment})=>fragment.visible).length;
  };
}

/** Keep the approved witness comb and its ink; replace just the redundant temporary pull slip. */
export function mountF09FunctionalTheatre(root:THREE.Group, center:THREE.Vector3):void {
  const slip=root.getObjectByName('F09 · Starsilk slip pulled from the model');
  if(slip)slip.visible=false;
  root.userData.f09ModelCenter=center;
  root.userData.f09PaperGround=newF09CollapsingPaperGround(root,center);
  root.userData.f09RuptureBed=makeF09RuptureBed(root,center);
}

function siege(root: THREE.Group, world: BaseFolioWorld, bump: THREE.Texture | undefined): UpdateArt {
  const ink=new THREE.MeshBasicMaterial({color:0x050608});
  const underLip=paper(0x20242b,bump,.68), edge=paper(0x96979b,bump,.79);
  const center = new THREE.Vector3(-1.12,pageY(-1.12)+.03,-.25);
  const receiver=new THREE.Group();
  receiver.name='F10 · recessed black paper receiver';receiver.position.copy(center);
  root.add(receiver);
  // Nested cuts frame the original black well rather than adding another
  // streak. A curved raised lip occludes the figures as they dip under it.
  for(const [inner,outer,y,mat] of [[.58,.71,.024,underLip],[.55,.59,.041,edge],[.40,.56,.049,ink]] as const){
    const lip=arc(receiver,new THREE.RingGeometry(inner,outer,28),mat,y,0);
    lip.rotation.x=-Math.PI/2;
  }
  const outerWall=world.root.children.find(o=>o instanceof THREE.Group && o.children.some(child=>
    child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry &&
    Math.abs(child.geometry.parameters.radius-.84)<.001));
  const authored=createF10Challenger(center,bump);
  root.add(authored.root);
  const story=world instanceof F10FolioWorld?createF10StoryPaper(world,pageY):null;
  if(story)root.add(story.root);
  const positionMatches=(o:THREE.Object3D)=>Math.abs(o.position.x-center.x)<.001&&Math.abs(o.position.z-center.z)<.001;
  const originalCore=world.root.children.find(o=>positionMatches(o)&&o instanceof THREE.Mesh&&
    o.geometry instanceof THREE.CylinderGeometry&&Math.abs(o.geometry.parameters.radiusTop-.62)<.001);
  const originalTerrace=world.root.children.find(o=>positionMatches(o)&&Math.abs(o.position.y-(center.y-.03))<.001);
  let staged=false;
  root.userData.f10Dispose=()=>{
    for(const n of authored.hits){const i=world.interactables.indexOf(n);if(i>=0)world.interactables.splice(i,1);}
    authored.dispose();story?.dispose();
  };
  const bumpSource=bump??new THREE.Texture();
  if(!bump) receiver.userData.revisionOwnedBump=bumpSource;
  const actors=(['037','055','044'] as const).map((id,i)=>{
    const rig=buildDraxisModel(id,bumpSource);
    const hold=new THREE.Group();hold.name='F10 · Drakken containment figure '+id;
    root.add(hold);hold.add(rig.group);
    const initial = [.31,.342,.317][i];
    rig.group.scale.setScalar(initial);
    const theta=[2.89,1.51,.06][i]+.18;
    const radius=[.74,.67,.71][i];
    const bounds=new THREE.Box3().setFromObject(rig.group);
    const corners=[bounds.min.x,bounds.max.x].flatMap(x=>[bounds.min.y,bounds.max.y].flatMap(y=>
      [bounds.min.z,bounds.max.z].map(z=>new THREE.Vector3(x,y,z))));
    return {performance:bindDraxisFigurePerformance(rig),hold,theta,radius,corners};
  });
  let clock=0,fallback=0,initialized=false,hadOpened=false;
  return (state,dt,reduced)=>{
    const on=state.interactions.A.active;
    authored.update(on,dt,reduced);
    const ready=authored.root.userData.assetState==='ready';
    if(ready&&!staged){
      staged=true;
      for(const o of [receiver,outerWall,originalCore,originalTerrace])if(o)o.visible=false;
      outerWall?.traverse(n=>{n.userData.f10Understudy=true;});
      world.interactables.push(...authored.hits);
    }
    root.userData.f10AssetState=authored.root.userData.assetState;
    root.userData.f10Lift=authored.lift;
    root.userData.f10Hinges=authored.root.userData.hingeCount;
    root.userData.f10Wave=authored.root.userData.wave;
    if(!initialized||reduced) fallback=Number(on);
    else fallback=toward(fallback,Number(on),dt,5);
    initialized=true;
    if(on) hadOpened=true;
    clock+=reduced?0:dt;
    // The archive collar starts at unit scale on construction, then eases to
    // its stored closed value. Do not play a false capture on a fresh page.
    const lift=ready?authored.lift:reduced?Number(on):!hadOpened?0:outerWall?clamp((outerWall.scale.y-.16)/.84):fallback;
    let belowReceiver=0;
    const storyActors:string[]=[];
    const paperPerformance:ReturnType<ReturnType<typeof bindDraxisFigurePerformance>['update']>[]=[];
    let stageVisible=true;
    for(let node:THREE.Object3D|null=root;node&&stageVisible;node=node.parent)stageVisible=node.visible;
    const lip=authored.lip,receiverLip=center.y+lip.top;
    const worldCorner=new THREE.Vector3();
    for(let i=0;i<actors.length;i++){
      const { performance, hold, theta, radius, corners }=actors[i];
      const local=ready?authored.localLift(theta):lift;
      const brace=ease(.025,.24,local)*(1-ease(.30,.57,local));
      const slip=ease(.30,.83,local);
      const drop=ease(.59,.99,local);
      const angle=theta+(i%2?-.36:.29)*slip;
      // Brace outward against the fin, then lose footing around the hinge.
      // Folded-paper actor sizes stay genuine during the plunge.
      const radial=radius+.11*brace-(radius-.21)*slip;
      hold.position.set(center.x+Math.cos(angle)*radial,
        center.y+.048+Math.sin(Math.PI*slip)*.071-.94*drop,
        center.z+Math.sin(angle)*radial);
      hold.rotation.y=theta+Math.PI*.52+slip*.89;
      hold.rotation.x=-.23*brace-.72*drop+.10*Math.sin(Math.PI*slip);
      hold.rotation.z=(i%2?-1:1)*(.19*brace+.40*slip)+(reduced?0:Math.sin(clock*1.2+i*2.1)*(1-slip)*.026);
      hold.updateMatrix();
      // Gate invisibility against the original receiver lip, not a timed
      // crossfade. Bounds are in actor-local space before the current lean.
      let top=-Infinity;
      for(const corner of corners)top=Math.max(top,worldCorner.copy(corner).applyMatrix4(hold.matrix).y);
      hold.visible=radial>lip.radius*.74||top>=receiverLip;
      if(!hold.visible)belowReceiver++;
      storyActors.push(!hold.visible?'below-lip':drop>.15?'descending':slip>.08?'slipping':brace>.1?'braced':'ready');
      paperPerformance.push(performance.update(dt,stageVisible&&hold.visible&&slip<.08,reduced,1-ease(.02,.17,brace+slip)));
    }
    root.userData.f10Story={...story?.update(state.interactions.C.active,state.interactions.B.active,lift,dt,reduced,ready?authored.localLift:()=>lift),actors:storyActors,paperPerformance};
    root.userData.f10Captured=belowReceiver;
  };
}

export function createRevisionWar2Art(index:6|7|8|9,world:BaseFolioWorld):RevisionArt {
  const root=new THREE.Group();
  root.name='Living-only Palimpsest revision / F'+String(index+1).padStart(2,'0');
  const bump=paperBump(world);
  const update=index===6?createF07ReliefChoreography(root,bump):index===7?aureal(root,bump):
    index===8?heliocide(root,bump):siege(root,world,bump);
  return {root,update,dispose:()=>{
    root.userData.f10Dispose?.();
    root.traverse(e=>e.userData.revisionOwnedBump?.dispose());
    disposeArt(root);
  }};
}
