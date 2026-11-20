import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildShardGodFigure, buildWordstreamerFigure, buildNiAlBuGeode } from '../engine/drakken/CharacterFigures';
import { activateSlot, mayReveal, planetPattern, restoreFolioStudy, sourceInkRegistration, startFolio, type FolioActions, type FolioIndex, type Slot, type Inspection } from './folioLogic.ts';
import { FIRST_LATER_FOLIO, LATER_STUDY_STORAGE_KEY, isLivingIndex, operateLater, restoreLaterStudy, serializeLaterStudy, type LaterFolioIndex } from './laterFolioState.ts';
import { activeSpecimen, createLaterFolio, getLaterCopy, makeContactShadow } from './laterFolioScenes.ts';
import { getLaterDiagram } from './laterFolioDiagrams.ts';

/**
 * PALIMPSEST — F01–F03 sculptural REVIEW build.
 * No narration, new canonical character geometry, hidden F03 inscription,
 * chapter rewrites or changes to the existing twelve-folio reader.
 * Production contract: production/folio_vnext/F01_F03_DIRECTION_AND_DELTA.md.
 */
const byId = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing review control #${id}`);
  return node as T;
};
const canvas = byId<HTMLCanvasElement>('stage');
const title = byId<HTMLElement>('folio-title');
const description = byId<HTMLElement>('folio-description');
const status = byId<HTMLElement>('screen-reader-status');
const indicator = byId<HTMLElement>('mechanism-status');
const globalAnnouncer = byId<HTMLElement>('global-announcer');
const progress = byId<HTMLElement>('folio-progress');
const prevButton = byId<HTMLButtonElement>('prev');
const nextButton = byId<HTMLButtonElement>('next');
const miniButton = byId<HTMLButtonElement>('mini');
const inspectButton = byId<HTMLButtonElement>('inspect');
const witnessButton = byId<HTMLButtonElement>('witness');
const resetStudyButton = byId<HTMLButtonElement>('reset-study');
const fallback = byId<HTMLElement>('webgl-fallback');
const moveButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-move]'));
const actionButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mechanism]'));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const bridgeEmbedded = new URLSearchParams(window.location.search).get('embedded') === '1' && window.parent !== window;
const requestedFolio = Number(new URLSearchParams(window.location.search).get('folio'));
const initialFolio = Number.isInteger(requestedFolio) && requestedFolio >= 1 && requestedFolio <= 12 ? requestedFolio - 1 : 0;
function sendBridge(action: 'folio' | 'continue' | 'exit', folio: number): void {
  if (bridgeEmbedded) window.parent.postMessage({ channel: 'palimpsest-living', action, folio }, window.location.origin);
}


const titleCopy = [
  'I — Before the Stars',
  'II — The All Unfolds',
  'III — The Notebook Program',
] as const;
const overviewCopy = [
  'Three existing PALIMPSEST papercraft figure sculptures occupy the primordial spread. There are no celestial stars yet; the character designs remain editorial interpretations.',
  'Unfold the celestial fan: first points, then clusters, then a galactic paper sculpture. The Digital Geode uses PALIMPSEST’s existing NiAlBu sculpture. Zentrum is a landmark, not a literal universal centre.',
  "Open finite template leaves from the World's Vault; select a source plate and generate visibly related but distinct worlds. These are illustrative models, not named planets.",
] as const;
const actionCopy = [
  ['Lift the three paper leaves', 'Inspect the folded detail', 'Compare the three roles'],
  ['Raise first stellar points', 'Open the clusters', 'Unfold the galaxy'],
  ['Open the source templates', 'Change source plate', 'Generate bounded variation'],
] as const;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b1018');
scene.fog = new THREE.FogExp2(0x0b1018, 0.017);
const camera = new THREE.PerspectiveCamera(45, 1, 0.04, 80);
camera.position.set(0, 6.5, 9.9);
scene.add(new THREE.AmbientLight(0xa3b5c6, 1.16));
const keyLight = new THREE.DirectionalLight(0xfff0d5, 2.55);
keyLight.position.set(-4, 8, 5);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x7dc5de, 1.23);
rimLight.position.set(4, 4, -5);
scene.add(rimLight);
const overhead = new THREE.PointLight(0xc4e6ee, 26, 18, 2);
overhead.position.set(0, 5.1, -2.1);scene.add(overhead);
const rig = new THREE.Group();
scene.add(rig);
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let frame = 0;
let lastTime = 0;
const STUDY_STORAGE_KEY='palimpsest.folio.review.study-state.v1';
function loadStudy():FolioActions[]{
  try{return restoreFolioStudy(JSON.parse(sessionStorage.getItem(STUDY_STORAGE_KEY)??'null'));}
  catch{return restoreFolioStudy(null);}
}
let studyStates:FolioActions[]=loadStudy();
let state:FolioActions=studyStates[0];
let currentFolio = initialFolio;
function loadLaterStudy() {
  try { return restoreLaterStudy(JSON.parse(sessionStorage.getItem(LATER_STUDY_STORAGE_KEY) ?? 'null')); }
  catch { return restoreLaterStudy(null); }
}
let laterStates = loadLaterStudy();
let laterWorld: ReturnType<typeof createLaterFolio> | null = null;
let paperShadow: THREE.CanvasTexture | null = null;
let activeTime = 0;
function saveLaterStudy(): void {
  try { sessionStorage.setItem(LATER_STUDY_STORAGE_KEY, JSON.stringify(serializeLaterStudy(laterStates))); }
  catch { /* Unavailable storage never blocks reading or physical mechanisms. */ }
}
function saveStudy():void{
  // No private testimony, narrator, camera, or official session data in this payload.
  try{sessionStorage.setItem(STUDY_STORAGE_KEY,JSON.stringify({version:1,folios:studyStates}));}
  catch{ /* Storage refusal is non-fatal. */ }
}
let inspection: Inspection = 'overview';
let discovered = false;
let focusText: THREE.Mesh | null = null;
let secretTarget: THREE.Vector3 | null = null;
let paperHinges: THREE.Group[] = [];
let f01DetailMarks: THREE.Group[] = [];
let galaxyLayers: {group: THREE.Group; stage: 1 | 2 | 3}[] = [];
let galaxyPaperLoom: THREE.Group | null = null;
let witnessActive = false;
let witnessCamera: {position: THREE.Vector3; target: THREE.Vector3} | null = null;
type CameraFlight = {from: THREE.Vector3; to: THREE.Vector3; lookFrom: THREE.Vector3; lookTo: THREE.Vector3; elapsed: number; seconds: number; destination: 'witness' | 'overhead'};
let cameraFlight: CameraFlight | null = null;
let vaultLeaf: THREE.Group | null = null;
let sourceWheel: THREE.Group | null = null;
let programDie: THREE.Group | null = null;
let printPulse = 0;
let planets: THREE.Group | null = null;
let textTextures: THREE.Texture[] = [];
let activeMove = new Set<string>();
let authoredFigureCount = 0;
const clockDirection = new THREE.Vector3();
const cursorToSecret = new THREE.Vector3();
const shared = {
  ink: new THREE.MeshStandardMaterial({color:0x1a202b,roughness:0.76,side:THREE.DoubleSide}),
  paper: new THREE.MeshStandardMaterial({color:0xf0e6d2,roughness:0.92,side:THREE.DoubleSide}),
  backing: new THREE.MeshStandardMaterial({color:0xc7baa1,roughness:0.88,side:THREE.DoubleSide}),
  blue: new THREE.MeshStandardMaterial({color:0x33455c,roughness:0.83,side:THREE.DoubleSide}),
  cyan: new THREE.MeshStandardMaterial({color:0x64d9f5,roughness:0.40,emissive:0x126c92,emissiveIntensity:0.52,side:THREE.DoubleSide}),
  brass: new THREE.MeshStandardMaterial({color:0xc6a66d,roughness:0.46,metalness:0.28,side:THREE.DoubleSide}),
  purple: new THREE.MeshStandardMaterial({color:0x7d76a1,roughness:0.77,side:THREE.DoubleSide}),
  green: new THREE.MeshStandardMaterial({color:0x557c73,roughness:0.84,side:THREE.DoubleSide}),
  vellum: new THREE.MeshStandardMaterial({color:0xf6eedb,roughness:0.97,side:THREE.DoubleSide,transparent:true,opacity:0.79}),
  bone: new THREE.MeshStandardMaterial({color:0xfaf0db,roughness:0.95,side:THREE.DoubleSide}),
  gold: new THREE.MeshStandardMaterial({color:0xb89860,roughness:0.58,metalness:0.24,side:THREE.DoubleSide}),
  seal: new THREE.MeshStandardMaterial({color:0x752d37,roughness:0.78,side:THREE.DoubleSide}),
  navy: new THREE.MeshStandardMaterial({color:0x162638,roughness:0.90,side:THREE.DoubleSide}),
};
const sharedMats: THREE.Material[] = Object.values(shared);
// Retain the palette on the authored sculptures. Overlay dark, independent ink linework
// rather than recolouring the artists' cardstock. This is a physical cel-paint treatment,
// not a glossy CGI/PBR remodel, texture replacement or new character design.
const sourceInk = new THREE.LineBasicMaterial({color:0x111924, transparent:true, opacity:0.9, depthWrite:false});
sharedMats.push(sourceInk);
const registrationInk=new THREE.MeshBasicMaterial({color:0x111924,side:THREE.DoubleSide});
sharedMats.push(registrationInk);
function addInkedContours(authored:THREE.Object3D):void {
  const meshes:THREE.Mesh[]=[];
  authored.traverse(obj=>{
    if(obj instanceof THREE.Mesh && obj.geometry && obj.geometry.getAttribute('position')?.count<=3500) meshes.push(obj);
  });
  for(const mesh of meshes){
    const mat=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
    if(mat instanceof THREE.MeshStandardMaterial && (mat.transparent || (mat.emissiveIntensity>0.7 && mat.emissive.getHex()!==0)))continue;
    const edges=new THREE.EdgesGeometry(mesh.geometry, 32);
    if(edges.getAttribute('position').count===0){edges.dispose();continue;}
    const strokes=new THREE.LineSegments(edges,sourceInk);
    strokes.name='authored-ink-contour';
    strokes.scale.setScalar(1.004);
    strokes.renderOrder=2;
    mesh.add(strokes);
  }
}
function preCaptivityNiAlBu():THREE.Group {
  // The published model contains the author-built NiAlBu inside his later Geode.
  // Extract its existing figure rather than model a fourth, invented anatomy.
  // The pre-injury era remains visually UNVERIFIED; no limbs or anatomy are invented.
  const apparatus=buildNiAlBuGeode(fiber,1);
  const figure=apparatus.children.find(node=>node instanceof THREE.Group && Math.abs(node.rotation.z-Math.PI)<0.00001);
  if(!(figure instanceof THREE.Group))throw new Error('Original NiAlBu sculpture missing in Geode');
  apparatus.remove(figure);
  figure.rotation.z=0;
  figure.position.set(0,0,0);
  // The four copper prison rings belong to captivity, not the primordial tableau.
  for(const node of [...figure.children]){
    if(node instanceof THREE.Mesh && node.geometry instanceof THREE.TorusGeometry){
      figure.remove(node);node.geometry.dispose();
      const materials=Array.isArray(node.material)?node.material:[node.material];
      materials.forEach(material=>material.dispose());
    }
  }
  disposeSubtree(apparatus);
  return figure;
}

