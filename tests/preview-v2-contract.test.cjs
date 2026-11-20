const assert = require('node:assert/strict');
const fs = require('node:fs');
const src = fs.readFileSync('src/vnext/previewV2.ts', 'utf8');
const pure = fs.readFileSync('src/vnext/folioLogic.ts', 'utf8');
const html = fs.readFileSync('folio-vnext.html', 'utf8');
const f01 = src.split('function buildF01():void {')[1]?.split('function spiralInstances')[0];
const f02 = src.split('function buildF02():void {')[1]?.split('function buildF03():void {')[0];
const f03 = src.split('function buildF03():void {')[1]?.split('function redrawPlanets():void {')[0];
const checks = [
  ['F01 world defined', !!f01],
  ['F01 no stellar instances or globe', !!f01 && !/spiralInstances|SphereGeometry|InstancedMesh|skyTexture|StarGeometry/.test(f01)],
  ['F02 star instances', !!f02 && f02.includes('spiralInstances')],
  ['F02 stars begin hidden', !!f02 && f02.includes('leaf.visible=false')],
  ['F02 progressive stages', src.includes('state.f02.reveal>=stage')],
  ['F02 Zentrum and Geode', !!f02 && f02.includes("'ZENTRUM'") && f02.includes("'DIGITAL GEODE'")],
  ['F01 exact testimony', !!f01 && f01.includes('He murdered her.')],
  ['F02 corrected testimony', !!f02 && f02.includes('NiAlBu still watches her die.') && f02.includes('Again and again.')],
  ['F01/F02 testimony not public narrator', !/NarrationEngine|narrationEngine|speechSynthesis|speak\(/.test(src)],
  ['F02 inspection specifically in Geode', src.includes("inspection='geode'") && src.includes("mayReveal(isF01?'f01-testimony':'f02-testimony'")],
  ['F03 generated family variation', !!f03 && f03.includes('redrawPlanets()') && src.includes('planetPattern(state.f03.template,state.f03.generation+i)')],
  ['F03 no unapproved secret wording', !src.includes('He could not create. He locked away the templates.')],
  ['Physical paper construction', src.includes('paperHinge') && src.includes('THREE.InstancedMesh')],
  ['State isolated in a namespaced preview session', !/localStorage/.test(src) && src.includes("const STUDY_STORAGE_KEY='palimpsest.folio.review.study-state.v1'") && src.includes('sessionStorage.setItem(STUDY_STORAGE_KEY,JSON.stringify({version:1,folios:studyStates}))')],
  ['Only validated folio state restores, not testimony', src.includes('restoreFolioStudy(') && pure.includes('return restoreFolioStudy') === false && !/discoveredSecrets:/.test(pure.split('export function restoreFolioStudy')[1] ?? '')],
  ['Accessibility: text fallback', html.includes('id="webgl-fallback"') && src.includes('if(!renderer){')],
  ['Accessibility: on-screen movement and live region', html.includes('data-move="w"') && html.includes('aria-live="polite"')],
  ['Reduced motion and DPR cap', src.includes('prefers-reduced-motion') && src.includes('Math.min(window.devicePixelRatio||1,1.6)')],
  ['Resource disposal', src.includes('disposeSubtree') && src.includes('texture.dispose()') && src.includes('renderer?.dispose()')],
  ['Three distinct template families', pure.includes('TEMPLATE_COUNT = sourceTemplates.length')],
  ['No global manuscript editing', !/historyManifest|atlasStore|DRAXIS_21/.test(src)],
];
for (const [label, good] of checks) assert.ok(good, label);
console.log(`PASS: ${checks.length} F01-F03 review-preview code contracts`);
