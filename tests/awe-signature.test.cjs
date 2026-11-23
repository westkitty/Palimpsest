const assert = require('node:assert/strict');
const fs = require('node:fs');
const scene = fs.readFileSync('src/vnext/previewV2.ts','utf8');
const html = fs.readFileSync('folio-vnext.html','utf8');
const state = fs.readFileSync('src/vnext/folioLogic.ts','utf8');
const f01=scene.split('function buildF01():THREE.Group {')[1]?.split('function spiralInstances')[0];
const f02=scene.split('function buildF02():THREE.Group {')[1]?.split('function buildF03():void {')[0];
const f03=scene.split('function buildF03():void {')[1]?.split('function redrawPlanets():void {')[0];
const checks=[
  ['folio sequence intact',!!f01&&!!f02&&!!f03],
  ['F01 remains starless',!(/spiralInstances|SphereGeometry|InstancedMesh/.test(f01))],
  ['F02 first visible celestial bodies',f02.includes('spiralInstances')],
  ['F02 scale loom anchored to real page',f02.includes('galaxyPaperLoom=buildAllPaperLoom(fallback)') && scene.includes('createF02Challenger(state.f02.reveal')],
  ['loom made of die-cut ribbons not remote media',scene.includes('new THREE.Float32BufferAttribute(vertices,3)')&&!/https?:\/\//.test(scene)],
  ['loom only shown after final stage',scene.includes('const expanded=state.f02.reveal===3')],
  ['camera beat explicit not automatic',scene.includes("witnessButton.addEventListener('click',toggleWitness)")],
  ['camera affordance hidden until final stage',scene.includes('state.f02.reveal===3 && inspection')&&scene.includes('witnessButton.hidden=!available')],
  ['no cutscene can silently force entry',!f02.includes('toggleWitness(')&&!f02.includes('beginFlight(')],
  ['camera path one existing animation loop',(scene.match(/requestAnimationFrame\s*\(/g)??[]).length===2 && /function step\(now:number\)[\s\S]*?updatePhysicalBinding\(dt\);animate\(dt\);advanceF09Run\(dt\);moveMini\(dt\);advanceFlight\(dt\);revealTick\(\);[\s\S]*?renderer\?\.render\(scene,camera\);\s*frame=requestAnimationFrame\(step\);/.test(scene)],
  ['motion-safe direct state',scene.includes('if(reducedMotion)advanceFlight(1)')],
  ['prior view restored',scene.includes('witnessCamera={position:camera.position.clone(),target:controls.target.clone()}')&&scene.includes('witnessCamera?.position.clone()')],
  ['controls resume after camera flight',scene.includes('controls.enabled=true;\n    cameraFlight=null;')],
  ['escape key exits special view from focused controls',scene.includes("if(k==='escape' && witnessActive){toggleWitness();return;}")],
  ['button conveys current state',html.includes('id="witness"')&&scene.includes("witnessButton.setAttribute('aria-pressed',String(witnessActive))")],
  ['F03 press visual follows intentional C action',scene.includes("if(slot==='C')printPulse=reducedMotion?0:1")],
  ['F03 bounded inherited variants preserved',scene.includes('planetPattern(state.f03.template,state.f03.generation+i)')],
  ['F03 source die remains paper simulation',f03.includes('programDie=new THREE.Group()')],
  ['F01 exact concealed words unchanged',scene.includes("['He murdered her.']")],
  ['F02 exact concealed words unchanged',scene.includes("['NiAlBu still watches her die.','Again and again.']")],
  ['F02 secret remains geode-gated',scene.includes("mayReveal(isF01?'f01-testimony':'f02-testimony'")],
  ['No unapproved F03 testimony',!scene.includes('He could not create. He locked away the templates.')],
  ['No narrator coupled to discovery',!/NarrationEngine|narrationEngine|speechSynthesis|playCueSlot/.test(scene)],
  ['Draggable panel system remains separate',html.includes('data-panel-handle')&&html.includes('./src/vnext/panelDock.js')],
  ['Distinction between physical and scale view documented',html.includes('Enter the All (G)')],
  ['Multiple route files not modified in this deliverable',!scene.includes('historyManifest')&&!scene.includes('atlasStore')],
];
for(const [name,ok] of checks)assert.ok(ok,name);
console.log(`PASS: ${checks.length} AWE signature, continuity and camera-contract checks`);
