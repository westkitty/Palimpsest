const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('src/vnext/previewV2.ts','utf8');
const f01=src.split('function buildF01():void {')[1]?.split('function spiralInstances')[0];
const f02=src.split('function buildF02():void {')[1]?.split('function buildF03():void {')[0];
const f03=src.split('function redrawPlanets():void {')[1]?.split('function disposeSubtree')[0];
const checks=[
  ['authored source module',src.includes("from '../engine/drakken/CharacterFigures'")],
  ['Tiger sculpture',f01.includes('buildShardGodFigure(fiber,1.36)')],
  ['Wordstreamer sculpture',f01.includes('buildWordstreamerFigure(fiber,1.24)')],
  ['NiAlBu source figure',f01.includes('preCaptivityNiAlBu()')],
  ['original Geode used for NiAlBu',src.includes('const apparatus=buildNiAlBuGeode(fiber,1)')],
  ['later restraint rings removed from F01',src.includes('node.geometry instanceof THREE.TorusGeometry')],
  ['source geometry unaltered',!src.includes('new NiAlBuGeometry')],
  ['generic primitive symbols removed',!f01.includes('const symbols=[shared.ink,shared.purple,shared.blue]')],
  ['F02 original authored Geode',f02.includes('buildNiAlBuGeode(fiber,1.32)')],
  ['fake F02 cage removed',!f02.includes('const wall=put(geode,new THREE.CylinderGeometry')],
  ['model provenance metadata',src.includes("sculpt.userData.source='src/engine/drakken/CharacterFigures.ts'")],
  ['source colors not overwritten',!src.includes('sculpt.material.color.set')],
  ['derived ink edges',src.includes('new THREE.EdgesGeometry(mesh.geometry, 32)')],
  ['dark ink color',src.includes('color:0x111924')],
  ['ink attached without material replacement',src.includes('mesh.add(strokes)')],
  ['edge geometry disposed on page change',src.includes('if(child.geometry)child.geometry.dispose()')],
  ['ink material disposed on teardown',src.includes('sharedMats.push(sourceInk)')&&src.includes('sharedMats.forEach(m=>m.dispose())')],
  ['F03 original source colors',f03.includes('color:pat.hull')],
  ['F03 related worlds inked',f03.includes('addInkedContours(planets)')],
  ['F01 starless',!f01.includes('spiralInstances')],
  ['F01 exact testimony',f01.includes('He murdered her.')],
  ['F02 exact testimony',f02.includes('NiAlBu still watches her die.')&&f02.includes('Again and again.')],
  ['no narrator or global manuscript rewrite',!/NarrationEngine|historyManifest|atlasStore/.test(src)],
  ['no unapproved F03 secret',!src.includes('He could not create. He locked away the templates.')],
  ['not a canon-image approval',src.includes('not new canon approval')],
  ['instrumented actual figure count',src.includes('canvas.dataset.authoredSculptures=String(authoredFigureCount)')],
];
for(const [name,yes] of checks)assert.ok(yes,name);
console.log('PASS: '+checks.length+' authored asset, cel color, ink and canon checks');
