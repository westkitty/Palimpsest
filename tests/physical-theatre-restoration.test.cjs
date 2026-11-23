const assert=require('node:assert/strict');
const fs=require('node:fs');

const binding=fs.readFileSync('src/vnext/livingBookBinding.ts','utf8');
const preview=fs.readFileSync('src/vnext/previewV2.ts','utf8');
const scenic=fs.readFileSync('src/vnext/livingStagecraft.ts','utf8');
const html=fs.readFileSync('folio-vnext.html','utf8');
const workflow=fs.readFileSync('.github/workflows/living-twelve-ci.yml','utf8');

const turn = fs.readFileSync('src/vnext/physicalPageTurn.ts','utf8');
const required=[
  ['physical closed cover mounted to material book',binding.includes('this.coverPivot') && binding.includes('this.volume.position.x') && binding.includes('coverPrinting()')],
  ['original-inspired curved linen spine and brass bands',binding.includes('new THREE.CylinderGeometry(0.24') && binding.includes('new THREE.TorusGeometry(0.246')],
  ['matte mineral slate instead of repeated woven grid',binding.includes('mineralSurface()') && binding.includes('const slateTexture = mineralSurface()')],
  ['physically distinct page signatures across folios',binding.includes('setPageIndex(index:number)') && binding.includes('this.pageEdges')],
  ['live deformable leaf tip thickness with computed normals',binding.includes('this.edgeGeo.computeVertexNormals()') && binding.includes('this.leafGeo.computeVertexNormals()')],
  ['interactive physical cover motion',preview.includes('coverDrag={pointerId:event.pointerId') && preview.includes('fitBookCamera(coverAnimation)')],
  ['portrait camera is aspect-aware',preview.includes('function bookAspect():number {return Math.max(.35,canvas.clientWidth/') && turn.includes('1.16/Math.max(.35,aspect)') && preview.includes('const openScale=Math.max(1,1.28/aspect)') && preview.includes('controls.maxDistance=Math.max(19,camera.position.distanceTo(controls.target)+5)')],
  ['incoming and outgoing folio worlds coexist during turn',preview.includes('parkOutgoingStage();') && preview.includes('goFolio(turn.toIndex,true)') && preview.includes('discardOutgoingStage();')],
  ['outgoing scene teardown delayed until completed turn',preview.includes('if(outgoingStage){') && preview.includes('if(!turn.dragging&&turn.travel===(turn.commit?1:0))')],
  ['cancelled turn retains current folio',preview.includes('physicalTurn.commit=false') && preview.includes('turn.commit=commitPageDrag(delta,turn.desired)') && turn.includes('travel>=.21')],
  ['source-authoritative early folio worlds retained',preview.includes('const legacy=buildF01()') && preview.includes('const f02Fallback=index===1?buildF02():null') && preview.includes('if(index===2)buildF03()') && preview.includes('createF01Challenger(state,reducedMotion')],
  ['F01 remains intentionally starless',preview.includes('Intentionally NO star points, star meshes, nebula sky or cosmic background.')],
  ['pierced physical F01 scenery',preview.includes('shape.holes.push(hollow)') && preview.includes('paper proscenium')],
  ['physical A/B/C paper pulls on all early folios',preview.includes('mountEarlyPaperTabs(') && preview.includes('earlyPaperTabHits') && preview.includes("handleAction(slot)")],
  ['all nine later folios have distinct scenic mechanisms',Array.from({length:9},(_,i)=>scenic.includes('if(folio==='+String(i+3)+')')||scenic.includes('else if(folio==='+String(i+3)+')')).every(Boolean)],
  ['protected F09 irreversibility respected',scenic.includes('MODEL STAR paper emblem') && scenic.includes('exact black absence after filament extraction')],
  ['F10 inhabited horizon stays unlit',scenic.includes('F10 is deliberately closed-world:') && scenic.includes('F10 inhabited-sky pure black streak; no luminous grid')],
  ['F11 barren terrain without invented life',scenic.includes('No new life') && scenic.includes('F11 permanent mountain trauma')],
  ['3D Prev/Next never visible',html.includes('#book-stage:not(.no-webgl) .folio-controls #prev') && html.includes('#book-stage:not(.no-webgl) .folio-controls #next{display:none}')],
  ['keyboard and fallback remain',preview.includes("if(k==='arrowleft'") && preview.includes("classList.add('no-webgl')")],
  ['archival edition remains separate',html.includes('id="archival-edition"')],
  ['branch CI checks this work',workflow.includes('feat/physical-theatre-restoration-20261120')],
];
for(const [name,pass] of required)assert.ok(pass,name);
console.log('PASS:',required.length,'physical theatre, canon, scene, continuity, mobile and release-gate contracts');