function paperGrain():THREE.CanvasTexture {
  const c=document.createElement('canvas');c.width=256;c.height=256;
  const ctx=c.getContext('2d');if(!ctx)throw Error('Paper texture canvas unavailable');
  ctx.fillStyle='#999';ctx.fillRect(0,0,256,256);
  // Deterministic microfibres. All assets are authored within the runtime, not network fetched.
  let seed=0x4f1e8d25;
  const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<3500;i++){
    const v=Math.floor(125+random()*70);
    ctx.fillStyle=`rgba(${v},${v},${v},${0.08+random()*0.23})`;
    ctx.fillRect(random()*256,random()*256,0.6+random()*4,0.3+random()*1.4);
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(3.1,2.7);t.anisotropy=4;return t;
}
const fiber=paperGrain();
for(const mat of sharedMats){
  if(mat instanceof THREE.MeshStandardMaterial && mat!==shared.cyan && mat!==shared.brass){
    mat.bumpMap=fiber;mat.bumpScale=0.006;mat.needsUpdate=true;
  }
}


function put(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x=0, y=0, z=0): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x,y,z);
  mesh.castShadow=geometry instanceof THREE.ExtrudeGeometry;
  parent.add(mesh);
  return mesh;
}
function slab(parent: THREE.Object3D, w:number, h:number, d:number, material: THREE.Material, x=0,y=0,z=0):THREE.Mesh {
  const object=put(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);
  object.castShadow=w>1.3&&h>0.08;object.receiveShadow=h<0.2;return object;
}
function ring(parent: THREE.Object3D, radius:number, tube:number, material:THREE.Material,x=0,y=0,z=0):THREE.Mesh {
  const obj=put(parent,new THREE.TorusGeometry(radius,tube,6,64),material,x,y,z);
  obj.rotation.x=-Math.PI/2;
  return obj;
}
function plaque(parent:THREE.Object3D, text:string, x:number,y:number,z:number,width=1.8, dark=false):THREE.Mesh {
  const c=document.createElement('canvas');c.width=1024;c.height=178;
  const ctx=c.getContext('2d');if(!ctx)throw Error('Text canvas not supported');
  ctx.fillStyle=dark?'#263447':'#eee4ce';ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle=dark?'#7fb7c4':'#827151';ctx.lineWidth=9;ctx.strokeRect(13,13,998,152);
  ctx.fillStyle=dark?'#d9eced':'#222b33';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 48px Georgia, serif';ctx.fillText(text,512,87,970);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textTextures.push(tex);
  const mat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
  const sign=put(parent,new THREE.PlaneGeometry(width,width*178/1024),mat,x,y,z);
  sign.rotation.x=-Math.PI/2;
  return sign;
}
function inscription(parent:THREE.Object3D, lines:string[], x:number,y:number,z:number,width:number):THREE.Mesh {
  const c=document.createElement('canvas');c.width=1200;c.height=390;
  const ctx=c.getContext('2d');if(!ctx)throw Error('Text canvas not supported');
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle='#102a3a';ctx.fillRect(13,22,1174,346);
  ctx.strokeStyle='#5ae3fa';ctx.lineWidth=8;ctx.strokeRect(13,22,1174,346);
  ctx.shadowColor='#64deff';ctx.shadowBlur=14;
  ctx.font='bold 55px Georgia, serif';ctx.textAlign='center';ctx.fillStyle='#b4eeff';
  for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],600,170+(i-(lines.length-1)/2)*82,1110);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textTextures.push(tex);
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false});
  const mesh=put(parent,new THREE.PlaneGeometry(width,width*390/1200),mat,x,y,z);
  mesh.visible=false;
  return mesh;
}
/** Cardstock arches use actual extruded cut edges, not floating backdrops. */
function cutArch(parent:THREE.Object3D,x:number,z:number,width:number,height:number,mat:THREE.Material):THREE.Group {
  const g=new THREE.Group();g.position.set(x,0.22,z);parent.add(g);
  const shape=new THREE.Shape();const half=width/2;
  shape.moveTo(-half,0);shape.lineTo(-half,height*0.56);
  shape.lineTo(-half*0.72,height*0.84);shape.lineTo(-half*0.20,height*0.99);
  shape.lineTo(0,height*1.08);shape.lineTo(half*0.20,height*0.99);
  shape.lineTo(half*0.72,height*0.84);shape.lineTo(half,height*0.56);
  shape.lineTo(half,0);shape.closePath();
  const outline=put(g,new THREE.ExtrudeGeometry(shape,{depth:0.052,bevelEnabled:false,curveSegments:1}),mat);
  outline.castShadow=true;
  slab(g,width+0.07,0.08,0.20,shared.gold,0,0,-0.07);
  // Rear V-fold braces make the upright silhouette mechanically plausible.
  for(const side of [-1,1]){
    const strut=put(g,new THREE.ConeGeometry(0.11,height*0.62,3),shared.backing,side*width*0.32,height*0.28,-0.24);
    strut.rotation.z=side*0.23;
  }
  return g;
}
function filigree(parent:THREE.Object3D,x:number,y:number,z:number,radius:number,mat:THREE.Material):void {
  const o=ring(parent,radius,0.014,mat,x,y,z);
  for(let j=0;j<8;j++){
    const angle=j*Math.PI/4;
    const stud=put(parent,new THREE.BoxGeometry(0.055,0.025,0.085),mat,x+Math.sin(angle)*radius,y,z+Math.cos(angle)*radius);
    stud.rotation.y=angle;
  }
  o.rotation.z=0;
}
function paperHinge(parent:THREE.Object3D, x:number, z:number, width:number,depth:number,color:THREE.Material):THREE.Group {
  const hinge=new THREE.Group();hinge.position.set(x,0.24,z);parent.add(hinge);
  slab(hinge,width,0.046,depth,color,0,0,depth/2);
  slab(parent,width+0.07,0.08,0.10,shared.brass,x,0.25,z);
  // Two pinched cardstock tabs and a brass hinge cap show the actual axis of rotation.
  for(const side of [-1,1]){
    slab(parent,0.075,0.06,0.16,shared.ink,x+side*(width*0.46),0.31,z);
    put(parent,new THREE.CylinderGeometry(0.038,0.038,0.11,8),shared.gold,x+side*(width*0.46),0.335,z);
  }
  return hinge;
}
function book():THREE.Group {
  const root=new THREE.Group();rig.add(root);
  // Slate museum table, book boards, stitched spine and stacked deckled page edges.
  const table=slab(root,18.5,0.11,12.8,shared.ink,0,-0.27,0);
  table.receiveShadow=true;
  slab(root,10.02,0.24,6.63,shared.ink,0,-0.125,-0.015);
  slab(root,9.72,0.09,6.39,shared.gold,0,0.015,-0.015);
  for(let i=0;i<5;i++){
    const edge=slab(root,9.33-i*0.025,0.014,6.02-i*0.025, i%2?shared.backing:shared.bone,0,0.050+i*0.018,0);
    edge.receiveShadow=true;
  }
  slab(root,4.47,0.075,5.76,shared.paper,-2.32,0.15,0);
  slab(root,4.47,0.075,5.76,shared.paper,2.32,0.15,0);
  slab(root,0.155,0.22,5.92,shared.blue,0,0.16,0);
  for(const x of [-4.53,4.53]){
    slab(root,0.07,0.075,5.72,shared.gold,x,0.225,0);
    for(const z of [-2.73,2.73]){
      const rivet=put(root,new THREE.CylinderGeometry(0.052,0.052,0.022,10),shared.gold,x,0.276,z);
      rivet.rotation.y=Math.PI/8;
    }
  }
  // Double-rule registration border around the teaching aperture.
  for(const x of [-4.16,4.16])slab(root,0.018,0.009,5.00,shared.gold,x,0.24,-0.10);
  for(const z of [-2.53,2.30])slab(root,8.28,0.009,0.017,shared.gold,0,0.24,z);
  for(let i=0;i<18;i++){
    const z=-2.75+i*0.325;
    slab(root,0.032,0.012,0.09,shared.bone,0,0.285,z);
  }
  slab(root,9.90,0.11,0.20,shared.ink,0,-0.015,-3.18);
  for(const x of [-4.58,4.58])for(const z of [-2.88,2.88]){
    put(root,new THREE.CylinderGeometry(0.075,0.075,0.018,12),shared.gold,x,0.23,z);
  }
  return root;
}
function platform(parent:THREE.Object3D,x:number,z:number,w=1.55):void {
  slab(parent,w,0.11,1.18,shared.backing,x,0.24,z);
  slab(parent,w-0.13,0.065,1.05,shared.paper,x,0.32,z);
}
function buildF01():void {
  const root=book();
  // Intentionally NO star points, star meshes, nebula sky or cosmic background.
  slab(root,7.95,0.05,1.73,shared.blue,0,0.25,-1.23);
  // Layered, unlit primordial architecture. These arches are paper scenery, not stars.
  for(let i=0;i<3;i++){
    const x=(i-1)*2.67;
    const arch=cutArch(root,x,-2.39,2.06,1.63,i===0?shared.ink:i===1?shared.purple:shared.navy);
    const inkFrame=cutArch(arch,0,-0.045,1.66,1.22,shared.blue);
    inkFrame.position.y=0.0;
    for(let s=-1;s<=1;s++){
      slab(root,0.035,0.46+(i%2)*0.17,0.055,i===1?shared.cyan:shared.gold,x+s*0.45,0.52,-1.93);
    }
  }
  // Reuse the three published PALIMPSEST sculptural figures, not token stand-ins.
  // Source: src/engine/drakken/CharacterFigures.ts (source-reference designs).
  const names=['THE SHARD-GOD','WORDSTREAMER','NIALBU'];
  const portraits:THREE.Group[]=[
    buildShardGodFigure(fiber,1.36),
    buildWordstreamerFigure(fiber,1.24),
    preCaptivityNiAlBu(),
  ];
  const scales=[1,1,1.40];
  for(let i=0;i<3;i++){
    const x=(i-1)*2.67;
    const pivot=paperHinge(root,x,-1.93,1.66,1.53,shared.paper);
    const sculpt=portraits[i];
    sculpt.scale.multiplyScalar(scales[i]);
    sculpt.position.set(0,0.25,0.82);
    sculpt.name=['palimpsest-original-tiger','palimpsest-original-wordstreamer','palimpsest-original-nialbu'][i];
    sculpt.userData.source='src/engine/drakken/CharacterFigures.ts';
    sculpt.userData.visualScope='existing editorial papercraft; not new canon approval';
    addInkedContours(sculpt);
    pivot.add(sculpt);
    authoredFigureCount++;
    const detail=new THREE.Group();pivot.add(detail);detail.visible=false;
    for(let j=0;j<5;j++){
      slab(detail,0.024,0.02,0.22,shared.brass,-0.38+j*0.19,0.095,0.45);
      slab(detail,0.08,0.022,0.015,shared.cyan,-0.38+j*0.19,0.106,0.57);
    }
    f01DetailMarks.push(detail);
    paperHinges.push(pivot);
    platform(root,x,0.50,1.68);
    plaque(root,names[i],x,0.396,0.94,1.60);
  }
  plaque(root,'BEFORE THE FIRST STARS',0,0.25,2.18,3.7);
  for(const x of [-3.8,3.8])filigree(root,x,0.28,1.95,0.19,shared.gold);
  for(let j=0;j<17;j++){
    slab(root,0.014,0.012,0.25,shared.brass,-3.5+j*0.44,0.268,-0.1);
  }
  // Underside of the Wordstreamer standee: only an intentional miniature inspection can reveal it.
  focusText=inscription(root,['He murdered her.'],0,0.51,0.12,1.85);
  secretTarget=new THREE.Vector3(0,0.51,0.12);
}
function spiralInstances(group:THREE.Group,count:number,rad:number,depth:number,start:number,material:THREE.Material):void {
  const g=new THREE.TetrahedronGeometry(0.033,0);
  const m=new THREE.InstancedMesh(g,material,count);
  const dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){
    const f=(i+0.5)/count;
    const arm=(i%4)*Math.PI/2;
    const a=f*12.2+arm;
    const rr=0.16+Math.sqrt(f)*rad;
    const jitter=Math.sin((i+start)*7.19)*0.15;
    dummy.position.set(Math.cos(a)*rr+Math.sin(i*13.7)*0.14,
      0.30+Math.cos((i+start)*4.17)*depth,
      0.75+Math.sin(a)*rr*0.50+jitter);
    const s=(i%17===0?2.1:0.68)+((i%5)*0.12);
    dummy.scale.setScalar(s);dummy.rotation.set(i*0.07,i*0.11,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
  }
  m.instanceMatrix.needsUpdate=true;group.add(m);
}
/**
 * The All exists as paper: four suspended die-cut spiral ribbons, each physically
 * raised from a V-fold at the rear of the open book. Editorial sculpture, not a
 * claim that the universe has four arms or that Zentrum is its geometric center.
 */
