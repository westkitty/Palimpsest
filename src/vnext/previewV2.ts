import {closingReadingPose,createEnvironmentalClosing} from './environmentClosing.ts';
import { makeF07CandidateStage } from './proof/f07CandidateStage';
import { F08FolioWorld, F09FolioWorld } from '../engine/folios/FoliosWar2';
import { makeF08CandidateStage } from './proof/f08CandidateStage.ts';
import { F09_MODEL_CENTER, makeF09CandidateStage } from './proof/f09CandidateStage.ts';
import { makeF04CandidateStage } from './proof/f04CandidateStage';
import { makeF05CandidateStage } from './proof/f05CandidateStage';
import { makeF06CandidateStage } from './proof/f06CandidateStage';
import { resetF06TerrainWear } from './proof/f06AttritionLayers';
import { makeF12CandidateStage } from './proof/f12CandidateStage';
import { F12FolioWorld } from '../engine/folios/FoliosAftermath';
import { cssStock, folioStock, isDarkStock } from './livingPaperStock.ts';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildShardGodFigure, buildWordstreamerFigure, buildNiAlBuGeode } from '../engine/drakken/CharacterFigures';
import { activateSlot, mayReveal, planetPattern, restoreFolioStudy, sourceInkRegistration, startFolio, type FolioActions, type FolioIndex, type Slot, type Inspection } from './folioLogic.ts';
import { FIRST_LATER_FOLIO, LATER_STUDY_STORAGE_KEY, isLivingIndex, operateLater, restoreLaterStudy, serializeLaterStudy, type LaterFolioIndex } from './laterFolioState.ts';
import { activeSpecimen, createLaterFolio, getLaterCopy, makeContactShadow } from './laterFolioScenes.ts';
import { getLaterDiagram } from './laterFolioDiagrams.ts';
import { revisionDiagram } from './revisionDiagrams.ts';
import { LivingStagecraft } from './livingStagecraft.ts';
import { LivingBookBinding } from './livingBookBinding.ts';
import { createRevisionEarlyArt, REVISION_VAULT_TEMPLATES } from './revisionEarlyArt.ts';
import { createF01Challenger } from './challengerF01.ts';
import { createF02Challenger } from './challengerF02.ts';
import { createRevisionWar1Art } from './revisionWar1Art.ts';
import { createRevisionWar2Art, mountF08FunctionalTheatre, mountF09FunctionalTheatre } from './revisionWar2Art.ts';
import { createRevisionAftermathArt } from './revisionAftermathArt.ts';
import type { FolioRuntimeState } from '../types/atlas';
import { makeF03CandidateStage } from './proof/f03CandidateStage';
import { CODA_INDEX, ADMINISTRATION_SLOGAN, playableIndex } from './revisionCodaLogic.ts';

