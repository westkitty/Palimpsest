import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * PALIMPSEST F01-F03: isolated, UNNARRATED review prototype.
 * This file does not amend canon, the manuscript, official narration, or the active folio renderer.
 * Source: production/folio_vnext/F01_F03_DIRECTION_AND_DELTA.md
 * All figure marks here are schematic editorial placeholders, NOT canonical character models.
 */
type FolioIndex = 0 | 1 | 2;
type HiddenMark = { target: THREE.Vector3; mesh: THREE.Mesh; exactText: string };
const host = document.querySelector<HTMLCanvasElement>('#stage');
const screen = document.querySelector<HTMLElement>('#screen-reader-status');
const heading = document.querySelector<HTMLElement>('#folio-title');
const description = document.querySelector<HTMLElement>('#folio-description');
const prev = document.querySelector<HTMLButtonElement>('#prev');
const next = document.querySelector<HTMLButtonElement>('#next');
const miniButton = document.querySelector<HTMLButtonElement>('#mini');
const fallback = document.querySelector<HTMLElement>('#webgl-fallback');
if (!host || !screen || !heading || !description || !prev || !next || !miniButton || !fallback) {
  throw new Error('PALIMPSEST review controls missing');
}
const canvas = host;
const statusElement = screen;
const titleElement = heading;
const descriptionElement = description;
const prevButton = prev;
const nextButton = next;
const miniControl = miniButton;
const fallbackElement = fallback;

const titles = [
  'I — Before the Stars',
  'II — The All Unfolds',
  'III — The Notebook Program',
] as const;
const descriptions = [
  'A starless paper tableau of the primordial three. Figures are schematic placeholders, not approved model sheets.',
  'The first stars rise from hinged leaves. Zentrum and the Digital Geode are separate inspectable features.',
  'Stored planetary templates feed a repeatable generator. Three family-related worlds show bounded variation.',
] as const;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10141e);
const camera = new THREE.PerspectiveCamera(47, 1, 0.02, 90);
camera.position.set(0, 6.4, 9.5);
const keyState = new Set<string>();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAGE_WIDTH = 8.6;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let frame = 0;
let current: FolioIndex = 0;
let miniature = false;
let marks: HiddenMark[] = [];
let temporaryTextures: THREE.Texture[] = [];
const stage = new THREE.Group();
scene.add(stage);
const light = new THREE.DirectionalLight(0xfff0d4, 3.0);
light.position.set(-4, 9, 6);
scene.add(light, new THREE.AmbientLight(0x8ba4c8, 1.5));

const paper = new THREE.MeshStandardMaterial({color:0xf0e6d1, roughness:0.95, side:THREE.DoubleSide});
const deepPaper = new THREE.MeshStandardMaterial({color:0xb6a993, roughness:0.95, side:THREE.DoubleSide});
const obsidian = new THREE.MeshStandardMaterial({color:0x181a26, roughness:0.72});
const indigo = new THREE.MeshStandardMaterial({color:0x344363, roughness:0.84});
const lavender = new THREE.MeshStandardMaterial({color:0x8779a7, roughness:0.8});
const azure = new THREE.MeshStandardMaterial({color:0x6cdaf3, emissive:0x126680, emissiveIntensity:0.55});
const brass = new THREE.MeshStandardMaterial({color:0xb99a56, roughness:0.48, metalness:0.38});
const forest = new THREE.MeshStandardMaterial({color:0x496d6b, roughness:0.85});
const darkPage = new THREE.MeshStandardMaterial({color:0x263242, roughness:0.86, side:THREE.DoubleSide});
const sharedMaterials: THREE.Material[] = [paper,deepPaper,obsidian,indigo,lavender,azure,brass,forest,darkPage];