function buildAllPaperLoom(root: THREE.Object3D): THREE.Group {
  const loom = new THREE.Group();
  loom.position.set(0,0.24,-1.92);
  root.add(loom);
  const colors = [shared.bone, shared.cyan, shared.backing, shared.gold];
  for (let arm=0;arm<4;arm++) {
    const vertices:number[]=[];
    const indices:number[]=[];
    const edgePath:THREE.Vector3[]=[];
    const sections=86;
    for (let j=0;j<=sections;j++) {
      const t=j/sections;
      const a=arm*Math.PI/2+t*Math.PI*2.85;
      const radius=0.15+2.94*Math.pow(t,0.80);
      const x=Math.cos(a)*radius;
      const z=Math.sin(a)*radius*0.45;
      const y=0.13+2.15*t;
      const width=0.018+0.085*t;
      vertices.push(x-width,y,z,x+width,y,z);
      edgePath.push(new THREE.Vector3(x+width,y+0.012,z));
      if(j<sections) {
        const q=2*j;
        indices.push(q,q+1,q+2,q+1,q+3,q+2);
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const strip=put(loom,geometry,colors[arm]);strip.receiveShadow=true;
    const curve=new THREE.CatmullRomCurve3(edgePath);
    put(loom,new THREE.TubeGeometry(curve,116,0.009,3,false),arm%2?shared.gold:shared.cyan);
    // Tiny registration diamonds printed on the rising cardstock, not new star bodies.
    for(let j=9;j<84;j+=15){
      const v=edgePath[j];
      const marker=put(loom,new THREE.OctahedronGeometry(0.045+j*0.00055,0),shared.bone,v.x,v.y+0.04,v.z);
      marker.rotation.z=j*0.09;
    }
  }
  // Physical rear fold feet connect the rising star-lace to the actual manuscript.
  for(let i=0;i<7;i++){
    const x=-3.3+i*1.1;
    slab(loom,0.15,0.03,0.90,shared.backing,x,0.12,-0.18);
    slab(loom,0.11,0.035,0.55,shared.gold,x,0.19,-0.48).rotation.x=-0.42;
  }
  loom.scale.y=0.001;
  loom.visible=false;
  return loom;
}

function buildF02():void {
  const root=book();
  const frame=cutArch(root,0,-2.66,7.85,2.0,shared.navy);
  for(let j=0;j<9;j++){
    const x=-3.48+j*0.87;
    slab(frame,0.055,0.34+Math.abs(4-j)*0.052,0.032,shared.gold,x,0.31,-0.065);
  }
  const back=paperHinge(root,0,-2.41,8.35,3.15,shared.blue);
  back.rotation.x=-0.02;paperHinges.push(back);
  // Distinct cardstock layers: they unfold only when A, B, C are activated.
  for(const [stage,number,radius,depth] of [[1,110,1.7,0.26],[2,230,2.55,0.43],[3,430,3.72,0.63]] as const){
    const leaf=paperHinge(root,0,-2.20-stage*0.02,8.05-stage*0.20,3.03,stage===3?shared.ink:shared.blue);
    leaf.rotation.x=0;
    leaf.visible=false;
    const galaxy=new THREE.Group();leaf.add(galaxy);
    spiralInstances(galaxy,number,radius,depth,stage*37,shared.cyan);
    spiralInstances(galaxy,Math.round(number*0.28),radius*0.96,depth*0.92,stage*49,shared.bone);
    // Die-cut orbital engravings and nested arch brace, revealed with this fold.
    for(let i=0;i<2;i++){
      const orbit=ring(galaxy,radius*(0.30+i*0.16),0.013,shared.gold,0,0.34,0.75);
      orbit.rotation.z=i*0.18;
    }
    for(let j=0;j<3;j++){
      const a=j*Math.PI*2/3;
      const support=slab(galaxy,0.04,0.03,radius*0.46,shared.backing,Math.cos(a)*radius*0.34,0.28,0.75+Math.sin(a)*radius*0.21);
      support.rotation.y=-a;
    }
    if(stage>=2){
      const orbit=put(galaxy,new THREE.RingGeometry(radius*0.42,radius*0.44,96),shared.brass,0,0.30,0.75);
      orbit.rotation.x=-Math.PI/2;
    }
    galaxyLayers.push({group:leaf,stage});
  }
  galaxyPaperLoom=buildAllPaperLoom(root);
  // An architectural landmark, intentionally not placed at the literal center of all space.
  platform(root,-2.30,0.55,1.79);
  for(const r of [0.29,0.48,0.63]){const g=ring(root,r,0.018,shared.brass,-2.30,0.83,0.27);g.rotation.z=r*0.65;}
  plaque(root,'ZENTRUM',-2.30,0.41,1.07,1.52);
  platform(root,2.27,0.55,1.86);
  const geode=new THREE.Group();geode.position.set(2.27,0.54,0.24);root.add(geode);
  // The source-authored NiAlBu-in-Geode sculpture is preserved, including its open
  // cutaway, inverted captive, four copper rings, and cyan fissures. No substitute cage.
  const originalGeode=buildNiAlBuGeode(fiber,1.32);
  originalGeode.name='palimpsest-original-nialbu-geode';
  originalGeode.userData.source='src/engine/drakken/CharacterFigures.ts';
  originalGeode.userData.visualScope='original author-built PALIMPSEST interpretation';
  addInkedContours(originalGeode);
  geode.add(originalGeode);
  authoredFigureCount++;
  plaque(root,'DIGITAL GEODE',2.27,0.41,1.14,1.90);
  plaque(root,'THE ALL UNFOLDS',0,0.25,2.17,3.15);
  for(const x of [-3.68,3.68])filigree(root,x,0.29,2.10,0.20,shared.gold);
  for(let j=0;j<7;j++){
    const ang=j*Math.PI/3.5;
    const ix=-2.30+Math.cos(ang)*0.65;
    const iz=0.27+Math.sin(ang)*0.54;
    slab(root,0.032,0.025,0.14,shared.bone,ix,0.39,iz).rotation.y=ang;
  }
  // Interior backplate, never shown by exterior/proximity alone.
  focusText=inscription(geode,['NiAlBu still watches her die.','Again and again.'],0,0.44,-0.17,1.13);
  secretTarget=new THREE.Vector3(2.27,0.98,0.07);
}
function buildF03():void {
  const root=book();
  const arch=cutArch(root,0,-2.54,7.86,1.75,shared.navy);
  for(let j=0;j<14;j++){
    const x=-3.45+j*0.53;
    slab(arch,0.017,0.34+(j%3)*0.12,0.019,j%3===0?shared.cyan:shared.gold,x,0.35,0.04);
  }
  plaque(root,'THE NOTEBOOK PROGRAM',0,0.25,2.14,3.85);
  const vault=paperHinge(root,-2.72,-1.89,2.25,2.52,shared.blue);paperHinges.push(vault);vaultLeaf=vault;
  for(let i=0;i<5;i++){
    const leaf=slab(vault,1.62-i*0.16,0.024,1.12-i*0.08,i%2?shared.backing:shared.paper,0,0.32+i*0.08,1.02);
    leaf.rotation.z=(i-2)*0.12;
    for(let p=0;p<3;p++){
      slab(vault,0.025,0.014,0.65,shared.gold,-0.42+p*0.42,0.348+i*0.08,0.9);
      slab(vault,0.10,0.018,0.18,shared.cyan,-0.42+p*0.42,0.360+i*0.08,1.0);
    }
    for(let k=0;k<3;k++){
      const register=put(vault,new THREE.CircleGeometry(0.045,7),shared.blue,-0.56+k*0.56,0.365+i*0.08,0.63);
      register.rotation.x=-Math.PI/2;
    }
  }
  plaque(root,"WORLD'S VAULT",-2.72,0.35,0.94,2.03);
  sourceWheel=new THREE.Group();root.add(sourceWheel);sourceWheel.position.set(0,0.43,-0.15);
  put(sourceWheel,new THREE.CylinderGeometry(0.85,0.92,0.17,14),shared.brass,0,0,0);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    slab(sourceWheel,0.10,0.12,0.30,shared.ink,Math.cos(a)*0.83,0.06,Math.sin(a)*0.83);
  }
  for(const radius of [0.48,0.66])ring(sourceWheel,radius,0.024,shared.blue,0,0.15,0);
  const axle=put(sourceWheel,new THREE.CylinderGeometry(0.15,0.18,0.32,10),shared.navy,0,0.18,0);
  axle.castShadow=true;
  for(let j=0;j<9;j++){
    const a=(j/9)*Math.PI*2;
    slab(sourceWheel,0.035,0.018,0.13,shared.bone,Math.sin(a)*0.64,0.185,Math.cos(a)*0.64).rotation.y=a;
  }
  // A visible print die makes source-to-world inheritance tangible. Its movement is
  // an educational analogy only: not a newly declared canonical Notebook mechanism.
  programDie=new THREE.Group();programDie.position.set(0,0.51,-0.15);root.add(programDie);
  const dieStem=put(programDie,new THREE.CylinderGeometry(0.13,0.17,0.43,10),shared.navy,0,0.39,0);
  dieStem.castShadow=true;
  slab(programDie,0.58,0.06,0.58,shared.bone,0,0.17,0);
  for(const edge of [-0.25,0.25])slab(programDie,0.04,0.045,0.58,shared.gold,edge,0.215,0);
  plaque(programDie,'SOURCE',0,0.236,0,0.40,true);
  const loom=paperHinge(root,0,-1.65,1.94,1.98,shared.paper);paperHinges.push(loom);
  plaque(root,'TEMPLATES TO WORLDS',0,0.34,1.15,2.30);
  planets=new THREE.Group();root.add(planets);
  redrawPlanets();
  plaque(root,'CONTROLLED VARIATION',2.68,0.25,1.40,2.30);
  for(const x of [-3.95,3.95])filigree(root,x,0.26,2.09,0.15,shared.gold);
  // Three folded transmission bands show a shared inherited source, not spontaneous creation.
  for(let i=0;i<3;i++){
    const destX=1.63+i*1.06;
    const ribbon=new THREE.Group();ribbon.position.set(0.70,0.29,-0.16+i*0.17);root.add(ribbon);
    const points=[new THREE.Vector3(0,0,0),new THREE.Vector3(0.42,0.36,0.08),new THREE.Vector3(destX-0.83,0.10,0.03),new THREE.Vector3(destX-0.70,0.01,0.03)];
    const curve=new THREE.CatmullRomCurve3(points);
    put(ribbon,new THREE.TubeGeometry(curve,26,0.012,3,false),i===1?shared.cyan:shared.brass);
    for(let k=0;k<3;k++){
      const point=curve.getPoint((k+1)/4);
      const tab=slab(ribbon,0.09,0.024,0.13,shared.paper,point.x,point.y,point.z);
      tab.rotation.z=-0.31;
    }
  }
  // Folded compiler guide rails connect the archived source to the resulting models.
  for(const z of [-0.74,0.23]){
    slab(root,2.16,0.035,0.044,shared.gold,0.65,0.28,z);
    for(let x=0.0;x<=1.7;x+=0.34)slab(root,0.06,0.023,0.09,shared.blue,x,0.307,z);
  }
  // F03 maker testimony, the exact words, location and public Vault lock remain OPEN.
}
function redrawPlanets():void {
  if(!planets)return;
  disposeSubtree(planets);planets.clear();
  for(let i=0;i<3;i++){
    const pat=planetPattern(state.f03.template,state.f03.generation+i);
    const px=1.63+i*1.06,py=0.72,pz=-0.38+(i%2)*0.45;
    slab(planets,0.76,0.036,0.77,shared.backing,px,0.27,pz);
    // Identical four-square ink impressions identify their finite source family
    // while each generated world remains visibly different. This is a book
    // illustration of inheritance, not new canonical planetary anatomy.
    const marks=sourceInkRegistration(state.f03.template);
    const imprint=new THREE.Group();imprint.name='source-ink-registration';
    imprint.userData.family=state.f03.template;
    imprint.userData.mark=marks.join('');
    imprint.position.set(px,0.296,pz+0.276);
    for(let bit=0;bit<4;bit++){
      const paint=marks[bit]===1?registrationInk:shared.paper;
      const stamp=slab(imprint,0.104,0.007,0.104,paint,-0.166+bit*0.11,0,0);
      stamp.name='ink-bit-'+bit;
    }
    planets.add(imprint);
    const surface=new THREE.MeshStandardMaterial({color:pat.hull,roughness:0.81,flatShading:true,bumpMap:fiber,bumpScale:0.004});
    const globe=put(planets,new THREE.SphereGeometry(0.32,pat.facet,Math.max(6,pat.facet-2)),surface,px,py,pz);
    globe.rotation.z=pat.tilt;globe.rotation.y=pat.seamAngle;
    const land=new THREE.MeshStandardMaterial({color:0xa3b5a0,roughness:0.88,side:THREE.DoubleSide,bumpMap:fiber,bumpScale:0.005});
    for(let patchIndex=0;patchIndex<2;patchIndex++){
      const a=pat.seamAngle+patchIndex*2.25;
      const w=0.08+(1-pat.oceanShare)*0.18;
      const patch=put(planets,new THREE.IcosahedronGeometry(w,0),land,px+Math.cos(a)*0.13,py+0.22+patchIndex*0.01,pz+Math.sin(a)*0.13);
      patch.scale.set(1.1+0.18*patchIndex,0.28,0.93);
      patch.rotation.y=a;
    }
    // Longitude rings are drafting instruments, not claims about the planet's actual atmosphere.
    for(const radius of [0.385,0.42]){
      const track=ring(planets,radius,0.008,shared.gold,px,py,pz);
      track.rotation.z=pat.tilt+radius*2;
    }
    for(let p=0;p<pat.bandCount;p++){
      const ribbon=put(planets,new THREE.TorusGeometry(0.29,0.019+pat.oceanShare*0.008,4,24),p%2?shared.brass:land,px,py,pz);
      ribbon.rotation.set(p*0.27+pat.tilt,pat.seamAngle+p*0.45,0.19+p*0.12);
    }
  }
  // The three generated families receive the same authored ink treatment as
  // the figures: matte source-derived cel colors and high-angle contour lines.
  addInkedContours(planets);
}
function disposeSubtree(root:THREE.Object3D):void {
  root.traverse(obj=>{
    const child=obj as THREE.Mesh;
    if(child.geometry)child.geometry.dispose();
    if(child.material){
      const materials=Array.isArray(child.material)?child.material:[child.material];
      for(const mat of materials)if(!sharedMats.includes(mat))mat.dispose();
    }
  });
}
function clear():void {
  if(inspection!=='overview')leaveMini();
  if (laterWorld) {
    rig.remove(laterWorld.root);
    laterWorld.dispose();
    laterWorld = null;
  }
  disposeSubtree(rig);
  for(const texture of textTextures)texture.dispose();
  textTextures=[];rig.clear();
  focusText=null;secretTarget=null;paperHinges=[];f01DetailMarks=[];galaxyLayers=[];galaxyPaperLoom=null;vaultLeaf=null;sourceWheel=null;programDie=null;printPulse=0;planets=null;
  discovered=false;
}
function updateNav():void {
  if (currentFolio >= FIRST_LATER_FOLIO) {
    const index=currentFolio as LaterFolioIndex;
    const copy=getLaterCopy(index);
    const study=laterStates[index-FIRST_LATER_FOLIO];
    progress.textContent=`F${String(index+1).padStart(2,'0')} / F12`;
    document.querySelectorAll('.chapter-lines span').forEach((line,i)=>line.classList.toggle('active',i<=Math.min(2,Math.floor(index/4))));
    prevButton.disabled=false;
    nextButton.disabled=index===11;
    nextButton.textContent=index===11?'Final Folio':'Next →';
    title.textContent=copy.title;
    description.textContent=copy.description;
    for(const btn of actionButtons){
      const slot=btn.dataset.mechanism as Slot;
      const idx=slot==='A'?0:slot==='B'?1:2;
      btn.textContent=`${slot} · ${copy.actions[idx]}`;
      btn.setAttribute('aria-label',`${slot}: ${copy.actions[idx]}`);
      btn.setAttribute('aria-pressed',String(study.interactions[slot].active));
      btn.disabled=study.interactions[slot].locked;
    }
    const states=(['A','B','C'] as const).map(slot=>{
      const item=study.interactions[slot];
      return `${slot}: ${item.locked?'fixed':item.active?'operated':'resting'}${item.maxSteps>1?` (${item.step}/${item.maxSteps})`:''}`;
    });
    indicator.textContent=states.join(' · ');
    setWitnessButton();return;
  }
  for(const btn of actionButtons)btn.disabled=false;
  progress.textContent=`F0${state.folio+1} / F12`;
  document.querySelectorAll('.chapter-lines span').forEach((line,i)=>line.classList.toggle('active',i<=state.folio));
  prevButton.disabled=state.folio===0;
  nextButton.disabled=false;
  nextButton.textContent=state.folio===2 ? 'F04 →' : 'Next →';
  title.textContent=titleCopy[state.folio];
  description.textContent=overviewCopy[state.folio];
  for(const btn of actionButtons){
    const slot=btn.dataset.mechanism as Slot;
    const idx=slot==='A'?0:slot==='B'?1:2;
    btn.textContent=`${slot} · ${actionCopy[state.folio][idx]}`;
    btn.setAttribute('aria-label',`${slot}: ${actionCopy[state.folio][idx]}`);
    const on=state.folio===0?Boolean(state.f01[slot==='A'?'fold':slot==='B'?'detail':'compare']):
      state.folio===1?state.f02.reveal>=(idx+1):
      slot==='A'?state.f03.vaultOpen:slot==='B'?state.f03.template>0:state.f03.generation>0;
    btn.setAttribute('aria-pressed',String(on));
  }
  setWitnessButton();
  indicator.textContent=state.folio===1?`Stellar assembly: ${state.f02.reveal} / 3 stages`:
    state.folio===2?`Source plate: ${state.f03.template+1} / 3  ·  Ink register: ${sourceInkRegistration(state.f03.template).join('')}  ·  Variation: ${state.f03.generation}`:
    `Physical folds: ${state.f01.fold?'opened':'closed'}  ·  Details: ${state.f01.detail?'shown':'folded'}`;
}
function goFolio(index:number):void {
  if(!isLivingIndex(index))return;
  clear();authoredFigureCount=0;currentFolio=index;activeTime=0;
  if(index<FIRST_LATER_FOLIO){
    state=studyStates[index as FolioIndex];
    if(index===0)buildF01();else if(index===1)buildF02();else buildF03();
  } else if(renderer){
    book();
    if(!paperShadow)paperShadow=makeContactShadow();
    const laterIndex=index as LaterFolioIndex;
    laterWorld=createLaterFolio(laterIndex,fiber,paperShadow,laterStates[laterIndex-FIRST_LATER_FOLIO]);
    rig.add(laterWorld.root);
  }
  resetCamera();updateNav();
  canvas.dataset.authoredSculptures=String(authoredFigureCount);
  canvas.dataset.sourceAuthoredScene=String(index>=FIRST_LATER_FOLIO);
  announce(`Folio ${index+1} of 12. ${index<3?(overviewCopy as readonly string[])[index]:getLaterCopy(index as LaterFolioIndex).description}`);
  sendBridge('folio',index);
}
function smooth(value:number,target:number,dt:number):number {
  return reducedMotion?target:THREE.MathUtils.damp(value,target,5.8,Math.min(dt,0.07));
}
function animate(dt:number):void {
  if(currentFolio>=FIRST_LATER_FOLIO){
    activeTime+=dt;
    laterWorld?.update(dt,activeTime,reducedMotion);
    return;
  }
  if(state.folio===0){
    f01DetailMarks.forEach(mark=>{mark.visible=state.f01.detail;});
    paperHinges.forEach((hinge,i)=>{
      const rise=state.f01.fold?-(i===1?0.94:0.79):-0.03;
      hinge.rotation.x=smooth(hinge.rotation.x,rise,dt);
      hinge.rotation.y=smooth(hinge.rotation.y,state.f01.compare?(i-1)*0.10:0,dt);
    });
  } else if(state.folio===1){
    for(const {group,stage} of galaxyLayers){
      const open=state.f02.reveal>=stage;
      if(open)group.visible=true;
      group.rotation.x=smooth(group.rotation.x,open?(-0.40-(stage*0.16)):0,dt);
      group.scale.y=smooth(group.scale.y,open?1:0.001,dt);
      if(!open&&group.scale.y<0.02)group.visible=false;
    }
    if(galaxyPaperLoom){
      const expanded=state.f02.reveal===3;
      if(expanded)galaxyPaperLoom.visible=true;
      galaxyPaperLoom.scale.y=smooth(galaxyPaperLoom.scale.y,expanded?1:0.001,dt);
      if(!expanded&&galaxyPaperLoom.scale.y<0.018)galaxyPaperLoom.visible=false;
    }
    if(paperHinges[0])paperHinges[0].rotation.x=smooth(paperHinges[0].rotation.x,state.f02.reveal>0?-0.24:0,dt);
  } else {
    if(vaultLeaf)vaultLeaf.rotation.x=smooth(vaultLeaf.rotation.x,state.f03.vaultOpen?-0.81:0,dt);
    if(paperHinges[1])paperHinges[1].rotation.x=smooth(paperHinges[1].rotation.x,-0.47,dt);
    if(sourceWheel)sourceWheel.rotation.y=smooth(sourceWheel.rotation.y,-(state.f03.template*Math.PI*2)/3,dt);
    if(programDie){
      const phase=printPulse;
      const displacement=(!reducedMotion&&phase>0)?Math.sin((1-phase)*Math.PI)*0.23:0;
      programDie.position.y=0.51-displacement;
      printPulse=Math.max(0,printPulse-dt/0.82);
    }
  }
}
function handleAction(slot:Slot):void {
  if(currentFolio>=FIRST_LATER_FOLIO){
    if(inspection!=='overview'){announce('Return to the overview before operating a mechanism.');return;}
    const idx=currentFolio-FIRST_LATER_FOLIO;
    const next=operateLater(laterStates[idx],slot);
    laterStates[idx]=next;saveLaterStudy();
    laterWorld?.syncState(next,activeSpecimen(next),activeTime);
    updateNav();
    if(!renderer)fallbackPage(currentFolio);
    announce(`${getLaterCopy(currentFolio as LaterFolioIndex).actions[slot==='A'?0:slot==='B'?1:2]}. ${indicator.textContent}`);
    return;
  }
  if(inspection!=='overview'){
    announce('Return to the book overview before operating a paper mechanism.');return;
  }
  const before=state;state=activateSlot(state,slot);
  studyStates[state.folio]=state;
  saveStudy();
  if(state.folio===2&&(slot==='B'||slot==='C')){
    redrawPlanets();if(slot==='C')printPulse=reducedMotion?0:1;
  }
  updateNav();
  if(state.folio===1)announce(`Stellar assembly now shows stage ${state.f02.reveal} of 3.`);
  else if(state.folio===2)announce(`Source plate ${state.f03.template+1}; bounded variation ${state.f03.generation}.`);
  else announce(`${actionCopy[0][slot==='A'?0:slot==='B'?1:2]}: ${JSON.stringify(state.f01)}.`);
  if(before===state)throw Error('Folio state failed to advance');
}
function resetStudy():void{
  if(inspection!=='overview')leaveMini();
  studyStates=restoreFolioStudy(null);
  laterStates=restoreLaterStudy(null);
  try{sessionStorage.removeItem(STUDY_STORAGE_KEY);sessionStorage.removeItem(LATER_STUDY_STORAGE_KEY);}catch{}
  const current=currentFolio;
  goFolio(current);
  if(!renderer)fallbackPage(current);
  announce('Living folio study reset. The original archive and panel layout are unchanged.');
}
function announce(s:string):void {status.textContent=s;globalAnnouncer.textContent=s;}
function setWitnessButton():void {
  const available=Boolean(renderer && currentFolio===1 && state.f02.reveal===3 && inspection==='overview');
  witnessButton.hidden=!available;
  witnessButton.setAttribute('aria-pressed',String(witnessActive));
  witnessButton.textContent=witnessActive?'Return to the page (G)':'Enter the All (G)';
}
function beginFlight(to: THREE.Vector3, lookTo: THREE.Vector3, destination: 'witness'|'overhead'):void {
  if(!controls)return;
  const from=camera.position.clone();
  const lookFrom=controls.target.clone();
  cameraFlight={from,to,lookFrom,lookTo,elapsed:0,seconds:reducedMotion?0:2.25,destination};
  controls.enabled=false;
  if(reducedMotion)advanceFlight(1);
}
function advanceFlight(dt:number):void {
  if(!cameraFlight || !controls)return;
  const f=cameraFlight;
  f.elapsed=Math.min(f.seconds, f.elapsed+dt);
  const t=f.seconds===0?1:THREE.MathUtils.clamp(f.elapsed/f.seconds,0,1);
  const eased=t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  camera.position.copy(f.from).lerp(f.to,eased);
  controls.target.copy(f.lookFrom).lerp(f.lookTo,eased);
  controls.update();
  if(t>=1){
    const inside=f.destination==='witness';
    controls.minDistance=inside?0.48:1.2;
    controls.maxDistance=inside?9:19;
    controls.maxPolarAngle=inside?Math.PI-0.12:1.51;
    controls.enabled=true;
    cameraFlight=null;
  }
}
function toggleWitness():void {
  if(!renderer||!controls||inspection!=='overview'||state.folio!==1||state.f02.reveal!==3)return;
  if(!witnessActive){
    witnessCamera={position:camera.position.clone(),target:controls.target.clone()};
    witnessActive=true;
    beginFlight(new THREE.Vector3(1.12,1.75,1.05),new THREE.Vector3(0,1.36,-1.83),'witness');
    announce('Entering the paper galaxy. The first stars are held between the folds of the book. Return with G.');
  }else{
    witnessActive=false;
    beginFlight(witnessCamera?.position.clone()??new THREE.Vector3(0,6.5,9.9),witnessCamera?.target.clone()??new THREE.Vector3(0,0.25,0),'overhead');
    witnessCamera=null;
    announce('Returning to the open book.');
  }
  setWitnessButton();
}
function resetCamera():void {
  cameraFlight=null;witnessActive=false;witnessCamera=null;
  if(!controls)return;
  controls.enabled=true;
  camera.position.set(0,6.5,9.9);controls.target.set(0,0.25,0);
  controls.minDistance=1.2;controls.maxDistance=19;controls.maxPolarAngle=1.51;controls.update();
}
function enterMini():void {
  cameraFlight=null;witnessActive=false;witnessCamera=null;
  if(controls)controls.enabled=true;
  inspection='miniature';discovered=false;
  if(focusText)focusText.visible=false;
  if(controls){
    const x=currentFolio===1?2.27:currentFolio===2?-2.6:0;
    camera.position.set(x,0.85,2.15);controls.target.set(x,0.60,0.30);
    controls.minDistance=0.13;controls.maxDistance=4;controls.maxPolarAngle=Math.PI-0.1;
    controls.update();
  }
  miniButton.textContent='Return to overhead view (M)';miniButton.setAttribute('aria-pressed','true');
  document.body.classList.add('miniature');
  announce('Miniature inspection active. Use WASD or touch movement controls; drag to look. I performs close inspection.');
  updateInspectButton();
}
function leaveMini():void {
  inspection='overview';activeMove.clear();discovered=false;
  if(focusText)focusText.visible=false;
  miniButton.textContent='Enter miniature inspection (M)';miniButton.setAttribute('aria-pressed','false');
  document.body.classList.remove('miniature');
  inspectButton.textContent='Inspect (I)';
  resetCamera();updateInspectButton();
}
function toggleMini():void {if(inspection==='overview')enterMini();else leaveMini();}
function gazeTo(target:THREE.Vector3):boolean {
  camera.getWorldDirection(clockDirection);
  cursorToSecret.copy(target).sub(camera.position);
  const len=cursorToSecret.length();
  if(len<0.015)return true;
  return clockDirection.dot(cursorToSecret.divideScalar(len))>0.62;
}
function nearGeode():boolean {
  return state.folio===1&&Math.hypot(camera.position.x-2.27,camera.position.z-0.24)<1.25;
}
function updateInspectButton():void {
  const enabled=inspection!=='overview'&&currentFolio<=1;
  inspectButton.disabled=!enabled;
  if(inspection==='geode')inspectButton.textContent='Leave Geode (I)';
  else if(state.folio===1&&inspection==='miniature')inspectButton.textContent='Enter Geode interior (I)';
  else inspectButton.textContent='Inspect beneath the mechanism (I)';
}
function inspect():void {
  if(inspection==='overview')return;
  if(currentFolio>=FIRST_LATER_FOLIO){announce('No unapproved maker testimony is exposed in this folio.');return;}
  if(!renderer){
    if(state.folio===0){announce('Maker inscription beneath Wordstreamer: He murdered her.');return;}
    if(state.folio===1){
      if(inspection==='miniature'){inspection='geode';updateInspectButton();announce('Inside the Digital Geode. Inspect again to examine the concealed inner inscription.');return;}
      announce('Maker inscription inside the Geode: NiAlBu still watches her die. Again and again.');return;
    }
    announce('The third inscription remains undecided; nothing is disclosed here.');return;
  }
  if(state.folio===1){
    if(inspection==='miniature'){
      if(!nearGeode()){announce('Move closer to the Digital Geode to inspect its interior.');return;}
      inspection='geode';
      camera.position.set(2.27,0.91,0.69);controls?.target.set(2.27,0.96,0.07);controls?.update();
      announce('You are inside the Digital Geode. Look toward the inner plate to inspect. The public lesson is unchanged.');
      updateInspectButton();return;
    }
    if(inspection==='geode'){
      inspection='miniature';if(focusText)focusText.visible=false;
      camera.position.set(2.27,0.94,1.36);controls?.target.set(2.27,0.70,0.28);controls?.update();
      announce('Left the Digital Geode.');updateInspectButton();return;
    }
  }
  if(state.folio===0){
    const target=secretTarget;
    const near=Boolean(target&&camera.position.distanceTo(target)<0.95);
    if(!near){announce('Examine the underside of the Wordstreamer mechanism at miniature scale.');return;}
    if(target){
      camera.position.set(0,0.67,0.74);controls?.target.copy(target);controls?.update();
    }
  }
}
function revealTick():void {
  if(!focusText||!secretTarget)return;
  const isF01=state.folio===0;
  const near=camera.position.distanceTo(secretTarget)<(isF01?1.00:1.13);
  const show=mayReveal(isF01?'f01-testimony':'f02-testimony',state.folio,inspection,near,gazeTo(secretTarget));
  focusText.visible=show;
  if(show&&!discovered){
    discovered=true;
    announce(isF01?'Maker inscription beneath Wordstreamer: He murdered her.':
      'Maker inscription inside the Geode: NiAlBu still watches her die. Again and again.');
  }
}
function moveMini(dt:number):void {
  if(inspection==='overview'||inspection==='geode'||!controls)return;
  const fb=(activeMove.has('w')?1:0)-(activeMove.has('s')?1:0);
  const lr=(activeMove.has('d')?1:0)-(activeMove.has('a')?1:0);
  if(!fb&&!lr)return;
  camera.getWorldDirection(clockDirection);clockDirection.y=0;clockDirection.normalize();
  const side=new THREE.Vector3(-clockDirection.z,0,clockDirection.x);
  const step=clockDirection.multiplyScalar(fb).addScaledVector(side,lr).normalize().multiplyScalar(Math.min(dt,0.05)*1.45);
  camera.position.add(step);controls.target.add(step);
  const limX=4.2,limZ=2.48;
  const cx=THREE.MathUtils.clamp(camera.position.x,-limX,limX);
  const cz=THREE.MathUtils.clamp(camera.position.z,-limZ,limZ);
  controls.target.x+=cx-camera.position.x;controls.target.z+=cz-camera.position.z;
  camera.position.x=cx;camera.position.z=cz;
  camera.position.y=THREE.MathUtils.clamp(camera.position.y,0.38,1.28);
}
function nextFolio(direction:number):void {
  if(inspection!=='overview')leaveMini();
  const next=currentFolio+direction;
  if(!isLivingIndex(next))return;
  goFolio(next);
  if(!renderer)fallbackPage(next);
}
function handleKeys(event:KeyboardEvent):void {
  const target=event.target as HTMLElement;
  const k=event.key.toLowerCase();
  // Escape is a universal exit, including when a movable panel button owns focus.
  if(k==='escape' && witnessActive){toggleWitness();return;}
  if(k==='escape' && inspection!=='overview'){leaveMini();return;}
  if(k==='escape' && bridgeEmbedded){event.preventDefault();sendBridge('exit',currentFolio);return;}
  if(target.closest('button,input,textarea,select,[contenteditable]'))return;
  if(['arrowleft','arrowright','a','b','c','m','i','w','s','d'].includes(k)&&event.target===canvas)event.preventDefault();
  if(event.repeat&&['m','i','arrowleft','arrowright','a','b','c'].includes(k))return;
  if(k==='arrowleft'&&inspection==='overview')nextFolio(-1);
  else if(k==='arrowright'&&inspection==='overview')nextFolio(1);
  else if(k==='m')toggleMini();
  else if(k==='g')toggleWitness();
  else if(k==='i')inspect();
  else if(['a','b','c'].includes(k)&&inspection==='overview')handleAction(k.toUpperCase() as Slot);
  else if(['w','a','s','d'].includes(k)&&inspection!=='overview')activeMove.add(k);
  if(k==='escape'&&inspection!=='overview')leaveMini();
}
function releaseKey(event:KeyboardEvent):void {activeMove.delete(event.key.toLowerCase());}
function onBridgeMessage(event:MessageEvent):void {
  if(!bridgeEmbedded || event.source!==window.parent || event.origin!==window.location.origin)return;
  const message=event.data;
  if(!message || message.channel!=='palimpsest-living' || message.action!=='navigate')return;
  if(typeof message.folio!=='number' || !isLivingIndex(message.folio))return;
  goFolio(message.folio);
  if(!fallback.hidden)fallbackPage(message.folio);
}

function resize():void {
  if(!renderer)return;
  const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
function wireButtons():void {
  prevButton.addEventListener('click',()=>nextFolio(-1));
  nextButton.addEventListener('click',()=>nextFolio(1));
  miniButton.addEventListener('click',toggleMini);
  inspectButton.addEventListener('click',inspect);
  witnessButton.addEventListener('click',toggleWitness);
  resetStudyButton.addEventListener('click',resetStudy);
  for(const b of actionButtons)b.addEventListener('click',()=>handleAction(b.dataset.mechanism as Slot));
  for(const b of moveButtons){
    const dir=b.dataset.move??'';
    b.addEventListener('pointerdown',e=>{if(inspection!=='overview')activeMove.add(dir);b.setPointerCapture(e.pointerId);});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>activeMove.delete(dir));
  }
}
function fallbackPage(index:number):void {
  const isLater=index>=FIRST_LATER_FOLIO;
  const paragraphs=fallback.querySelectorAll<HTMLElement>('[data-folio-text]');
  paragraphs.forEach((p,i)=>p.hidden=isLater||i!==index);
  fallback.querySelectorAll<SVGGElement>('[data-fb-folio]').forEach((g,i)=>{g.style.display=!isLater&&i===index?'':'none';});
  const originalArt=fallback.querySelector<SVGSVGElement>('svg:not(#later-plate-art)');
  if(originalArt)originalArt.toggleAttribute('hidden',isLater);
  const laterArt=fallback.querySelector<SVGSVGElement>('#later-plate-art');
  if(laterArt){
    laterArt.toggleAttribute('hidden',!isLater);
    if(isLater){
      const scene=laterArt.querySelector<SVGGElement>('#later-plate-scene');
      if(scene)scene.innerHTML=getLaterDiagram(index);
    }
  }
  const plate=fallback.querySelector<HTMLElement>('#later-fallback');
  if(plate){
    plate.hidden=!isLater;
    if(isLater){
      const copy=getLaterCopy(index as LaterFolioIndex);
      const heading=plate.querySelector<HTMLElement>('[data-later-heading]');
      const summary=plate.querySelector<HTMLElement>('[data-later-summary]');
      const cues=plate.querySelector<HTMLElement>('[data-later-cues]');
      if(heading)heading.textContent=copy.title;
      if(summary)summary.textContent=copy.description;
      if(cues)cues.replaceChildren(...copy.visuals.map((cue,i)=>{
        const p=document.createElement('p');
        p.textContent=`${['I','II','III','IV'][i]??'·'} · ${cue}`;
        return p;
      }));
    }
  }
  if(index===1&&state.f02.reveal===0)indicator.textContent='No stars yet. Activate A to unfold the first points.';
}
function destroy():void {
  cancelAnimationFrame(frame);
  window.removeEventListener('keydown',handleKeys);
  window.removeEventListener('keyup',releaseKey);
  window.removeEventListener('resize',resize);
  window.removeEventListener('message',onBridgeMessage);
  clear();controls?.dispose();renderer?.dispose();sharedMats.forEach(m=>m.dispose());fiber.dispose();paperShadow?.dispose();
}
wireButtons();
window.addEventListener('message',onBridgeMessage);
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.48;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  keyLight.castShadow=true;
  keyLight.shadow.mapSize.set(1024,1024);
  keyLight.shadow.camera.left=-8;keyLight.shadow.camera.right=8;
  keyLight.shadow.camera.top=7;keyLight.shadow.camera.bottom=-7;
  keyLight.shadow.normalBias=0.024;
  controls=new OrbitControls(camera,canvas);
  controls.enableDamping=!reducedMotion;controls.enablePan=true;
  controls.panSpeed=0.58;controls.screenSpacePanning=true;
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
  controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
  canvas.addEventListener('pointerdown',(event)=>{if(controls)controls.mouseButtons.LEFT=event.shiftKey?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;},{capture:true});
  controls.minDistance=1.2;controls.maxDistance=19;
  controls.maxPolarAngle=1.51;
  window.addEventListener('keydown',handleKeys);
  window.addEventListener('keyup',releaseKey);
  window.addEventListener('resize',resize);
  window.addEventListener('pagehide',destroy,{once:true});
  goFolio(initialFolio);resize();updateInspectButton();
  function step(now:number):void {
    const dt=lastTime?Math.min(0.06,(now-lastTime)/1000):0;
    lastTime=now;
    animate(dt);moveMini(dt);advanceFlight(dt);revealTick();controls?.update();renderer?.render(scene,camera);
    frame=requestAnimationFrame(step);
  }
  frame=requestAnimationFrame(step);
}catch(error){
  console.error('PALIMPSEST preview: WebGL unavailable',error);
  canvas.hidden=true;fallback.hidden=false;
  // The fallback remains an editorial, interactive read-only review; it has no automatic secret disclosure.
  window.addEventListener('keydown',handleKeys);
  window.addEventListener('keyup',releaseKey);
  goFolio(initialFolio);fallbackPage(initialFolio);
  for(const button of actionButtons)button.addEventListener('click',()=>fallbackPage(currentFolio));
  prevButton.addEventListener('click',()=>fallbackPage(currentFolio));
  nextButton.addEventListener('click',()=>fallbackPage(currentFolio));
}