/** PALIMPSEST Living Book revision. Archive history and narration remain independent. */
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
const requestedFolio = Number(new URLSearchParams(window.location.search).get('folio') ?? 1);
const initialFolio = Number.isInteger(requestedFolio) && requestedFolio >= 1 && requestedFolio <= CODA_INDEX+1 ? requestedFolio - 1 : 0;
// A direct visit begins with a closed physical cover. Embedded archival
// counterparts and explicit later-folio deep links open at the requested leaf.
const startWithClosedCover = !bridgeEmbedded && initialFolio === 0;
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
  'The white vellum is starless. Black ink spreads; points, clusters and a galaxy form only over the dark. The landmarks are Zentrum and the Digital Geode.',
  'Open the WorldsVault to compare folded globes from three named templates. Turn the dial to change the source and press the die to generate a bounded variation.',
] as const;
const actionCopy = [
  ['Lift the three paper leaves', 'Inspect the folded detail', 'Compare the three roles'],
  ['Spread the ink and reveal the first points', 'Open the clusters', 'Unfold the galaxy'],
  ['Open the source templates', 'Change source plate', 'Generate bounded variation'],
] as const;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b1018');
scene.fog = new THREE.FogExp2(0x0b1018, 0.017);
const camera = new THREE.PerspectiveCamera(45, 1, 0.04, 80);
camera.position.set(0, 6.5, 9.9); // Reframed by fitBookCamera after canvas mounting.
const ambientLight=new THREE.AmbientLight(0xa3b5c6,0.78);scene.add(ambientLight);
const keyLight = new THREE.DirectionalLight(0xfff0d5, 1.96);
keyLight.position.set(-4, 8, 5);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x7dc5de, 0.97);
rimLight.position.set(4, 4, -5);
scene.add(rimLight);
const overhead = new THREE.PointLight(0xc4e6ee, 13.5, 18, 2);
overhead.position.set(0, 5.1, -2.1);scene.add(overhead);
// The physical binding stays mounted while each authored paper world may
// fold away independently. Both folios exist during a committed turn.
const stageRoot = new THREE.Group();
stageRoot.name = 'Twelve authored physical paper stages';
scene.add(stageRoot);
let rig = new THREE.Group();
stageRoot.add(rig);
const binding = new LivingBookBinding();
scene.add(binding.root);
type BookPhase = 'closed' | 'opening' | 'closing' | 'open';
let bookPhase: BookPhase = startWithClosedCover ? 'closed' : 'open';
let coverAnimation = startWithClosedCover ? 0 : 1;
let coverDrag: {pointerId:number; startX:number; currentX:number} | null = null;
binding.setCoverProgress(coverAnimation);
rig.visible = !startWithClosedCover;
canvas.dataset.bookPhase = bookPhase;
canvas.dataset.pageTurn = 'idle';
type PhysicalTurn = {
  pointerId: number | null;
  fromIndex: number;
  toIndex: number;
  direction: -1 | 1;
  fromX: number;
  currentX: number;
  progress: number;
  destination: number;
  dragging: boolean;
  commit: boolean;
  swapped: boolean;
};
let physicalTurn: PhysicalTurn | null = null;
const bookRaycaster = new THREE.Raycaster();
const bookPointer = new THREE.Vector2();
function bookHit(event: PointerEvent, object: THREE.Object3D): boolean {
  const rect = canvas.getBoundingClientRect();
  if(!rect.width || !rect.height)return false;
  bookPointer.set((event.clientX-rect.left)/rect.width*2-1,
    -((event.clientY-rect.top)/rect.height*2-1));
  bookRaycaster.setFromCamera(bookPointer,camera);
  return bookRaycaster.intersectObject(object,false).length>0;
}
function folioLeafTitle(index:number):string {
  return index===CODA_INDEX?'Closing imprint':index<3?titleCopy[index]:getLaterCopy(index as LaterFolioIndex).title;
}
function openPhysicalCover():void {
  if(bookPhase!=='closed')return;
  bookPhase='opening';
  canvas.dataset.bookPhase='opening';
  if(controls)controls.enabled=false;
  announce('Opening the closed book to the first folio and its three original paper figures.');
}
function beginPhysicalTurn(direction:-1|1,pointerId:number|null,startX:number):void {
  if(bookPhase!=='open' || physicalTurn || inspection!=='overview')return;
  const target=currentFolio+direction;
  if(!playableIndex(target))return;
  const startProgress=direction===1?0:1;
  physicalTurn={
    pointerId,fromIndex:currentFolio,toIndex:target,direction,
    fromX:startX,currentX:startX,progress:startProgress,destination:startProgress,
    dragging:pointerId!==null,commit:pointerId===null,swapped:false,
  };
  const [right,left]=direction===1?[currentFolio,target]:[target,currentFolio];
  binding.setLeafTitles(folioLeafTitle(right),right,folioLeafTitle(left),left,
    studyStates[1].f02.reveal===3);
  binding.setLeafProgress(startProgress,true);
  if(pointerId===null)physicalTurn.destination=direction===1?1:0;
  canvas.dataset.pageTurn=pointerId===null?'settling':'dragging';
  if(controls)controls.enabled=false;
}
function onPhysicalPointerDown(event:PointerEvent):void {
  if(event.button!==0 || !event.isPrimary)return;
  if(bookPhase==='closed' && bookHit(event,binding.coverHit)){
    event.preventDefault();event.stopImmediatePropagation();
    coverDrag={pointerId:event.pointerId,startX:event.clientX,currentX:event.clientX};
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor='grabbing';
    return;
  }
  if(bookPhase!=='open' || physicalTurn || inspection!=='overview')return;
  if((currentFolio===3&&canvas.dataset.blenderFolio==='04')||(currentFolio===6&&canvas.dataset.blenderFolio==='07')){
    const controls=(laterRevision?.root.userData.interactables??[]) as THREE.Mesh[];
    // The generous page-turn hit volume extends behind an outer A/C tab.
    // Its invisible plane must not swallow a tap on the actual mechanism.
    if(controls.some(node=>bookHit(event,node)))return;
  }
  const direction: -1|1|null =
    currentFolio<CODA_INDEX && bookHit(event,binding.rightCornerHit)?1:
    currentFolio>0 && bookHit(event,binding.leftCornerHit)?-1:null;
  if(direction===null)return;
  event.preventDefault();event.stopImmediatePropagation();
  beginPhysicalTurn(direction,event.pointerId,event.clientX);
  canvas.setPointerCapture(event.pointerId);
  canvas.style.cursor='grabbing';
}
function onPhysicalPointerMove(event:PointerEvent):void {
  if(coverDrag && coverDrag.pointerId===event.pointerId){
    event.preventDefault();event.stopImmediatePropagation();
    coverDrag.currentX=event.clientX;
    // Dragging from right to left genuinely rotates the bound front board.
    // A tap still performs the accessible complete opening.
    const pulled=coverDrag.startX-event.clientX;
    coverAnimation=THREE.MathUtils.clamp(pulled/(canvas.clientWidth*0.36),0,1);
    binding.setCoverProgress(coverAnimation);
    fitBookCamera(coverAnimation);
    rig.visible=coverAnimation>=0.57;
    return;
  }
  const turn=physicalTurn;
  if(!turn || !turn.dragging || turn.pointerId!==event.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  turn.currentX=event.clientX;
  const delta=event.clientX-turn.fromX;
  const fraction=THREE.MathUtils.clamp(
    turn.direction===1?-delta/(canvas.clientWidth*0.34):delta/(canvas.clientWidth*0.34),
    0,1);
  turn.progress=turn.direction===1?fraction:1-fraction;
  binding.setLeafProgress(turn.progress,true);
  // Stage sculpture folds toward its card as the material leaf lifts, without
  // altering source-authored A/B/C state or disposing a scene mid-drag.
  rig.scale.y=reducedMotion?1:1-0.52*Math.sin(turn.progress*Math.PI);
}
function onPhysicalPointerUp(event:PointerEvent):void {
  if(coverDrag && coverDrag.pointerId===event.pointerId){
    event.preventDefault();event.stopImmediatePropagation();
    const delta=coverDrag.startX-coverDrag.currentX;
    coverDrag=null;
    canvas.style.cursor='grab';
    try{if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}catch{}
    if(Math.abs(delta)<14 || coverAnimation>=0.38)openPhysicalCover();
    else{bookPhase='closing';canvas.dataset.bookPhase='closing';}
    return;
  }
  const turn=physicalTurn;
  if(!turn || !turn.dragging || turn.pointerId!==event.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  turn.dragging=false;
  const travelled=Math.abs(turn.currentX-turn.fromX);
  const distance=turn.direction===1?turn.progress:1-turn.progress;
  turn.commit=travelled>14 && distance>=0.35;
  turn.destination=turn.commit?(turn.direction===1?1:0):(turn.direction===1?0:1);
  canvas.dataset.pageTurn='settling';
  canvas.style.cursor='grab';
  try{if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}catch{}
}
function onPhysicalPointerCancel(event:PointerEvent):void {
  if(coverDrag && coverDrag.pointerId===event.pointerId){
    coverDrag=null;bookPhase='closing';canvas.dataset.bookPhase='closing';
    canvas.style.cursor='grab';return;
  }
  if(!physicalTurn || physicalTurn.pointerId!==event.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  physicalTurn.dragging=false;
  physicalTurn.commit=false;
  physicalTurn.destination=physicalTurn.direction===1?0:1;
  canvas.dataset.pageTurn='settling';
}
function updatePhysicalBinding(dt:number):void {
  if(bookPhase==='closing'){
    coverAnimation=Math.max(0,coverAnimation-Math.max(0,dt)*1.3);
    binding.setCoverProgress(coverAnimation);
    fitBookCamera(coverAnimation);
    rig.visible=coverAnimation>=0.57;
    if(coverAnimation===0){bookPhase='closed';canvas.dataset.bookPhase='closed';}
  }
  if(bookPhase==='opening'){
    coverAnimation=Math.min(1,coverAnimation+(reducedMotion?1:Math.max(0,dt)*0.82));
    const eased=coverAnimation*coverAnimation*(3-2*coverAnimation);
    binding.setCoverProgress(eased);
    fitBookCamera(eased);
    rig.visible=eased>=0.57;
    if(coverAnimation===1){
      bookPhase='open';canvas.dataset.bookPhase='open';
      rig.visible=true;if(controls)controls.enabled=true;
      announce('First folio open. Drag the outer paper edge to turn a leaf.');
    }
  }
  const turn=physicalTurn;
  if(!turn || turn.dragging)return;
  if(reducedMotion)turn.progress=turn.destination;
  else{
    const difference=turn.destination-turn.progress;
    const step=Math.max(0,dt)*2.1;
    turn.progress+=Math.sign(difference)*Math.min(Math.abs(difference),step);
  }
  binding.setLeafProgress(turn.progress,true);
  const unfolded=turn.direction===1?turn.progress:1-turn.progress;
  if(turn.commit && !turn.swapped){
    // Never discard a sculpture at the midpoint. Retain the departing paper
    // theatre, build the arriving one underneath the same moving leaf, and
    // fold each physical stage on opposite halves of the same motion.
    parkOutgoingStage();
    goFolio(turn.toIndex,true);
    turn.swapped=true;
    if(controls)controls.enabled=false;
  }
  if(outgoingStage){
    const collapse=Math.min(1,unfolded*1.88);
    outgoingStage.root.scale.y=reducedMotion?1:Math.max(0.055,1-collapse*0.94);
    outgoingStage.root.visible=unfolded<0.57;
    const rising=THREE.MathUtils.clamp((unfolded-0.40)/0.60,0,1);
    rig.scale.y=reducedMotion?1:Math.max(0.055,rising*rising*(3-2*rising));
    rig.visible=unfolded>0.40;
  }else{
    // A declined page turn is still an elastic page: the original scene
    // returns to its plinth rather than changing folio or losing study state.
    rig.scale.y=reducedMotion?1:Math.max(0.055,1-0.78*Math.sin(turn.progress*Math.PI));
  }
  if(Math.abs(turn.progress-turn.destination)<0.001){
    if(turn.commit && !turn.swapped){
      parkOutgoingStage();goFolio(turn.toIndex,true);
      turn.swapped=true;
    }
    binding.setLeafProgress(turn.progress,false);
    discardOutgoingStage();
    physicalTurn=null;canvas.dataset.pageTurn='idle';
    rig.visible=true;rig.scale.y=1;
    binding.setPageIndex(currentFolio);
    if(turn.commit)resetCamera();
    if(controls)controls.enabled=true;
  }
}

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
let f04ExpansionFrame:number|null=null;
let laterWorld: ReturnType<typeof createLaterFolio> | null = null;
let livingStagecraft: LivingStagecraft | null = null;
type RevisionLayer<S>={root:THREE.Group;update(state:S,dt:number,reduced:boolean):void;dispose?():void};
let earlyRevision:RevisionLayer<FolioActions>|null=null;
let laterRevision:RevisionLayer<FolioRuntimeState>|null=null;
let closingWall:ReturnType<typeof createEnvironmentalClosing>|null=null;
function disposeRevision(l:RevisionLayer<never>|null):void{
  if(!l)return;
  l.root.removeFromParent();
  if(l.dispose)l.dispose();else disposeSubtree(l.root);
}

type ParkedStage = {
  root:THREE.Group;
  laterWorld:ReturnType<typeof createLaterFolio> | null;
  stagecraft:LivingStagecraft | null;
  textures:THREE.Texture[];
  early:RevisionLayer<FolioActions>|null;later:RevisionLayer<FolioRuntimeState>|null;
};
let outgoingStage:ParkedStage | null = null;
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
const mechanismRaycaster = new THREE.Raycaster();
const mechanismPointer = new THREE.Vector2();
let paperTap: {id:number;x:number;y:number} | null = null;
let earlyPaperTabs:THREE.Group[]=[];
let earlyPaperTabHits:THREE.Mesh[]=[];
function onPaperPointerDown(e:PointerEvent):void {
  if(inspection==='overview' && e.isPrimary && bookPhase==='open' && !physicalTurn)
    paperTap={id:e.pointerId,x:e.clientX,y:e.clientY};
}
function onPaperPointerCancel():void {paperTap=null;}
function onPaperPointerUp(e:PointerEvent):void {
  const tap=paperTap;paperTap=null;
  if(!tap || tap.id!==e.pointerId || inspection!=='overview' || physicalTurn)return;
  if(Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>9)return;
  const box=canvas.getBoundingClientRect();
  if(box.width<1||box.height<1)return;
  mechanismPointer.set((e.clientX-box.left)/box.width*2-1,-((e.clientY-box.top)/box.height*2-1));
  mechanismRaycaster.setFromCamera(mechanismPointer,camera);
  if(currentFolio<FIRST_LATER_FOLIO){
    // The early-folio A/B/C tabs are actual pullable cardstock controls.
    // They operate the unchanged documented teaching actions, never secrets.
    for(const hit of mechanismRaycaster.intersectObjects(earlyPaperTabHits,false)){
      const slot=hit.object.userData.slot;
      if(slot==='A'||slot==='B'||slot==='C'){handleAction(slot);return;}
    }
    return;
  }
  if((currentFolio===3&&canvas.dataset.blenderFolio==='04')||(currentFolio===4&&canvas.dataset.blenderFolio==='05')||(currentFolio===5&&canvas.dataset.blenderFolio==='06')||(currentFolio===6&&canvas.dataset.blenderFolio==='07')){
    const slots:THREE.Mesh[]=laterRevision?.root.userData.interactables??[];
    for(const hit of mechanismRaycaster.intersectObjects(slots,false)){
      const slot=hit.object.userData.slot;
      if(slot==='A'||slot==='B'||slot==='C'){handleAction(slot);return;}
    }
    return;
  }
  if(currentFolio===11&&canvas.dataset.blenderFolio==='12'){
    const targets:THREE.Mesh[]=laterRevision?.root.userData.interactables??[];
    for(const hit of mechanismRaycaster.intersectObjects(targets,false)){
      const slot=hit.object.userData.slot;
      if(slot==='A'||slot==='B'||slot==='C'){handleAction(slot);return;}
    }
    return;
  }
  if(!laterWorld)return;
  if(currentFolio===7&&canvas.dataset.blenderFolio==='08'){
    const targets:THREE.Object3D[]=laterRevision?.root.userData.interactables??[];
    for(const hit of mechanismRaycaster.intersectObjects(targets,true)){
      let n:THREE.Object3D|null=hit.object;
      while(n&&n!==laterRevision?.root){
        const slot=n.userData.slot;
        if(slot==='A'||slot==='B'||slot==='C'){handleAction(slot);return;}
        n=n.parent;
      }
    }
  }
  const targets=laterWorld.getInteractables().filter(n=>
    (canvas.dataset.blenderFolio!=='08'||!n.userData.f08Understudy)&&
    (canvas.dataset.blenderFolio!=='10'||!n.userData.f10Understudy));
  const hits=mechanismRaycaster.intersectObjects(targets,true);
  for(const hit of hits){
    let obj:THREE.Object3D|null=hit.object;
    while(obj && obj!==laterWorld.root){
      if(obj.userData.interactionType==='folioMechanism' &&
        obj.userData.worldId===currentFolio &&
        ['A','B','C'].includes(obj.userData.slot)){
        handleAction(obj.userData.slot as Slot);
        return;
      }
      obj=obj.parent;
    }
  }
}
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
// Separate substrate materials per spread: a parked outgoing spread must not
// change color when the incoming leaf is built halfway through a page turn.
const stockMaterials=Array.from({length:CODA_INDEX+1},(_,i)=>{
  const {face,edge,cut}=folioStock(i);
  return [face,edge,cut].map(color=>new THREE.MeshStandardMaterial({
    color,roughness:.96,side:THREE.DoubleSide,
  }));
});
sharedMats.push(...stockMaterials.flat());
const wetStockColors=Object.values(folioStock(1,true)).map(value=>new THREE.Color(value));
const dryStockColors=Object.values(folioStock(1)).map(value=>new THREE.Color(value));
function tintVellumEdges(advance:number):void {
  const amount=THREE.MathUtils.smoothstep(advance,.80,1);
  stockMaterials[1].forEach((material,i)=>{
    material.color.copy(dryStockColors[i]).lerp(wetStockColors[i],amount);
  });
}
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
  // A true pierced aperture: the visitor sees the page world beyond it,
  // rather than a solid colored arch pretending to be theatre scenery.
  const hollow=new THREE.Path();
  hollow.moveTo(-half*0.61,0.13);
  hollow.lineTo(-half*0.61,height*0.47);
  hollow.lineTo(-half*0.42,height*0.65);
  hollow.lineTo(0,height*0.78);
  hollow.lineTo(half*0.42,height*0.65);
  hollow.lineTo(half*0.61,height*0.47);
  hollow.lineTo(half*0.61,0.13);
  hollow.closePath();
  shape.holes.push(hollow);
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
function mountEarlyPaperTabs(parent:THREE.Object3D):void {
  // Three mounted paper pull strips at the fore edge. Their separate
  // physical movement mirrors the existing A/B/C teaching mechanism state.
  for(let i=0;i<3;i++){
    const tab=new THREE.Group();
    tab.position.set((i-1)*2.52,0.32,2.71);
    tab.name='die-cut pull-tab '+(['A','B','C'] as const)[i];
    parent.add(tab);
    slab(parent,0.73,0.09,0.20,shared.ink,(i-1)*2.52,0.29,2.67);
    for(const side of [-1,1]){
      slab(parent,0.025,0.045,0.45,shared.brass,(i-1)*2.52+side*0.35,0.33,2.79);
    }
    const grip=slab(tab,0.60,0.050,0.46,shared.bone,0,0,0.20);
    grip.userData.interactionType='paperTab';
    grip.userData.slot=(['A','B','C'] as const)[i];
    grip.name='pull-paper-mechanism-'+grip.userData.slot;
    earlyPaperTabHits.push(grip);
    plaque(tab,grip.userData.slot,0,0.029,0.23,0.36);
    const notch=put(tab,new THREE.CylinderGeometry(0.07,0.07,0.026,12),shared.brass,0,0.046,0.40);
    notch.name='finger cutout ring';
    earlyPaperTabs.push(tab);
  }
}
function animateEarlyPaperTabs(dt:number):void {
  const engaged=currentFolio===0
    ? [state.f01.fold,state.f01.detail,state.f01.compare]
    : currentFolio===1
      ? [state.f02.reveal>=1,state.f02.reveal>=2,state.f02.reveal>=3]
      : [state.f03.vaultOpen,state.f03.template!==0,state.f03.generation!==0];
  earlyPaperTabs.forEach((tab,i)=>{
    tab.position.z=smooth(tab.position.z,engaged[i]?3.02:2.71,dt);
    tab.rotation.x=smooth(tab.rotation.x,engaged[i]?-0.12:0,dt);
  });
}
function book():THREE.Group {
  const root=new THREE.Group();rig.add(root);
  const [stockFace,stockEdge,stockCut]=stockMaterials[currentFolio];
  // The binding now owns the one continuous material slate tabletop; avoid
  // z-fighting with a duplicate slab in every individually authored stage.
  slab(root,10.02,0.24,6.63,shared.ink,0,-0.125,-0.015);
  slab(root,9.72,0.09,6.39,shared.gold,0,0.015,-0.015);
  for(let i=0;i<5;i++){
    const edge=slab(root,9.33-i*0.025,0.014,6.02-i*0.025, i%2?stockCut:stockEdge,0,0.050+i*0.018,0);
    edge.receiveShadow=true;
  }
  slab(root,4.47,0.075,5.76,stockFace,-2.32,0.15,0);
  slab(root,4.47,0.075,5.76,stockFace,2.32,0.15,0);
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
  if(currentFolio<FIRST_LATER_FOLIO)mountEarlyPaperTabs(root);
  return root;
}
function buildCoda():void {
  const page=book();
  closingWall=createEnvironmentalClosing(textTextures);
  page.add(closingWall.root);
  canvas.dataset.closingBeat=closingWall.update(0,reducedMotion);
}
function platform(parent:THREE.Object3D,x:number,z:number,w=1.55):void {
  slab(parent,w,0.11,1.18,shared.backing,x,0.24,z);
  slab(parent,w-0.13,0.065,1.05,shared.paper,x,0.32,z);
}
function buildF01():THREE.Group {
  const page=book();
  const root=new THREE.Group();
  root.name='F01 legacy paper stage (offline GLB fallback)';
  page.add(root);
  // Intentionally NO star points, star meshes, nebula sky or cosmic background.
  slab(root,7.95,0.05,1.73,shared.blue,0,0.25,-1.23);
  // Layered, unlit primordial architecture. These are intentionally blank
  // die-cut scenic signatures, not stars, orbitals, organisms or new canon.
  for(let depth=0;depth<3;depth++){
    const z=-2.83+depth*0.11;
    const inkColor=depth===0?shared.ink:depth===1?shared.navy:shared.purple;
    // Rear ribs form a self-supporting paper proscenium across all three
    // figures; the empty apertures remain literally starless.
    for(const x of [-4.05,-1.36,1.36,4.05]){
      const upright=slab(root,0.10+depth*0.02,1.75-depth*0.18,0.05,inkColor,
        x,1.05-depth*0.09,z);
      upright.castShadow=true;
      const foot=slab(root,0.23,0.045,0.70,shared.backing,x,0.32,z+0.25);
      foot.rotation.x=-0.15;
    }
    const lintel=slab(root,8.4,0.07,0.075,depth===1?shared.brass:inkColor,
      0,1.96-depth*0.18,z);
    lintel.castShadow=true;
  }
  for(let i=0;i<3;i++){
    const x=(i-1)*2.67;
    const arch=cutArch(root,x,-2.39,2.06,1.63,i===0?shared.ink:i===1?shared.purple:shared.navy);
    const inkFrame=cutArch(arch,0,-0.045,1.66,1.22,shared.blue);
    // V-fold gussets and cross-braced die-cut shadow wings are mechanically
    // attached to the page rather than floating as an atmospheric backdrop.
    for(const side of [-1,1]){
      const gusset=slab(root,0.054,0.60,0.57,shared.backing,
        x+side*0.80,0.62,-2.29);
      gusset.rotation.z=side*0.25;
      gusset.rotation.x=-0.22;
      const wing=slab(root,0.040,1.17,0.53,shared.ink,
        x+side*0.96,0.85,-1.91);
      wing.rotation.y=side*0.34;
    }
    inkFrame.position.y=0.0;
    for(let s=-1;s<=1;s++){
      slab(root,0.035,0.46+(i%2)*0.17,0.055,i===1?shared.cyan:shared.gold,x+s*0.45,0.52,-1.93);
    }
  }
  // Reuse the three published PALIMPSEST sculptural figures, not token stand-ins.
  // Source: src/engine/drakken/CharacterFigures.ts (source-reference designs).
  // Table-mounted theatrical fill lights illuminate the three existing
  // editorial sculptures without adding any celestial stars to pre-stellar F01.
  for(let i=0;i<3;i++){
    const light=new THREE.PointLight(i===1?0xb3dff0:0xffddae,5.4,3.7,2);
    light.position.set((i-1)*2.67,1.25,-1.13);
    light.name='F01 non-celestial paper-theatre footlight';
    root.add(light);
  }
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
  focusText=inscription(rig,['He murdered her.'],0,0.51,0.12,1.85);
  secretTarget=new THREE.Vector3(0,0.51,0.12);
  return root;
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

function buildF02():THREE.Group {
  const root=book();
  const fallback=new THREE.Group();fallback.name='F02 procedural fallback paper scenery';root.add(fallback);
  const frame=cutArch(fallback,0,-2.66,7.85,2.0,shared.navy);
  for(let j=0;j<9;j++){
    const x=-3.48+j*0.87;
    slab(frame,0.055,0.34+Math.abs(4-j)*0.052,0.032,shared.gold,x,0.31,-0.065);
  }
  const back=paperHinge(fallback,0,-2.41,8.35,3.15,shared.blue);
  back.rotation.x=-0.02;paperHinges.push(back);
  // Distinct cardstock layers: they unfold only when A, B, C are activated.
  for(const [stage,number,radius,depth] of [[1,110,1.7,0.26],[2,230,2.55,0.43],[3,430,3.72,0.63]] as const){
    const leaf=paperHinge(fallback,0,-2.20-stage*0.02,8.05-stage*0.20,3.03,stage===3?shared.ink:shared.blue);
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
  galaxyPaperLoom=buildAllPaperLoom(fallback);
  // An architectural landmark, intentionally not placed at the literal center of all space.
  platform(fallback,-2.30,0.55,1.79);
  for(const r of [0.29,0.48,0.63]){const g=ring(fallback,r,0.018,shared.brass,-2.30,0.83,0.27);g.rotation.z=r*0.65;}
  plaque(fallback,'ZENTRUM',-2.30,0.41,1.07,1.52);
  platform(root,2.27,0.55,1.86);
  const geode=new THREE.Group();geode.position.set(2.27,0.54,0.24);root.add(geode);
  // The source-authored NiAlBu-in-Geode sculpture is preserved, including its open
  // cutaway, inverted captive, four copper rings, and cyan fissures. No substitute cage.
  const originalGeode=buildNiAlBuGeode(fiber,1.32);
  originalGeode.name='palimpsest-original-nialbu-geode';
  originalGeode.userData.source='src/engine/drakken/CharacterFigures.ts';
  originalGeode.userData.visualScope='original author-built PALIMPSEST interpretation';
  addInkedContours(originalGeode);
  // Rotate the original cutaway to the forward-right sight line; neither the
  // landmark nor its separate, interior-gated inspection plate moves.
  originalGeode.rotation.y=-.84;
  geode.add(originalGeode);
  const faceFill=new THREE.PointLight(0xa7d5ff,2.6,2.35,2);
  faceFill.name='F02 book light on the Digital Geode cutaway';
  faceFill.position.set(3.02,1.53,.95);root.add(faceFill);
  const copperFill=new THREE.PointLight(0xffd4a1,2.45,2.35,2);
  copperFill.name='F02 book light on Zentrum engraved rings';
  copperFill.position.set(-3.37,.97,1.24);root.add(copperFill);
  authoredFigureCount++;
  plaque(root,'DIGITAL GEODE',2.27,0.41,1.14,1.90);
  plaque(root,'THE ALL UNFOLDS',0,0.25,2.17,3.15);
  for(const x of [-3.68,3.68])filigree(root,x,0.29,2.10,0.20,shared.gold);
  for(let j=0;j<7;j++){
    const ang=j*Math.PI/3.5;
    const ix=-2.30+Math.cos(ang)*0.65;
    const iz=0.27+Math.sin(ang)*0.54;
    slab(fallback,0.032,0.025,0.14,shared.bone,ix,0.39,iz).rotation.y=ang;
  }
  // Interior backplate, never shown by exterior/proximity alone.
  focusText=inscription(geode,['NiAlBu still watches her die.','Again and again.'],0,0.44,-0.17,1.13);
  secretTarget=new THREE.Vector3(2.27,0.98,0.07);
  return fallback;
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
  plaque(root,"WORLDSVAULT",-2.72,0.35,0.94,2.03);
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
  // The revision layer authors the folded source and result globes.
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
  disposeRevision(earlyRevision);disposeRevision(laterRevision);earlyRevision=null;laterRevision=null;closingWall=null;delete canvas.dataset.closingBeat;
  if(inspection!=='overview')leaveMini();
  if (livingStagecraft) {
    rig.remove(livingStagecraft.root);
    livingStagecraft.dispose();
    livingStagecraft=null;
  }
  if (laterWorld) {
    rig.remove(laterWorld.root);
    laterWorld.dispose();
    laterWorld = null;
  }
  disposeSubtree(rig);
  for(const texture of textTextures)texture.dispose();
  textTextures=[];rig.clear();
  focusText=null;secretTarget=null;paperHinges=[];f01DetailMarks=[];earlyPaperTabs=[];earlyPaperTabHits=[];galaxyLayers=[];galaxyPaperLoom=null;vaultLeaf=null;sourceWheel=null;programDie=null;printPulse=0;planets=null;
  discovered=false;
}
function parkOutgoingStage():void {
  if(outgoingStage)throw new Error('Another folio is already parked');
  outgoingStage={
    root:rig,laterWorld,stagecraft:livingStagecraft,textures:textTextures,early:earlyRevision,later:laterRevision,
  };
  // Transfer ownership without disposing the outgoing geometry or its
  // independent authored mechanism state during the paper-turn animation.
  laterWorld=null;livingStagecraft=null;earlyRevision=null;laterRevision=null;textTextures=[];
  rig=new THREE.Group();
  rig.name='arriving source-authored paper world';
  stageRoot.add(rig);
}
function discardOutgoingStage():void {
  const parked=outgoingStage;
  if(!parked)return;
  disposeRevision(parked.early);disposeRevision(parked.later);
  parked.laterWorld?.dispose();
  parked.stagecraft?.dispose();
  disposeSubtree(parked.root);
  for(const texture of parked.textures)texture.dispose();
  stageRoot.remove(parked.root);
  parked.root.clear();
  outgoingStage=null;
}
function revisionCopy(index:LaterFolioIndex):ReturnType<typeof getLaterCopy>{
  const existing=getLaterCopy(index);
  if(index===3)return {...existing,actions:[existing.actions[0],'Light the expansion route',existing.actions[2]],
    description:'Year zero. Follow the planet lights as expansion advances. The pulse stops at the final lit state.'};
  if(index===7)return {...existing,description:'The Aureal Gate is a circular Hookshot portal. Operate its mechanisms to see the test of the gate and its consequences.',visuals:['A circular, plasma-filled Hookshot portal; plasma activates with the event.','Marcel stands by the gate. The fold-out records the twenty worlds.']};
  if(index===10)return {...existing,description:'Thirty-one days after the war. Codec, Marcel and Tiger arrive in that order. The theatrical paper jungle depicts what the loam could make possible, not the restoration of Nacreous VI.',visuals:['Codec works on the barren remnant.','Marcel arrives with gravity and Wordstreaming. Roots run through the paper, then a jungle erupts.','Tiger arrives last. Codec’s posture drops while Marcel and Tiger are still celebratory.']};
  if(index===11)return {...existing,description:'The Administration turns from containment and harm to a call to serve. The closing imprint has its own page.',
    mechanicalDescriptions:[existing.mechanicalDescriptions[0],existing.mechanicalDescriptions[1],
      'Open the public Syrin 4 archival leaf. The destruction is recorded; exact dates and casualty counts remain unknown.'],
    visuals:['The containment and harm cards are separate.','The Administration cycles through celebratory service roles, then stamps its endorsement.','The closing imprint is on the following leaf.']};
  return existing;
}
function updateNav():void {
  if(currentFolio===CODA_INDEX){
    progress.textContent='Closing imprint';
    title.textContent='Closing imprint';description.textContent=ADMINISTRATION_SLOGAN;
    indicator.textContent='End of the Living Book';
    prevButton.disabled=false;prevButton.textContent='← F12';nextButton.disabled=true;nextButton.textContent='End of book';
    for(const btn of actionButtons){btn.textContent=(btn.dataset.mechanism??'')+' · No mechanism';btn.disabled=true;btn.setAttribute('aria-pressed','false');}
    miniButton.disabled=true;inspectButton.disabled=true;
    setWitnessButton();
    return;
  }
  prevButton.textContent='← Prev';miniButton.disabled=false;updateInspectButton();
  if (currentFolio >= FIRST_LATER_FOLIO) {
    const index=currentFolio as LaterFolioIndex;
    const copy=revisionCopy(index);
    const study=laterStates[index-FIRST_LATER_FOLIO];
    progress.textContent=`F${String(index+1).padStart(2,'0')} / F12`;
    document.querySelectorAll('.chapter-lines span').forEach((line,i)=>line.classList.toggle('active',i<=Math.min(2,Math.floor(index/4))));
    prevButton.disabled=false;
    nextButton.disabled=false;
    nextButton.textContent=index===11?'Closing pop-out →':'Next →';
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
    state.folio===2?`Source template: ${REVISION_VAULT_TEMPLATES[state.f03.template].name}  ·  Ink register: ${sourceInkRegistration(state.f03.template).join('')}  ·  Variation: ${state.f03.generation}`:
    `Physical folds: ${state.f01.fold?'opened':'closed'}  ·  Details: ${state.f01.detail?'shown':'folded'}`;
}
function goFolio(index:number, deferCameraReset=false):void {
  if(!playableIndex(index))return;
  clear();authoredFigureCount=0;currentFolio=index;activeTime=0;
  canvas.dataset.revisionFolio=index===CODA_INDEX?'coda':String(index+1);
  delete canvas.dataset.revisionPhase;delete canvas.dataset.f10CandidateState;delete canvas.dataset.inkAdvance;delete canvas.dataset.blenderFolio;delete canvas.dataset.f05CandidateState;delete canvas.dataset.f04CandidateState;delete canvas.dataset.f11AuthoredFrame;delete canvas.dataset.f11Story;delete canvas.dataset.f07CandidateState;delete canvas.dataset.f08CandidateState;delete canvas.dataset.f09CandidateState;
  delete canvas.dataset.f01Challenger;delete canvas.dataset.f01Detent;delete canvas.dataset.f01Clip;delete canvas.dataset.f01Moving;delete canvas.dataset.f01Stage;
  delete canvas.dataset.f02Challenger;delete canvas.dataset.f02Frame;delete canvas.dataset.f02Detent;delete canvas.dataset.f02Clip;delete canvas.dataset.f02InkBeat;delete canvas.dataset.f02Arms;
  delete canvas.dataset.f06CandidateState;
  delete canvas.dataset.f03WorkshopState;
  delete canvas.dataset.f12CandidateState;
  if(index===CODA_INDEX){
    if(renderer)buildCoda();
  } else if(index<FIRST_LATER_FOLIO){
    state=studyStates[index as FolioIndex];
    if(renderer){
      if(index===0){
        const legacy=buildF01();
        const register=createRevisionEarlyArt(0);
        const stage=new THREE.Group();
        const stageOwner=rig;
        const challenger=createF01Challenger(state,reducedMotion,phase=>{
          if(phase==='ready'){
            legacy.removeFromParent();
            disposeSubtree(legacy);
            legacy.clear();
            if(rig===stageOwner){
              paperHinges=[];
              f01DetailMarks=[];
            }
            register.root.visible=false;
          }
          // The shared book and its real pull-tab meshes stay visible and
          // raycastable; the GLB replaces only the F01 paper scenery.
          if(rig===stageOwner&&currentFolio===0)canvas.dataset.f01Challenger=phase;
        });
        stage.add(register.root,challenger.root);
        canvas.dataset.f01Challenger='loading';
        earlyRevision={
          root:stage,
          update(s,dt,r){
            if(register.root.visible)register.update(s,dt,r);
            challenger.update(s,dt,r);
            if(challenger.root.userData.status==='ready'){
              canvas.dataset.f01Detent=String(challenger.root.userData.settled);
              canvas.dataset.f01Clip=String(challenger.root.userData.clip);
              canvas.dataset.f01Moving=String(challenger.root.userData.moving);
              canvas.dataset.f01Stage=JSON.stringify(challenger.root.userData.stage);
            }
          },
          dispose(){challenger.dispose();disposeSubtree(register.root);stage.clear();},
        };
      }else{
        const f02Fallback=index===1?buildF02():null;
        if(index===2)buildF03();
        if(index===1){
          for(const layer of galaxyLayers)layer.group.visible=false;
          if(paperHinges[0])paperHinges[0].visible=false;
          if(galaxyPaperLoom)(galaxyPaperLoom as THREE.Group).visible=false;
        }
        const procedural=createRevisionEarlyArt(index as FolioIndex);
        earlyRevision=procedural;
        rig.add(procedural.root);
        procedural.update(state,0,reducedMotion);
        if(index===1&&f02Fallback){
          const stageOwner=rig;
          const challenger=createF02Challenger(state.f02.reveal,reducedMotion,phase=>{
            // Only the redundant scenic understudy leaves the stage. Original Geode,
            // witness, vellum ink, book and source-authored A/B/C keep their own lifetimes.
            if(phase==='ready')f02Fallback.visible=false;
            if(rig===stageOwner&&currentFolio===1)canvas.dataset.f02Challenger=phase;
          });
          const stage=new THREE.Group();
          stage.add(procedural.root,challenger.root);
          rig.add(stage);
          canvas.dataset.f02Challenger='loading';
          earlyRevision={
            root:stage,
            update(s,dt,r){
              procedural.update(s,dt,r);
              stage.userData.inkAdvance=procedural.root.userData.inkAdvance;
              challenger.update(s.f02.reveal,dt,r,Number(stage.userData.inkAdvance));
              if(rig===stageOwner)canvas.dataset.f02InkBeat=String(procedural.root.userData.inkBeat);

              if(challenger.root.userData.status==='ready'&&rig===stageOwner){
                canvas.dataset.f02Frame=String(challenger.root.userData.frame);
                canvas.dataset.f02Detent=String(challenger.root.userData.detent);
                canvas.dataset.f02Clip=String(challenger.root.userData.clip);
                canvas.dataset.f02Arms=JSON.stringify(challenger.root.userData.armExtensions);
              }
            },
            dispose(){challenger.dispose();disposeSubtree(procedural.root);stage.clear();},
          };
          earlyRevision.update(state,0,reducedMotion);
          tintVellumEdges(Number(stage.userData.inkAdvance));
        }
        if(index===2){
          const folioRig=rig;
          const oldNodes=[...rig.children];
          const legacyTabs=[...earlyPaperTabs];
          const staged=makeF03CandidateStage(()=>{
            if(currentFolio!==2||rig!==folioRig)return;
            for(const tab of legacyTabs)folioRig.attach(tab);
            oldNodes.forEach(n=>{n.visible=false;});
            earlyPaperTabHits.push(...staged.controls);
            canvas.dataset.blenderFolio='03';
            staged.root.userData.template=REVISION_VAULT_TEMPLATES[state.f03.template].name;
          },()=>{if(rig===folioRig)canvas.dataset.blenderFolio='unavailable';});
          rig.add(staged.root);
          earlyRevision={root:staged.root,update:(current,dt,reduce)=>{
            if(staged.root.userData.assetState!=='ready')procedural.update(current,dt,reduce);
            staged.update(current,dt,reduce);
            if(rig===folioRig&&staged.root.userData.assetState==='ready'){
              const {template,generation,sourceVisible,outputVisible,sourceRoll,printedProfileVertices,profileKey,geometrySignature,folded,pressDepth,sleeveOpen}=staged.root.userData;
              canvas.dataset.f03WorkshopState=JSON.stringify({template,generation,sourceVisible,outputVisible,sourceRoll,printedProfileVertices,profileKey,geometrySignature,folded,pressDepth,sleeveOpen});
            }
          },dispose:()=>{staged.dispose();procedural.root.removeFromParent();disposeSubtree(procedural.root);}};
        }
      }
      if(index===0&&earlyRevision){rig.add(earlyRevision.root);earlyRevision.update(state,0,reducedMotion);}
    }
  } else if(renderer){
    book();
    if(!paperShadow)paperShadow=makeContactShadow();
    const laterIndex=index as LaterFolioIndex;
    laterWorld=createLaterFolio(laterIndex,fiber,paperShadow,laterStates[laterIndex-FIRST_LATER_FOLIO]);
    rig.add(laterWorld.root);
    // Build the separate physical back-stage from the same folio-specific A/B/C
    // state, without modifying canonical figures, authored sculptures, or voice.
    livingStagecraft=new LivingStagecraft(laterIndex);
    livingStagecraft.sync(laterStates[laterIndex-FIRST_LATER_FOLIO]);
    rig.add(livingStagecraft.root);
    const art=laterIndex<=5?createRevisionWar1Art(laterIndex as 3|4|5,laterWorld)
      :laterIndex<=9?createRevisionWar2Art(laterIndex as 6|7|8|9,laterWorld)
      :createRevisionAftermathArt(laterIndex as 10|11,laterWorld);
    laterRevision=art;
    laterWorld.root.add(art.root);
    art.update(laterStates[laterIndex-FIRST_LATER_FOLIO],0,reducedMotion);
    if(index===3){
      const folioRig=rig;
      const legacy=[...folioRig.children];
      const staged=makeF04CandidateStage(f04ExpansionFrame,frame=>{
        if(rig===folioRig)f04ExpansionFrame=frame;
      },()=>{
        if(rig!==folioRig||currentFolio!==3)return;
        staged.update(laterStates[0],0,reducedMotion);
        for(const node of legacy)node.visible=false;
        canvas.dataset.blenderFolio='04';
      },()=>{if(rig===folioRig)canvas.dataset.blenderFolio='unavailable';});
      staged.root.userData.interactables=staged.controls;
      folioRig.add(staged.root);
      const priorOwner=laterRevision;
      laterRevision={root:staged.root,update:(actual,dt,reduce)=>{
        if(staged.root.userData.assetState==='ready'){
          staged.update(actual,dt,reduce);
          const {colonyFrame,expansionFrame,foldFrame,litPlanets,litEchoes,expansion,
            colonySignal,pulseSegment,pulseAlong,relaysUnfolded,unfinishedLaneDark}=staged.root.userData;
          canvas.dataset.f04CandidateState=JSON.stringify({colonyFrame,expansionFrame,foldFrame,litPlanets,litEchoes,expansion,
            colonySignal,pulseSegment,pulseAlong,relaysUnfolded,unfinishedLaneDark});
        }else art.update(actual,dt,reduce);
      },dispose:()=>{staged.dispose();disposeRevision(priorOwner);}};
    }
    if(index===4){
      const folioRig=rig;
      const legacy=[...folioRig.children];
      const staged=makeF05CandidateStage(()=>{
        if(rig!==folioRig||currentFolio!==4)return;
        staged.update(laterStates[1],0,reducedMotion);
        for(const node of legacy)node.visible=false;
        canvas.dataset.blenderFolio='05';
      },()=>{if(rig===folioRig)canvas.dataset.blenderFolio='unavailable';});
      staged.root.userData.interactables=staged.controls;
      folioRig.add(staged.root);
      const priorOwner=laterRevision;
      laterRevision={root:staged.root,update:(actual,dt,reduce)=>{
        if(staged.root.userData.assetState==='ready'){
          staged.update(actual,dt,reduce);
          const {ring,step,record,planetPhase,orbitalPhase,factory}=staged.root.userData;
          canvas.dataset.f05CandidateState=JSON.stringify({ring,step,record,planetPhase,orbitalPhase,factory});
        }else art.update(actual,dt,reduce);
      },dispose:()=>{staged.dispose();disposeRevision(priorOwner);}};
    }
    if(index===5){
      const folioRig=rig;
      const legacy=[...folioRig.children];
      const staged=makeF06CandidateStage(fiber,()=>{
        if(rig!==folioRig||currentFolio!==5)return;
        staged.update(laterStates[2],0,reducedMotion);
        for(const node of legacy)node.visible=false;
        canvas.dataset.blenderFolio='06';
      },()=>{if(rig===folioRig){for(const node of legacy)node.visible=true;canvas.dataset.blenderFolio='unavailable';}});
      staged.root.userData.interactables=staged.controls;
      folioRig.add(staged.root);
      const priorOwner=laterRevision;
      laterRevision={root:staged.root,update:(actual,dt,reduce)=>{
        if(staged.root.userData.assetState==='ready'){
          staged.update(actual,dt,reduce);
          const {era,ledgerEra,specimenId,cFrame,ledgerOpen,wheelDetent,ledgerJiggle,nativeLedgerLeaves,authoredBlankCasualtyCell,physicalBlankApertures,specimenYaw,wearMask,routeLayerCount,paperRipple}=staged.root.userData;
          canvas.dataset.f06CandidateState=JSON.stringify({era,ledgerEra,specimenId,cFrame,ledgerOpen,wheelDetent,ledgerJiggle,nativeLedgerLeaves,authoredBlankCasualtyCell,physicalBlankApertures,specimenYaw,wearMask,routeLayerCount,paperRipple});
        }else art.update(actual,dt,reduce);
      },dispose:()=>{staged.dispose();disposeRevision(priorOwner);}};
    }
    if(index===6){
      const folioRig=rig;
      const legacy=[...folioRig.children];
      const staged=makeF07CandidateStage(phase=>{
        if(rig!==folioRig||currentFolio!==6)return;
        if(phase==='fallback'){canvas.dataset.blenderFolio='unavailable';return;}
        if(phase!=='ready')return;
        // The already-approved supplementary relief actors exist only here.
        // Their bench is relocated onto the new dark page; the procedural
        // vignette beneath supplies is not duplicated by the Blender GLB.
        folioRig.add(art.root);
        const relief=art.root.getObjectByName('F07 · illustrated Administration relief supplies');
        relief?.position.set(-3.66,.19,1.055);
        relief?.scale.setScalar(1.23);
        staged.update(laterStates[3],0,reducedMotion);
        for(const node of legacy)node.visible=false;
        canvas.dataset.blenderFolio='07';
      });
      staged.root.userData.interactables=staged.controls;
      folioRig.add(staged.root);
      const priorOwner=laterRevision;
      laterRevision={root:staged.root,update:(actual,dt,reduce)=>{
        if(staged.root.userData.assetState==='ready'){
          staged.update(actual,dt,reduce);
          art.root.userData.f07RubyShadow=staged.audit.rubyShadow;
          art.update(actual,dt,reduce);
          const relief=art.root.getObjectByName('F07 · illustrated Administration relief supplies');
          canvas.dataset.f07CandidateState=JSON.stringify({...staged.audit,
            reliefActors:Number(Boolean(art.root.getObjectByName('F07 · anonymous relief worker')))+
              Number(Boolean(art.root.getObjectByName('F07 · anonymous recipient'))),
            reliefParcelX:relief?.userData.parcelX,reliefWorkClock:relief?.userData.workClock,
            reliefPassed:relief?.userData.passed,
          });
        }else art.update(actual,dt,reduce);
      },dispose:()=>{staged.dispose();disposeRevision(priorOwner);}};
    }
    if(index===7&&laterWorld instanceof F08FolioWorld){
      const stageOwner=rig, world=laterWorld, scenic=livingStagecraft;
      const staged=makeF08CandidateStage(()=>{
        if(rig!==stageOwner||currentFolio!==7)return;
        mountF08FunctionalTheatre(art.root);
        world.mountBlenderTheatre();
        scenic.root.visible=false;
        staged.update(laterStates[4],0,reducedMotion);
        canvas.dataset.blenderFolio='08';
      },()=>{if(rig===stageOwner)canvas.dataset.blenderFolio='unavailable';});
      stageOwner.add(staged.root);
      laterRevision={root:staged.root,update(actual,dt,reduce){
        staged.update(actual,dt,reduce);
        if(staged.root.userData.assetState==='ready')art.root.userData.authoredCue=staged.root.userData.cueTime;
        art.update(actual,dt,reduce);
        if(rig===stageOwner&&staged.root.userData.assetState==='ready'){
          const {authoredFrames,rings,shutterFrames,leafFrames,comparison}=staged.root.userData;
          const {portalPower:plasma,portalCue,collarPower,rimPower,foldLight,marcelLight}=art.root.userData;
          canvas.dataset.f08CandidateState=JSON.stringify({authoredFrames,rings,shutterFrames,leafFrames,comparison,
            plasma,portalCue,collarPower,rimPower,foldLight,marcelLight});
        }
      },dispose(){staged.dispose();art.dispose();}};
    }
    if(index===8&&laterWorld instanceof F09FolioWorld){
      const stageOwner=rig,world=laterWorld;
      const staged=makeF09CandidateStage((pull,star,absence)=>{
        if(rig!==stageOwner||currentFolio!==8)return;
        const state=laterStates[8-FIRST_LATER_FOLIO];
        staged.update(state,0,reducedMotion);
        if(typeof staged.root.userData.authorFrame!=='number')return;
        world.mountBlenderModel(pull,star,absence);
        mountF09FunctionalTheatre(art.root,F09_MODEL_CENTER);
        art.root.userData.f09AuthoredFrame=staged.root.userData.authorFrame;
        art.update(state,0,reducedMotion);
        canvas.dataset.blenderFolio='09';
      },()=>{if(rig===stageOwner&&currentFolio===8)canvas.dataset.blenderFolio='unavailable';});
      world.root.add(staged.root);
      laterRevision={root:staged.root,update(actual,dt,reduce){
        staged.update(actual,dt,reduce);
        if(canvas.dataset.blenderFolio==='09'&&rig===stageOwner){
          art.root.userData.f09AuthoredFrame=staged.root.userData.authorFrame;
        }
        art.update(actual,dt,reduce);
        if(canvas.dataset.blenderFolio==='09'&&rig===stageOwner){
          const {authorFrame,modelState,foldDegrees,filamentTravel,activeFilamentMorphs,environmentalBeat,petalDegrees,gimbal}=staged.root.userData;
          canvas.dataset.f09CandidateState=JSON.stringify({
            authorFrame,modelState,foldDegrees,filamentTravel,activeFilamentMorphs,environmentalBeat,petalDegrees,gimbal,
            waves:art.root.userData.f09WholePaperWaves,
            witness:art.root.userData.f09Witness,slivers:art.root.userData.f09InwardSlivers,
            latched:actual.interactions.A.locked,historicalStep:actual.interactions.B.step,survey:actual.interactions.C.active,
          });
        }
      },dispose(){staged.dispose();staged.root.removeFromParent();art.dispose();}};
    }
    if(index===11&&laterWorld instanceof F12FolioWorld){
      const stageOwner=rig,world=laterWorld,scenic=livingStagecraft;
      let mounted=false;
      const recruitment=art.root.getObjectByName('living-f12-recruitment-mechanism');
      const stamp=art.root.getObjectByName('living-f12-administration-endorsement-stamp');
      const fallbackLeaf=art.root.getObjectByName('living-f12-final-archive-leaf');
      const staged=makeF12CandidateStage(()=>{
        if(rig!==stageOwner||currentFolio!==11)return;
        staged.update(laterStates[8],0,reducedMotion);
        if(!recruitment||!stamp||!fallbackLeaf)throw Error('F12 recruitment/stamp mounting incomplete');
        world.mountLivingBlender(stageOwner);
        stageOwner.add(art.root);art.root.visible=true;
        recruitment.position.set(-1.61,.265,-.41);
        stamp.position.set(4.015,.285,1.84);stamp.scale.setScalar(.64);
        fallbackLeaf.visible=false;scenic.root.visible=false;
        canvas.dataset.blenderFolio='12';mounted=true;
      },()=>{if(rig===stageOwner)canvas.dataset.blenderFolio='unavailable';});
      staged.root.userData.interactables=staged.controls;
      stageOwner.add(staged.root);
      laterRevision={root:staged.root,update(actual,dt,reduce){
        art.update(actual,dt,reduce);staged.update(actual,dt,reduce);
        if(mounted&&rig===stageOwner){
          const {claimFrame,archiveFrame,splitDistance,archiveAngle,horizonPieces,creaseFixed}=staged.root.userData;
          canvas.dataset.f12CandidateState=JSON.stringify({claimFrame,archiveFrame,splitDistance,archiveAngle,horizonPieces,creaseFixed,
            study:world.symbolicStudyState(),role:art.root.userData.role,stampPresent:art.root.visible&&stamp?.visible===true,recruitmentPresent:art.root.visible&&recruitment?.visible===true});
        }
      },dispose(){staged.dispose();if(mounted)world.unmountLivingBlender();art.root.removeFromParent();art.dispose();}};
    }
  }
  ambientLight.intensity=index===2?0.46:0.78;
  keyLight.intensity=index===2?2.66:1.96;rimLight.intensity=index===2?0.56:0.97;
  overhead.intensity=index===2?2.2:13.5;
  if(renderer)renderer.toneMappingExposure=index===2?1.18:1.24;
  if(!deferCameraReset){binding.setPageIndex(index);resetCamera();}
  updateNav();
  // A page change must never expose the story through a closed cover or
  // re-enable orbit controls while an actual paper leaf is moving.
  rig.visible=bookPhase==='open'||bookPhase==='opening'&&coverAnimation>0.57;
  if(controls && (bookPhase!=='open'||physicalTurn))controls.enabled=false;
  canvas.dataset.authoredSculptures=String(authoredFigureCount);
  canvas.dataset.sourceAuthoredScene=String(index>=FIRST_LATER_FOLIO&&index<CODA_INDEX);
  if(index===CODA_INDEX)announce('Closing imprint. '+ADMINISTRATION_SLOGAN);
  else{
    announce(`Folio ${index+1} of 12. ${index<3?(overviewCopy as readonly string[])[index]:revisionCopy(index as LaterFolioIndex).description}`);
    sendBridge('folio',index);
  }
}
function smooth(value:number,target:number,dt:number):number {
  return reducedMotion?target:THREE.MathUtils.damp(value,target,5.8,Math.min(dt,0.07));
}
function animate(dt:number):void {
  if(currentFolio===CODA_INDEX){
    if(closingWall)canvas.dataset.closingBeat=closingWall.update(dt,reducedMotion);
    return;
  }
  earlyRevision?.update(state,dt,reducedMotion);
  if(currentFolio===1&&earlyRevision){
    const advance=Number(earlyRevision.root.userData.inkAdvance);
    tintVellumEdges(advance);
    canvas.dataset.inkAdvance=String(advance);
  }
  if(currentFolio<FIRST_LATER_FOLIO)animateEarlyPaperTabs(dt);
  if(currentFolio>=FIRST_LATER_FOLIO){
    activeTime+=dt;
    if(!((currentFolio===3&&canvas.dataset.blenderFolio==='04')||(currentFolio===6&&canvas.dataset.blenderFolio==='07'))){
      laterWorld?.update(dt,activeTime,reducedMotion);
      livingStagecraft?.update(dt,reducedMotion);
    }
    laterRevision?.update(laterStates[currentFolio-FIRST_LATER_FOLIO],dt,reducedMotion);
    if(currentFolio===9&&laterRevision?.root.userData.f10AssetState==='ready'){
      const f10=laterRevision.root.userData;
      canvas.dataset.blenderFolio='10';
      canvas.dataset.f10CandidateState=JSON.stringify({hinges:f10.f10Hinges,lift:f10.f10Lift,captured:f10.f10Captured,wave:f10.f10Wave,story:f10.f10Story});
    }
    if(currentFolio===10&&laterRevision){
      const evidence=laterRevision.root.userData;
      canvas.dataset.revisionPhase=String(evidence.phase);
      if(evidence.blenderState==='ready'){
        canvas.dataset.blenderFolio='11';
        canvas.dataset.f11AuthoredFrame=String(evidence.authoredFrame);
        canvas.dataset.f11Story=JSON.stringify(evidence.f11Story);
      }
    }
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
    for(const {group,stage} of earlyRevision ? [] : galaxyLayers){
      const open=state.f02.reveal>=stage;
      if(open)group.visible=true;
      group.rotation.x=smooth(group.rotation.x,open?(-0.40-(stage*0.16)):0,dt);
      group.scale.y=smooth(group.scale.y,open?1:0.001,dt);
      if(!open&&group.scale.y<0.02)group.visible=false;
    }
    if(galaxyPaperLoom&&!earlyRevision){
      const expanded=state.f02.reveal===3;
      if(expanded)galaxyPaperLoom.visible=true;
      galaxyPaperLoom.scale.y=smooth(galaxyPaperLoom.scale.y,expanded?1:0.001,dt);
      if(!expanded&&galaxyPaperLoom.scale.y<0.018)galaxyPaperLoom.visible=false;
    }
    if(paperHinges[0]&&!earlyRevision)paperHinges[0].rotation.x=smooth(paperHinges[0].rotation.x,state.f02.reveal>0?-0.24:0,dt);
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
  if(currentFolio===CODA_INDEX)return;
  if(currentFolio>=FIRST_LATER_FOLIO){
    if(inspection!=='overview'){announce('Return to the overview before operating a mechanism.');return;}
    const idx=currentFolio-FIRST_LATER_FOLIO;
    const next=operateLater(laterStates[idx],slot);
    laterStates[idx]=next;saveLaterStudy();
    laterWorld?.syncState(next,activeSpecimen(next),activeTime);
    livingStagecraft?.sync(next);
    updateNav();
    if(!renderer)fallbackPage(currentFolio);
    announce(`${revisionCopy(currentFolio as LaterFolioIndex).actions[slot==='A'?0:slot==='B'?1:2]}. ${indicator.textContent}`);
    return;
  }
  if(inspection!=='overview'){
    announce('Return to the book overview before operating a paper mechanism.');return;
  }
  const before=state;state=activateSlot(state,slot);
  studyStates[state.folio]=state;
  saveStudy();
  if(state.folio===2&&(slot==='B'||slot==='C')){
    if(!earlyRevision)redrawPlanets();if(slot==='C')printPulse=reducedMotion?0:1;
  }
  updateNav();
  if(!renderer)fallbackPage(currentFolio);
  if(state.folio===1)announce(`Stellar assembly now shows stage ${state.f02.reveal} of 3.`);
  else if(state.folio===2)announce(`Source plate ${state.f03.template+1}; bounded variation ${state.f03.generation}.`);
  else announce(`${actionCopy[0][slot==='A'?0:slot==='B'?1:2]}: ${JSON.stringify(state.f01)}.`);
  if(before===state)throw Error('Folio state failed to advance');
}
function resetStudy():void{
  if(inspection!=='overview')leaveMini();
  studyStates=restoreFolioStudy(null);
  laterStates=restoreLaterStudy(null);f04ExpansionFrame=null;resetF06TerrainWear();
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
    beginFlight(new THREE.Vector3(1.47,1.71,1.86),new THREE.Vector3(.17,1.02,-.66),'witness');
    announce('Entering the paper galaxy. The first stars are held between the folds of the book. Return with G.');
  }else{
    witnessActive=false;
    beginFlight(witnessCamera?.position.clone()??new THREE.Vector3(0,6.5,9.9),witnessCamera?.target.clone()??new THREE.Vector3(0,0.25,0),'overhead');
    witnessCamera=null;
    announce('Returning to the open book.');
  }
  setWitnessButton();
}
function fitBookCamera(openProgress:number):void {
  // The sealed book and the open stage need different composition. Fit the
  // actual page width inside portrait viewports instead of cropping its
  // covers, while preserving the inspectable original book geometry.
  const aspect=Math.max(0.35,canvas.clientWidth/Math.max(1,canvas.clientHeight));
  const closedScale=Math.max(0.82,0.76/aspect);
  const openScale=Math.max(1,1.28/aspect);
  const scale=THREE.MathUtils.lerp(closedScale,openScale,
    THREE.MathUtils.clamp(openProgress,0,1));
  if(currentFolio===CODA_INDEX&&openProgress>.99){
    const {distance,focusY,focusZ}=closingReadingPose(aspect);
    camera.position.set(.028*distance,focusY+.38*distance,focusZ+.924*distance);
    controls?.target.set(0,focusY,focusZ);
  }else if(currentFolio===1&&openProgress>.99){
    // Read the low warm Zentrum hardware and the taller blue open Geode as
    // foreground / middle stage, against the raised spiral in the rear.
    camera.position.set(3.05*scale,7.34*scale,9.92*scale);
    controls?.target.set(0,.40,.08);
  }else if(currentFolio===9&&openProgress>.99){
    const witnessScale=scale*THREE.MathUtils.lerp(.68,.98,THREE.MathUtils.smoothstep(aspect,.52,1.28));
    camera.position.set(.20*witnessScale,6.18*witnessScale,9.05*witnessScale);
    controls?.target.set(.38,.42,.05);
  }else if(currentFolio===2&&openProgress>.99){
    camera.position.set(4.0*scale,7.4*scale,9.8*scale);
    controls?.target.set(0,.56,.08);
  }else if(currentFolio===10&&openProgress>.99){
    // F11 action and all three levers live near the gutter. On narrow screens
    // frame the populated stock rather than shrinking it to fit blank margins.
    const storyScale=scale*THREE.MathUtils.lerp(.66,.96,THREE.MathUtils.smoothstep(aspect,.52,1.28));
    camera.position.set(0,6.05*storyScale,8.85*storyScale);
    controls?.target.set(0,.54,.02);
  }else if(currentFolio===4&&openProgress>.99){
    camera.position.set(.55*scale,6.9*scale,9.25*scale);
    controls?.target.set(0,.38,.10);
  }else if(currentFolio===6&&openProgress>.99&&aspect<.85){
    // Tighter, steeper whole-spread framing keeps the painted field and
    // the small foreground relief readable together on a portrait phone.
    const readingScale=Math.max(1,1.17/aspect);
    camera.position.set(.20*readingScale,7.2*readingScale,9.4*readingScale);
    controls?.target.set(-.06,.34,.06);
  }else{
    const angleF01=currentFolio===0?THREE.MathUtils.clamp(openProgress,0,1):0;
    camera.position.set(0.58*angleF01*scale,(6.5+1.30*angleF01)*scale,(9.9-0.75*angleF01)*scale);
    controls?.target.set(0,0.25,0);
  }
  // OrbitControls otherwise clamps the responsive portrait fit back to its
  // original 19-unit desktop cap, cropping both physical page corners.
  if(controls)controls.maxDistance=Math.max(19,camera.position.distanceTo(controls.target)+5);
  camera.updateProjectionMatrix();
}
function resetCamera():void {
  cameraFlight=null;witnessActive=false;witnessCamera=null;
  if(!controls)return;
  controls.enabled=true;
  fitBookCamera(bookPhase==='open'?1:coverAnimation);
  controls.minDistance=1.2;controls.maxDistance=Math.max(19,camera.position.distanceTo(controls.target)+5);controls.maxPolarAngle=1.51;controls.update();
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
  if(bookPhase==='closed'){openPhysicalCover();return;}
  if(bookPhase!=='open' || physicalTurn)return;
  if(inspection!=='overview')leaveMini();
  const next=currentFolio+direction;
  if(!playableIndex(next))return;
  // Non-WebGL readers still have explicit page controls; the living 3D book
  // uses the same curled cardstock transition as direct mouse/touch dragging.
  if(!renderer){goFolio(next);fallbackPage(next);return;}
  beginPhysicalTurn(direction as -1|1,null,0);
}
function handleKeys(event:KeyboardEvent):void {
  const target=event.target as HTMLElement;
  const k=event.key.toLowerCase();
  // Escape is a universal exit, including when a movable panel button owns focus.
  if(k==='escape' && witnessActive){toggleWitness();return;}
  if(k==='escape' && inspection!=='overview'){leaveMini();return;}
  if(k==='escape' && bridgeEmbedded){event.preventDefault();sendBridge('exit',currentFolio);return;}
  if(target.closest('button,input,textarea,select,[contenteditable]'))return;
  if(bookPhase==='closed'){
    if(k==='enter'||k===' '){event.preventDefault();openPhysicalCover();}
    return;
  }
  if(bookPhase==='opening' || physicalTurn)return;
  if(['arrowleft','arrowright','a','b','c','m','i','w','s','d'].includes(k)&&event.target===canvas)event.preventDefault();
  if(event.repeat&&['m','i','arrowleft','arrowright','a','b','c'].includes(k))return;
  if(k==='arrowleft'&&inspection==='overview')nextFolio(-1);
  else if(k==='arrowright'&&inspection==='overview')nextFolio(1);
  else if(currentFolio===CODA_INDEX)return;
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
  if((bookPhase!=='open'||currentFolio===CODA_INDEX) && inspection==='overview')fitBookCamera(coverAnimation);
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
  const coda=index===CODA_INDEX;
  const codaText=fallback.querySelector<HTMLElement>('#coda-fallback');
  if(codaText)codaText.hidden=!coda;
  const isLater=index>=FIRST_LATER_FOLIO&&!coda;
  if(index<3){
    const paragraph=fallback.querySelectorAll<HTMLElement>('[data-folio-text]')[index];
    if(paragraph&&index!==0)paragraph.textContent=overviewCopy[index];
  }
  const paragraphs=fallback.querySelectorAll<HTMLElement>('[data-folio-text]');
  paragraphs.forEach((p,i)=>p.hidden=coda||isLater||i!==index);
  fallback.querySelectorAll<SVGGElement>('[data-fb-folio]').forEach((g,i)=>{
    const visible=!coda&&!isLater&&i===index;
    g.toggleAttribute('hidden',!visible);
    g.style.display=visible?'':'none';
  });
  const originalArt=fallback.querySelector<SVGSVGElement>('svg:not(#later-plate-art)');
  if(originalArt){
    originalArt.toggleAttribute('hidden',isLater||coda);
    const paper=folioStock(index,index===1&&state.f02.reveal===3);
    originalArt.querySelector('#living-stock-light')?.setAttribute('stop-color',cssStock(paper.face));
    originalArt.querySelector('#living-stock-shade')?.setAttribute('stop-color',cssStock(isDarkStock(paper)?paper.edge:paper.cut));
    originalArt.setAttribute('data-dark-stock',String(isDarkStock(paper)));
  }
  const laterArt=fallback.querySelector<SVGSVGElement>('#later-plate-art');
  if(laterArt){
    laterArt.toggleAttribute('hidden',!isLater);
    if(isLater){
      const scene=laterArt.querySelector<SVGGElement>('#later-plate-scene');
      if(scene){
        scene.innerHTML=revisionDiagram(index,laterStates[index-FIRST_LATER_FOLIO].interactions.A.active)??getLaterDiagram(index);
        scene.firstElementChild?.setAttribute('fill',cssStock(folioStock(index).face));
      }
    }
  }
  const plate=fallback.querySelector<HTMLElement>('#later-fallback');
  if(plate){
    plate.hidden=!isLater;
    if(isLater){
      const copy=revisionCopy(index as LaterFolioIndex);
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
  if(index===1){
    fallback.querySelectorAll<SVGElement>('[data-reveal-stage]').forEach(el=>{
      el.style.display=state.f02.reveal>=Number(el.dataset.revealStage)?'':'none';
    });
    if(state.f02.reveal===0)indicator.textContent='No stars yet. Activate A to spread the ink and reveal the first points.';
  }
}
function destroy():void {
  cancelAnimationFrame(frame);
  window.removeEventListener('keydown',handleKeys);
  window.removeEventListener('keyup',releaseKey);
  window.removeEventListener('resize',resize);
  window.removeEventListener('message',onBridgeMessage);
  canvas.removeEventListener('pointerdown',onPaperPointerDown);
  canvas.removeEventListener('pointerup',onPaperPointerUp);
  canvas.removeEventListener('pointercancel',onPaperPointerCancel);
  canvas.removeEventListener('pointerdown',onPhysicalPointerDown,true);
  canvas.removeEventListener('pointermove',onPhysicalPointerMove,true);
  canvas.removeEventListener('pointerup',onPhysicalPointerUp,true);
  canvas.removeEventListener('pointercancel',onPhysicalPointerCancel,true);
  discardOutgoingStage();
  clear();binding.dispose();controls?.dispose();renderer?.dispose();sharedMats.forEach(m=>m.dispose());fiber.dispose();paperShadow?.dispose();
}
wireButtons();
window.addEventListener('message',onBridgeMessage);
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  const gl=renderer.getContext();
  const gpuInfo=gl.getExtension('WEBGL_debug_renderer_info');
  const gpuName=String(gl.getParameter(gpuInfo?gpuInfo.UNMASKED_RENDERER_WEBGL:gl.RENDERER));
  const softwareRenderer=/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName);
  renderer.setPixelRatio(softwareRenderer?0.85:Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.24;
  renderer.shadowMap.enabled=!softwareRenderer;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  keyLight.castShadow=!softwareRenderer;
  keyLight.shadow.mapSize.set(softwareRenderer?256:1024,softwareRenderer?256:1024);
  keyLight.shadow.camera.left=-8;keyLight.shadow.camera.right=8;
  keyLight.shadow.camera.top=7;keyLight.shadow.camera.bottom=-7;
  keyLight.shadow.normalBias=0.024;
  controls=new OrbitControls(camera,canvas);
  controls.enableDamping=!reducedMotion;controls.enablePan=true;
  controls.panSpeed=0.58;controls.screenSpacePanning=true;
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
  controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
  canvas.addEventListener('pointerdown',(event)=>{if(controls)controls.mouseButtons.LEFT=event.shiftKey?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;},{capture:true});
  canvas.addEventListener('pointerdown',onPhysicalPointerDown,{capture:true});
  canvas.addEventListener('pointermove',onPhysicalPointerMove,{capture:true});
  canvas.addEventListener('pointerup',onPhysicalPointerUp,{capture:true});
  canvas.addEventListener('pointercancel',onPhysicalPointerCancel,{capture:true});
  canvas.addEventListener('pointerdown',onPaperPointerDown);
  canvas.addEventListener('pointerup',onPaperPointerUp);
  canvas.addEventListener('pointercancel',onPaperPointerCancel);
  controls.minDistance=1.2;controls.maxDistance=19;
  controls.maxPolarAngle=1.51;
  window.addEventListener('keydown',handleKeys);
  window.addEventListener('keyup',releaseKey);
  window.addEventListener('resize',resize);
  window.addEventListener('pagehide',destroy,{once:true});
  goFolio(initialFolio);resize();updateInspectButton();
  fitBookCamera(coverAnimation);
  binding.setCoverProgress(coverAnimation);
  rig.visible=!startWithClosedCover;
  if(startWithClosedCover && controls)controls.enabled=false;
  function step(now:number):void {
    const dt=lastTime?Math.min(0.06,(now-lastTime)/1000):0;
    lastTime=now;
    updatePhysicalBinding(dt);animate(dt);moveMini(dt);advanceFlight(dt);revealTick();controls?.update();renderer?.render(scene,camera);
    frame=requestAnimationFrame(step);
  }
  frame=requestAnimationFrame(step);
}catch(error){
  console.error('PALIMPSEST preview: WebGL unavailable',error);
  controls?.dispose();controls=null;renderer?.dispose();renderer=null;
  canvas.hidden=true;fallback.hidden=false;
  // The accessible illustrated edition cannot expose a 3D click target.
  bookPhase='open';coverAnimation=1;
  binding.setCoverProgress(1);rig.visible=true;
  document.getElementById('book-stage')?.classList.add('no-webgl');
  canvas.dataset.bookPhase='open';
  // The fallback remains an editorial, interactive read-only review; it has no automatic secret disclosure.
  window.addEventListener('keydown',handleKeys);
  window.addEventListener('keyup',releaseKey);
  goFolio(initialFolio);fallbackPage(initialFolio);
}
