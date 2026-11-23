import * as THREE from 'three';
import type { FolioRuntimeState } from '../types/atlas';
import type { BaseFolioWorld } from '../engine/folios/BaseFolioWorld';
import { getOpenPageY as pageY } from '../engine/BookAndDeskRig';
import { buildMarcelFigure } from '../engine/drakken/CharacterFigures';
import { buildDraxisModel } from '../engine/drakken/DraxisModels';

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

// Relief tableaux are illustrations of the recorded supply system, not a
// reconstructed encounter. Anonymous figures, simple parcels, no named event.
function relief(root: THREE.Group, bump: THREE.Texture | undefined): UpdateArt {
  const cream = paper(0xecd6aa, bump), brass = paper(0xab895b, bump, .58, .2);
  const rust = paper(0x874d42, bump), dark = paper(0x2e303a, bump);
  const slate = paper(0x567078, bump), parcel = paper(0xd1b592, bump);
  const cloth = paper(0xa38370, bump);
  const reliefBase = new THREE.Group();
  reliefBase.name = 'F07 · illustrated Administration relief supplies';
  reliefBase.position.set(-1.85, pageY(-1.85) + .017, 1.29);
  root.add(reliefBase);
  slab(reliefBase, 1.10, .027, .65, dark);
  slab(reliefBase, 1.05, .022, .60, cream, 0, .020);
  for (const x of [-.40,-.18,.04,.26,.45]) slab(reliefBase, .11,.006,.009,brass,x,.035,.23);
  const bench = new THREE.Group();
  bench.name = 'F07 · relief bench scored hinge';
  bench.position.set(0, .034, -.14);
  reliefBase.add(bench);
  for(const x of [-.21,.21]){
    slab(bench, .05,.15,.12, dark,x,.075,0);
    slab(bench, .075,.023,.17,brass,x,.013,0);
  }
  slab(bench,.60,.043,.20,rust,0,.15);
  slab(bench,.54,.013,.017,brass,0,.173,.084);
  for(let i=0;i<3;i++){
    const x=-.17+.17*i, h=.09+i%2*.035;
    slab(bench,.125,h,.12,i===1?cloth:parcel,x,.175+h/2,0);
    slab(bench,.022,h+.006,.124,cream,x,.175+h/2,0);
  }
  const figures = [-1,1].map((sign, i) => {
    const f=new THREE.Group();
    f.name=i===0?'F07 · anonymous relief worker':'F07 · anonymous recipient';
    f.position.set(sign*.39,.037,.07); reliefBase.add(f);
    const body = new THREE.Group(); f.add(body);
    for(const x of [-.031,.031]) slab(f,.041,.085,.06,dark,x,.043,0);
    const coat=mesh(body,new THREE.CylinderGeometry(.073,.091,.16,5),i===0?slate:rust,0,.17);
    coat.scale.z=.72;
    if(i===0) slab(body,.10,.022,.007,cream,0,.205,.049); // uniform trim, not an invented insignia
    mesh(body,new THREE.IcosahedronGeometry(.048,0),parcel,0,.278);
    slab(body,.11,.035,.055,i===0?slate:cloth,-sign*.065,.202,.017).rotation.z=sign*.27;
    slab(body,.082,.062,.070,parcel,-sign*.11,.192,.021).rotation.z=-sign*.12;
    return body;
  });
  let t=0, hinge=.50;
  return (state, dt, reduced) => {
    t+=reduced?0:dt;
    const target = state.interactions.C.active ? 1 : .50;
    hinge = reduced ? target : toward(hinge, target, dt);
    bench.rotation.x = .58 * (1-hinge);
    figures.forEach((figure,i) => {
      figure.rotation.y=(i===0?.35:-.35)+(reduced?0:Math.sin(t*.9+i*1.5)*.045);
      figure.rotation.z=(i===0?-.09:.09)+(reduced?0:Math.sin(t*1.12+i*.8)*.023);
    });
  };
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
    uniforms:{uTime:{value:0},uEnergy:{value:0}},
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
      void main(){
        float r=length(p), a=atan(p.y,p.x);
        float swirl=sin(a*3.0-r*14.0+uTime*1.75);
        float curl=sin(a*7.0+r*20.0-uTime*1.0+swirl*1.4);
        float seam=pow(max(0.0,0.55+0.30*swirl+0.30*curl),3.0);
        float sheath=exp(-50.0*abs(r-0.90));
        float corona=smoothstep(.15,.90,r);
        vec3 base=mix(vec3(.01,.05,.11),vec3(.13,.70,.79),clamp(seam*.75+corona*.35,0.,1.));
        vec3 surge=vec3(.37,.88,1.)*min(1.0,sheath*(.48+.36*swirl)+seam*.37);
        gl_FragColor=vec4(base+surge,uEnergy*(1.0-smoothstep(.974,1.0,r)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent:true, depthWrite:false, side:THREE.DoubleSide,
  });
  const plasma=arc(gate,new THREE.CircleGeometry(.449,50),plasmaMaterial,0,.029);
  plasma.castShadow=plasma.receiveShadow=false;
  plasma.visible=false;

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
  if(!bump) actor.userData.revisionOwnedBump=bumpSource;
  const shoes=new THREE.Group();shoes.name='F08 · Marcel paper foot anchors';
  shoes.position.set(1.59,pageY(1.59)+.012,.38);root.add(shoes);
  for(const dz of [-.075,.075])slab(shoes,.40,.018,.06,ink,0,0,dz);
  let t=0,p=0,initialized=false;
  return (state,dt,reduced) => {
    const on = state.interactions.A.active;
    if (reduced || !initialized) p=Number(on);
    else p=toward(p,Number(on),dt,on?2.8:7);
    initialized=true;
    t+=reduced?0:dt;
    const power=on?ease(.45,.87,p):0;
    root.userData.portalPower=power;
    plasma.visible=power>.008;
    plasmaMaterial.uniforms.uEnergy.value=power*.92;
    plasmaMaterial.uniforms.uTime.value=reduced?0:t;
    clip.rotation.z=-.24+p*.27;
    leads.forEach((light,i)=>{light.visible=on&&p>.055+i*.058;});
    actor.rotation.y=-.52-p*.22+(reduced?0:Math.sin(t*.8)*.035);
    actor.rotation.z=-p*.055+(reduced?0:Math.sin(t*.9)*.026);
    actor.position.y=pageY(1.59)+.025; // weight shift, not levitation
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
  let was=false, initialized=false, t=0;
  return (state,dt,reduced)=>{
    const on=state.interactions.A.active||state.interactions.A.locked;
    if(!initialized){initialized=true;t=on?1.25:0;}
    else if(on&&!was)t=0;
    else if(on)t+=dt;
    else t=0;
    was=on;
    const progress=on?(reduced?1:ease(.17,.75,t)):0;
    const drawn=on?(reduced?1:ease(0,.27,t)):0;
    extraction.position.x=star.x+.33+drawn*.11;
    slip.scale.x=1+drawn*.21;
    grip.position.x=.39+drawn*.078;
    blades.forEach(({tab,elbow},i)=>{
      tab.rotation.z=progress*(.93-i*.19);
      tab.rotation.x=-progress*(.48-i*.06);
      elbow.rotation.z=progress*(.56-i*.105);
    });
    fibers.forEach(({fragment,start},i)=>{
      const flight=clamp((t-.16-i%5*.036)/.72);
      fragment.visible=on&&!reduced&&flight>0&&flight<1;
      if(!fragment.visible)return;
      const inward=Math.pow(flight,1.28);
      pos.copy(start).lerp(star,inward);
      pos.y+=Math.sin(inward*Math.PI)*(.05+i%4*.018);
      fragment.position.copy(pos);
      dir.copy(star).sub(pos).normalize();
      fragment.quaternion.setFromUnitVectors(unitX,dir);
      fragment.scale.set(1+inward*.75,Math.max(.25,1-inward),1);
    });
  };
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
  const bumpSource=bump??new THREE.Texture();
  if(!bump) receiver.userData.revisionOwnedBump=bumpSource;
  const actors=(['037','055','044'] as const).map((id,i)=>{
    const rig=buildDraxisModel(id,bumpSource);
    const hold=new THREE.Group();hold.name='F10 · Drakken containment figure '+id;
    root.add(hold);hold.add(rig.group);
    const initial = [.25,.28,.25][i];
    rig.group.scale.setScalar(initial);
    const theta=[2.89,1.51,.06][i]+.18;
    const radius=[.74,.67,.71][i];
    return {rig,hold,theta,radius,initial};
  });
  let clock=0,fallback=0,initialized=false,hadOpened=false;
  return (state,dt,reduced)=>{
    const on=state.interactions.A.active;
    if(!initialized||reduced) fallback=Number(on);
    else fallback=toward(fallback,Number(on),dt,5);
    initialized=true;
    if(on) hadOpened=true;
    clock+=reduced?0:dt;
    // The archive collar starts at unit scale on construction, then eases to
    // its stored closed value. Do not play a false capture on a fresh page.
    const lift=reduced?Number(on):!hadOpened?0:outerWall?clamp((outerWall.scale.y-.16)/.84):fallback;
    for(let i=0;i<actors.length;i++){
      const { rig, hold, theta, radius, initial }=actors[i];
      const capture=ease(.09+i*.08,.91+i*.02,lift);
      const angle=theta+(i-1)*.17*capture;
      const radial=radius*(1-capture*.79);
      hold.position.set(center.x+Math.cos(angle)*radial,
        center.y+.048+Math.sin(Math.PI*capture)*.12-ease(.61,.99,capture)*.49,
        center.z+Math.sin(angle)*radial);
      hold.rotation.y=theta+Math.PI*.5+capture*.74;
      hold.rotation.x=-capture*.68;
      hold.rotation.z=capture*.37+(reduced?0:Math.sin(clock*1.2+i*2.1)*(1-capture)*.026);
      rig.group.scale.setScalar(initial*(1-.23*capture));
      // Vanish only after going below the receiver surface, never by alpha.
      hold.visible=capture<.93;
      rig.animate(clock+i*.47,!reduced&&capture<.12);
    }
  };
}

export function createRevisionWar2Art(index:6|7|8|9,world:BaseFolioWorld):RevisionArt {
  const root=new THREE.Group();
  root.name='Living-only Palimpsest revision / F'+String(index+1).padStart(2,'0');
  const bump=paperBump(world);
  const update=index===6?relief(root,bump):index===7?aureal(root,bump):
    index===8?heliocide(root,bump):siege(root,world,bump);
  return {root,update,dispose:()=>{
    root.traverse(e=>e.userData.revisionOwnedBump?.dispose());
    disposeArt(root);
  }};
}
