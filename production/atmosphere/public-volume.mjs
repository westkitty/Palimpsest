import {fileURLToPath} from 'node:url';
import {buildSync} from 'esbuild';
import {
  createMisunderstandingScene,
  misunderstandingActions,
  misunderstandingDescription,
  misunderstandingFallback,
  misunderstandingTitle,
} from './great-misunderstanding.mjs';

// Slots 0–11 remain the incumbent source identities; slot 12 remains its coda.
// The inserted historical spread alone uses slot 13. Only the navigation and
// presentation boundaries see public positions.
export function bindPublicVolume(patch) {
  const contracts = buildSync({
    stdin: {
      contents: 'export * from "./src/vnext/publicFolioMap"; export * from "./src/vnext/greatMisunderstandingState";',
      resolveDir: fileURLToPath(new URL('../..', import.meta.url)),
    },
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'palPublicContracts',
  }).outputFiles[0].text;
  const controls = 'var o8=A=>{let P=document.getElementById(A);';
  patch(controls, contracts + `
const palNewSlot=13, palCodaSlot=12;
const palNewTitle=${JSON.stringify(misunderstandingTitle)};
const palNewDescription=${JSON.stringify(misunderstandingDescription)};
const palNewActions=${JSON.stringify(misunderstandingActions)};
const palCreateNewSpread=(${createMisunderstandingScene.toString()});
let palNewState=palPublicContracts.INITIAL_MISUNDERSTANDING_STATE;
try {
  palNewState=palPublicContracts.restoreMisunderstanding(JSON.parse(sessionStorage.getItem(palPublicContracts.MISUNDERSTANDING_STUDY_KEY)));
} catch {}
function palPublicPosition(slot) {
  if(slot===palNewSlot)return palPublicContracts.NEW_PUBLIC_FOLIO_INDEX;
  if(slot===palCodaSlot)return palPublicContracts.PUBLIC_CODA_INDEX;
  return palPublicContracts.sourceToPublicIndex(slot);
}
function palSlot(position) {
  if(!palPublicContracts.isPublicPageIndex(position))return -1;
  const page=palPublicContracts.publicPage(position);
  if(page.kind==='existing')return page.sourceIndex;
  return page.kind==='coda'?palCodaSlot:palNewSlot;
}
function palAdjacent(slot,direction) {
  if(iM)return i4(slot+direction)&&slot+direction!==palNewSlot?slot+direction:-1;
  return palSlot(palPublicPosition(slot)+direction);
}
function palTotal(){return iM?12:palPublicContracts.PUBLIC_HISTORICAL_FOLIOS;}
function palDisplayPosition(slot){return iM?slot:palPublicPosition(slot);}
function palTitle(slot,title){
  return title.replace(/^F[0-9]{2}(?= )/,palNumber(slot));
}
function palEntry(embedded,number) {
  if(embedded)return Number.isInteger(number)&&number>=1&&number<=13?number-1:0;
  const slot=palSlot(number-1);
  return slot<0?0:slot;
}
function palNumber(slot) {
  return 'F'+String(palDisplayPosition(slot)+1).padStart(2,'0');
}
function palF04UI() {
  Q9.textContent=palNewTitle;
  o9.textContent=palNewDescription;
  L9.textContent=palNumber(HA)+' / F13';
  EC.disabled=bI.disabled=false;
  EC.textContent='← F03';
  bI.textContent='F05 →';
  Mg.disabled=gj.disabled=true;
  for(const [index,button] of Fv.entries()){
    const slot=button.dataset.mechanism;
    button.disabled=false;
    button.textContent=slot+' · '+palNewActions[index];
    button.setAttribute('aria-label',slot+': '+palNewActions[index]);
    const active = [palNewState.eggLanded,palNewState.templeRaised,palNewState.roofLifted][index];
    button.setAttribute('aria-pressed',String(active));
  }
  document.querySelectorAll('.chapter-lines span').forEach((line,index)=>line.classList.toggle('active',index===0));
  Hg();
  palF04Status();
}
function palF04Status() {
  const {eggLanded,templeRaised,roofLifted}=palNewState;
  const text=roofLifted?'Roof lifted. The cut edge shows layers of ground already changing.'
    :templeRaised?'Temple raised around the landed Egg.'
    :eggLanded?'The dark Egg has landed.':'Egg, temple and roof are folded.';
  _v.textContent=text;
  vA.dataset.misunderstanding=JSON.stringify(palNewState);
  for(const [id,visible] of [['egg',eggLanded],['temple',templeRaised],['soil',roofLifted]]){
    const layer=document.getElementById('misunderstanding-diagram-'+id);
    layer.style.display=visible?'':'none';
  }
  document.getElementById('misunderstanding-diagram-roof').setAttribute('transform',roofLifted?'translate(0 -22)':'');
  document.getElementById('misunderstanding-fallback-state').textContent=text;
  return text;
}
function palF04Activate(slot) {
  palNewState=palPublicContracts.activateMisunderstanding(palNewState,slot);
  try {
    sessionStorage.setItem(palPublicContracts.MISUNDERSTANDING_STUDY_KEY,
      JSON.stringify(palPublicContracts.serializeMisunderstanding(palNewState)));
  } catch {}
  palF04UI();
  AD(_v.textContent);
}
function palF04Reset() {
  palNewState=palPublicContracts.INITIAL_MISUNDERSTANDING_STATE;
  try {sessionStorage.removeItem(palPublicContracts.MISUNDERSTANDING_STUDY_KEY);} catch {}
  palF04UI();
  AD('Great Misunderstanding study reset.');
}
function palF04Mount() {
  const stage=palCreateNewSpread({Group:x,Mesh:W,Material:aA,Box:QA,Sphere:v8,Shape:qP,Paper:TI},Tj(),sw);
  stage.update(palNewState,0,true);
  zD={...stage,dispose(){sg(stage.root);}};
}
` + controls);

  patch('id="folio-progress">F01 / F03', 'id="folio-progress">F01 / F13');
  patch('<article id="later-fallback"', misunderstandingFallback + '\n      <article id="later-fallback"');
  patch('The Living Volume · F01–F12', 'The Living Volume');
  patch('FOLIO STUDY · F04–F12', 'FOLIO STUDY · F05–F13');
  patch('$v=Number.isInteger(Nz)&&Nz>=1&&Nz<=13?Nz-1:0', '$v=palEntry(iM,Nz)');
  patch('function i4(A){return xQ(A)||A===12}', 'function i4(A){return xQ(A)||A===12||A===palNewSlot}');
  patch('let w=HA+A;if(!i4(w)||!UA)', 'let w=palAdjacent(HA,A);if(!i4(w)||!UA)');
  patch('let P=HA+A;i4(P)', 'let P=palAdjacent(HA,A);i4(P)');
  patch('let P=HA<12&&Zz(A,$D.rightCornerHit)?1:HA>0&&Zz(A,$D.leftCornerHit)?-1:null',
    'let P=palAdjacent(HA,1)>=0&&Zz(A,$D.rightCornerHit)?1:palAdjacent(HA,-1)>=0&&Zz(A,$D.leftCornerHit)?-1:null');
  patch('setPageIndex(A){let P=Math.max(0,Math.min(12,Math.floor(A)));',
    'setPageIndex(A){let P=Math.max(0,Math.min(palTotal(),Math.floor(A)));');
  patch('g<Math.min(7,13-P)', 'g<Math.min(7,palTotal()+1-P)');
  patch('$D.setPageIndex(A),AL()', '$D.setPageIndex(palDisplayPosition(A)),AL()');
  patch('$D.setPageIndex(HA),UA&&', '$D.setPageIndex(palDisplayPosition(HA)),UA&&');
  patch('$D.setPageIndex(HA),N4()', '$D.setPageIndex(palDisplayPosition(HA)),N4()');
  patch('function rQ(A){return A===12?"Closing imprint":A<3?no[A]:To(A).title}',
    'function rQ(A){return A===palNewSlot?palNewTitle:A===12?"Closing imprint":A<3?no[A]:palTitle(A,To(A).title)}');
  patch('Q9.textContent=P.title,o9.textContent=P.description', 'Q9.textContent=palTitle(A,P.title),o9.textContent=P.description');
  patch('j.textContent=v.title),z&&(z.textContent=v.description', 'j.textContent=palTitle(A,v.title)),z&&(z.textContent=v.description');
  patch('function w4(){if(HA===12)', 'function w4(){if(HA===palNewSlot){palF04UI();return}if(HA===12)');
  patch('EC.textContent="\\u2190 F12"', 'EC.textContent="\\u2190 F"+palTotal()');
  patch('L9.textContent=`F${String(A+1).padStart(2,"0")} / F12`', 'L9.textContent=palNumber(A)+" / F"+palTotal()');
  patch('L9.textContent=`F0${SA.folio+1} / F12`', 'L9.textContent=palNumber(HA)+" / F"+palTotal()');
  patch('function fo(A){w4(),A===12?AD("Closing imprint. "+Iz):(AD(`Folio ${A+1} of 12. ${A<3?c4[A]:LM(A).description}`),uo("folio",A))}',
    'function fo(A){w4();if(A===12){AD("Closing imprint. "+Iz);return}const description=A===palNewSlot?palNewDescription:A<3?c4[A]:LM(A).description;AD(`Folio ${palDisplayPosition(A)+1} of ${palTotal()}. ${description}`);if(A!==palNewSlot)uo("folio",A)}');
  patch('HA=A,DM=0,vA.dataset.revisionFolio=A===12?"coda":String(A+1)',
    'HA=A,DM=0,delete vA.dataset.misunderstanding,vA.dataset.revisionFolio=A===12?"coda":A===palNewSlot?"great-misunderstanding":String(A+1),vA.dataset.publicFolio=A===12?"coda":palNumber(A)');
  patch('delete vA.dataset.f12CandidateState,A===12)RP&&y6();else if(A<3)',
    'delete vA.dataset.f12CandidateState,A===palNewSlot)RP&&palF04Mount();else if(A===12)RP&&y6();else if(A<3)');
  patch('let[P,D,w]=V4[HA];OP(A,10.02', 'let[P,D,w]=V4[HA===palNewSlot?3:HA];OP(A,10.02');
  patch('RP&&(palBG.attach(_A,A),palLiving.mount(_A,A),palEncore.mount(_A,A),palAtmosphereMount(_A,A))',
    'RP&&(A!==palNewSlot&&(palBG.attach(_A,A),palLiving.mount(_A,A),palEncore.mount(_A,A)),palAtmosphereMount(_A,A))');
  patch('if(m6(A),palBGFrame(_A,HA,A,dP)', 'if(HA===palNewSlot){zD?.update(palNewState,A,dP);return}if(m6(A),palBGFrame(_A,HA,A,dP)');
  patch('lI.setFromCamera(VQ,eP),Tg?.root.visible', 'lI.setFromCamera(VQ,eP),HA===palNewSlot){const hit=lI.intersectObjects(zD?.targets??[],false)[0];if(hit)pg(hit.object.userData.slot);return}if(Tg?.root.visible');
  patch('function pg(A){if(xP||HA===12)return;', 'function pg(A){if(xP||HA===12)return;if(HA===palNewSlot){palF04Activate(A);return}');
  patch('function u6(){if(xP)return;', 'function u6(){if(xP)return;if(HA===palNewSlot){palF04Reset();return}');
  patch('function n6(){if(jM(HA))', 'function n6(){if(HA===palNewSlot||jM(HA))');
  patch('function _g(A){let P=A===12',
    'function _g(A){const inserted=A===palNewSlot;const plate=document.getElementById("misunderstanding-fallback");plate.hidden=!inserted;if(inserted){_g(12);plate.hidden=false;X8.querySelector("#coda-fallback").hidden=true;palF04Status();return}let P=A===12');
  patch('(()=>{palAtmosphereStep(_A,HA,C);const cast=',
    '(()=>{palAtmosphereStep(_A,HA,C);if(HA===palNewSlot){delete vA.dataset.bgProof;delete vA.dataset.livingProof;delete vA.dataset.encoreProof;delete vA.dataset.castProof;RP?.render(Lg,eP);return}const cast=');
}