function mesh(parent: THREE.Object3D, shape: THREE.BufferGeometry, material: THREE.Material, x=0, y=0, z=0): THREE.Mesh {
  const object = new THREE.Mesh(shape, material);
  object.position.set(x,y,z);
  parent.add(object);
  return object;
}
function box(parent: THREE.Object3D, width: number, height: number, depth: number, material: THREE.Material, x=0, y=0, z=0): THREE.Mesh {
  return mesh(parent, new THREE.BoxGeometry(width,height,depth), material, x,y,z);
}
function label(parent: THREE.Object3D, content: string, width: number, x: number, y: number, z: number, ink='#242a35', fill='#f1e7d3'): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 184;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas text unavailable');
  ctx.fillStyle=fill; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle=ink; ctx.lineWidth=7; ctx.strokeRect(12,12,1000,160);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='bold 42px Georgia, serif'; ctx.fillStyle=ink;
  ctx.fillText(content,512,92,970);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace=THREE.SRGBColorSpace;
  temporaryTextures.push(texture);
  const material = new THREE.MeshBasicMaterial({map:texture, transparent:false, side:THREE.DoubleSide});
  const plaque=mesh(parent,new THREE.PlaneGeometry(width,width*184/1024),material,x,y,z);
  plaque.rotation.x=-Math.PI/2;
  return plaque;
}
function secret(parent: THREE.Object3D, text: string, x: number, y: number, z: number, width=2.8): void {
  const c=document.createElement('canvas'); c.width=1024;c.height=320;
  const ctx=c.getContext('2d');
  if (!ctx) throw new Error('Canvas text unavailable');
  ctx.clearRect(0,0,1024,320);
  ctx.fillStyle='rgba(14,33,53,0.89)';ctx.fillRect(16,35,992,250);
  ctx.strokeStyle='#6ce7ff';ctx.lineWidth=6;ctx.strokeRect(16,35,992,250);
  ctx.font='bold 46px Georgia, serif';ctx.textAlign='center';ctx.fillStyle='#91eaff';
  if (text.includes('Again and again.')) {
    ctx.fillText('NiAlBu still watches her die.',512,140,925);
    ctx.fillText('Again and again.',512,210,925);
  } else {
    ctx.fillText(text,512,174,925);
  }
  const texture=new THREE.CanvasTexture(c);
  texture.colorSpace=THREE.SRGBColorSpace; temporaryTextures.push(texture);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const visible=mesh(parent,new THREE.PlaneGeometry(width,width*320/1024),material,x,y,z);
  visible.rotation.x=-Math.PI/2; visible.visible=false;
  marks.push({target:new THREE.Vector3(x,y,z),mesh:visible,exactText:text});
}
function hinge(parent: THREE.Object3D, x: number, z: number, width: number, depth: number, angle: number, mat=paper): THREE.Group {
  const pivot=new THREE.Group();pivot.position.set(x,0.17,z);parent.add(pivot);
  box(pivot,width,0.045,depth,mat,0,0,depth/2);
  pivot.rotation.x=angle;
  box(parent,width+0.05,0.045,0.08,brass,x,0.17,z);
  return pivot;
}
function book(): THREE.Group {
  const spread=new THREE.Group();stage.add(spread);
  box(spread,PAGE_WIDTH,0.19,5.6,obsidian,0,-0.09,0);
  box(spread,4.12,0.095,5.15,paper,-2.11,0.06,0);
  box(spread,4.12,0.095,5.15,paper,2.11,0.06,0);
  box(spread,0.14,0.13,5.3,brass,0,0.13,0);
  for(const edge of [-4.12,4.12])box(spread,0.06,0.08,5.15,deepPaper,edge,0.13,0);
  return spread;
}
function plinth(parent:THREE.Object3D,x:number,z:number):void {
  box(parent,1.72,0.11,1.12,deepPaper,x,0.15,z);
  box(parent,1.50,0.09,0.94,paper,x,0.24,z);
}
function firstFolio():void {
  const root=book();
  // Pre-stellar paper sky: no celestial mesh, pinprick points, or stellar sky texture.
  box(root,7.30,0.055,2.00,darkPage,0,0.18,-1.05);
  const left=hinge(root,-2.62,-1.75,1.86,1.35,-0.79);
  const center=hinge(root,0,-1.75,1.86,1.35,-0.92);
  const right=hinge(root,2.62,-1.75,1.86,1.35,-0.79);
  for(const [group,mat] of [[left,obsidian],[center,lavender],[right,indigo]] as const){
    mesh(group,new THREE.CylinderGeometry(0.26,0.44,0.72,5),mat,0,0.47,0.70);
    mesh(group,new THREE.IcosahedronGeometry(0.25,0),mat,0,0.90,0.70);
  }
  // Character effigies are deliberately schematic; they are not new canonical anatomy.
  box(left,0.12,0.55,0.09,azure,-0.20,0.62,0.75);
  box(center,0.045,0.62,0.06,azure,0.27,0.55,0.78);
  for(const x of [-0.17,0.17])box(right,0.05,0.5,0.08,azure,x,0.62,0.77);
  plinth(root,-2.62,0.42);plinth(root,0,0.42);plinth(root,2.62,0.42);
  label(root,'THE SHARD-GOD',1.62,-2.62,0.31,0.53);
  label(root,'WORDSTREAMER',1.62,0,0.31,0.53);
  label(root,'NIALBU',1.62,2.62,0.31,0.53);
  label(root,'BEFORE THE FIRST STARS',3.6,0,0.21,1.95);
  // Concealed underside testimony: only near in miniature mode, not a reward.
  secret(root,'He murdered her.',0,0.168,-0.10,2.4);
}
function secondFolio():void {
  const root=book();
  // The FIRST stellar creation is here, deliberately not in F01.
  const fan=hinge(root,0,-1.88,7.6,2.65,-0.59,darkPage);
  const stars=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.038,0),azure,220);
  const dummy=new THREE.Object3D();
  for(let i=0;i<220;i++){
    const a=i*2.39996322973, r=0.11+Math.sqrt((i+1)/220)*3.25;
    dummy.position.set(Math.cos(a)*r,0.17+((i*7)%13)/45,0.50+Math.sin(a)*r*0.35);
    const s=(i%12===0?1.8:0.72)+(i%5)*0.08;
    dummy.scale.setScalar(s);dummy.updateMatrix();stars.setMatrixAt(i,dummy.matrix);
  }
  stars.instanceMatrix.needsUpdate=true;fan.add(stars);
  const cx=-2.05,cz=0.62;
  plinth(root,cx,cz);
  for(const rad of [0.28,0.44]){
    const ring=mesh(root,new THREE.TorusGeometry(rad,0.028,6,26),brass,cx,0.75,cz);
    ring.rotation.x=Math.PI/2.4;
  }
  label(root,'ZENTRUM',1.52,cx,0.31,cz+0.04);
  // Visually prominent landmark; not asserted to be the geometric center of all space.
  const gx=2.2,gz=0.31;
  plinth(root,gx,gz);
  mesh(root,new THREE.DodecahedronGeometry(0.43,0),indigo,gx,0.76,gz);
  const cap=mesh(root,new THREE.OctahedronGeometry(0.25,0),obsidian,gx,0.84,gz);
  cap.rotation.z=0.2;
  label(root,'DIGITAL GEODE',1.65,gx,0.32,gz+0.68);
  label(root,'THE ALL UNFOLDS',3.2,0,0.22,2.05);
  // Text is in the miniature inspection area of the Geode; no murder replay.
  secret(root,'NiAlBu still watches her die. Again and again.',gx,0.335,gz-0.25,2.65);
}
function thirdFolio():void {
  const root=book();
  label(root,'THE NOTEBOOK PROGRAM',3.85,0,0.22,2.00);
  // Finite inherited pattern leaves; avoid inventing template names or unique planets.
  const vault=hinge(root,-2.75,-1.75,2.10,2.15,-0.72,darkPage);
  for(let i=0;i<4;i++){
    const leaf=box(vault,1.38-i*0.16,0.025,0.92, i%2?deepPaper:paper,0,0.32+i*0.10,0.9+i*0.035);
    leaf.rotation.z=(i-1.5)*0.08;
  }
  label(root,"WORLD'S VAULT",2.0,-2.7,0.25,0.83);
  const compiler=mesh(root,new THREE.CylinderGeometry(0.82,0.82,0.13,12),brass,0,0.28,0);
  compiler.rotation.y=0.2;
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    box(root,0.08,0.08,0.34,obsidian,Math.sin(a)*0.8,0.34,Math.cos(a)*0.8);
  }
  label(root,'TEMPLATES IN / WORLDS OUT',2.6,0,0.2,1.12);
  const familyColors=[0x3e7988,0x508b79,0x4f6e91];
  for(let i=0;i<3;i++){
    const x=1.78+i*0.89, z=-0.35+(i%2)*0.4;
    const ball=mesh(root,new THREE.SphereGeometry(0.29,14,9),
      new THREE.MeshStandardMaterial({color:familyColors[i],roughness:0.84}),x,0.61,z);
    ball.rotation.z=i*0.31;
    const band=mesh(root,new THREE.TorusGeometry(0.23+i*0.012,0.043,5,18),paper,x,0.61,z);
    band.rotation.x=Math.PI/2.6+i*0.15;
    box(root,0.7,0.04,0.61,deepPaper,x,0.22,z);
  }
  label(root,'FAMILY VARIATION',2.28,2.65,0.20,1.24);
  // F03 hidden inscription deliberately absent: exact text and location await approval.
}
function disposePage():void {
  stage.traverse(object=>{
    const m=object as THREE.Mesh;
    if(m.geometry)m.geometry.dispose();
    if(m.material){
      const mats=Array.isArray(m.material)?m.material:[m.material];
      for(const mat of mats)if(!sharedMaterials.includes(mat))mat.dispose();
    }
  });
  for(const tex of temporaryTextures)tex.dispose();
  temporaryTextures=[];
  stage.clear();
  marks=[];
}
function displayFolio(index:FolioIndex):void {
  disposePage();current=index;miniature=false;keyState.clear();
  if(index===0)firstFolio();
  else if(index===1)secondFolio();
  else thirdFolio();
  titleElement.textContent=titles[index];
  descriptionElement.textContent=descriptions[index];
  prevButton.disabled=index===0;nextButton.disabled=index===2;
  miniControl.setAttribute('aria-pressed','false');
  miniControl.textContent='Enter miniature inspection (M)';
  statusElement.textContent='Folio '+(index+1)+' of 3. Unnarrated concept preview. No discovery reward.';
  if(controls){
    camera.position.set(0,6.4,9.5);
    controls.target.set(0,0.4,0);
    controls.minDistance=1.0;
    controls.maxDistance=18;
    controls.update();
  }
}
function miniatureToggle():void {
  miniature=!miniature;
  miniControl.setAttribute('aria-pressed',String(miniature));
  miniControl.textContent=miniature?'Return to overview (M)':'Enter miniature inspection (M)';
  for(const mark of marks)mark.mesh.visible=false;
  if(!controls)return;
  if(miniature){
    const x=current===1?2.2:0;
    camera.position.set(x,0.85,1.95);
    controls.target.set(x,0.37,0.55);
    controls.minDistance=0.10;
    controls.maxDistance=3.6;
    statusElement.textContent='Miniature mode. W A S D to move; drag to look. Concealed writing may be discovered by close inspection.';
  }else{
    camera.position.set(0,6.4,9.5);controls.target.set(0,0.4,0);
    controls.minDistance=1;controls.maxDistance=18;
    statusElement.textContent='Overview restored.';
  }
  controls.update();
}
function updateSecrets():void {
  if(!miniature){
    for(const m of marks)m.mesh.visible=false;
    return;
  }
  for(const m of marks){
    const near=camera.position.distanceTo(m.target)<1.12;
    if(near&&!m.mesh.visible)statusElement.textContent='Concealed maker testimony: '+m.exactText;
    m.mesh.visible=near;
  }
}
function moveMini(dt:number):void {
  if(!miniature||!controls)return;
  let lr=0,fb=0;
  if(keyState.has('w'))fb-=1;
  if(keyState.has('s'))fb+=1;
  if(keyState.has('a'))lr-=1;
  if(keyState.has('d'))lr+=1;
  if(!lr&&!fb)return;
  const facing=new THREE.Vector3();camera.getWorldDirection(facing);
  facing.y=0;facing.normalize();
  const right=new THREE.Vector3(-facing.z,0,facing.x);
  const delta=facing.multiplyScalar(-fb).addScaledVector(right,lr).normalize().multiplyScalar(Math.min(dt,0.05)*1.0);
  camera.position.add(delta);controls.target.add(delta);
  camera.position.x=THREE.MathUtils.clamp(camera.position.x,-4.0,4.0);
  camera.position.z=THREE.MathUtils.clamp(camera.position.z,-2.2,2.25);
  camera.position.y=THREE.MathUtils.clamp(camera.position.y,0.35,2.3);
  controls.target.x=THREE.MathUtils.clamp(controls.target.x,-4.0,4.0);
  controls.target.z=THREE.MathUtils.clamp(controls.target.z,-2.2,2.25);
}
function resize():void {
  if(!renderer)return;
  const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
  camera.aspect=width/height;camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);
}
function keyDown(event:KeyboardEvent):void {
  if(['ArrowLeft','ArrowRight',' ','w','a','s','d'].includes(event.key)&&document.activeElement===canvas)event.preventDefault();
  const key=event.key.toLowerCase();
  if(event.repeat&&['arrowleft','arrowright','m'].includes(key))return;
  if(key==='arrowleft'&&current>0)displayFolio((current-1) as FolioIndex);
  else if(key==='arrowright'&&current<2)displayFolio((current+1) as FolioIndex);
  else if(key==='m')miniatureToggle();
  else if(['w','a','s','d'].includes(key))keyState.add(key);
}
function keyUp(event:KeyboardEvent):void {keyState.delete(event.key.toLowerCase());}
function unload():void {
  cancelAnimationFrame(frame);
  window.removeEventListener('keydown',keyDown);
  window.removeEventListener('keyup',keyUp);
  window.removeEventListener('resize',resize);
  disposePage();controls?.dispose();renderer?.dispose();
  sharedMaterials.forEach(mat=>mat.dispose());
}
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  controls=new OrbitControls(camera,canvas);
  controls.enableDamping=!reducedMotion;
  controls.enablePan=false;
  controls.minPolarAngle=0.14;
  controls.maxPolarAngle=1.52;
  prevButton.addEventListener('click',()=>{if(current>0)displayFolio((current-1) as FolioIndex);});
  nextButton.addEventListener('click',()=>{if(current<2)displayFolio((current+1) as FolioIndex);});
  miniControl.addEventListener('click',miniatureToggle);
  window.addEventListener('keydown',keyDown);
  window.addEventListener('keyup',keyUp);
  window.addEventListener('resize',resize);
  window.addEventListener('pagehide',unload,{once:true});
  displayFolio(0);resize();
  let previous=performance.now();
  function tick(now:number):void {
    const dt=Math.max(0,(now-previous)/1000);previous=now;
    moveMini(dt);updateSecrets();controls?.update();
    renderer?.render(scene,camera);
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
}catch(error){
  console.error('Palimpsest visual preview unavailable',error);
  canvas.hidden=true;
  fallbackElement.hidden=false;
  statusElement.textContent='WebGL unavailable; source-grounded text review remains accessible.';
}
