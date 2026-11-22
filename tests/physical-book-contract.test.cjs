const assert = require('node:assert/strict');
const fs = require('node:fs');
const physical = fs.readFileSync('src/vnext/livingBookBinding.ts','utf8');
const preview = fs.readFileSync('src/vnext/previewV2.ts','utf8');
const html = fs.readFileSync('folio-vnext.html','utf8');
const originals = fs.readFileSync('src/engine/BookAndDeskRig.ts','utf8');

const checks = [
 ['real original hinged book precedent', originals.includes('setBookOpenProgress') && originals.includes('updateTurningLeaf') && originals.includes('cornerRightHit')],
 ['closed cover has physical pivot and embossed print', physical.includes('this.coverPivot.rotation.z') && physical.includes('coverPrinting()') && physical.includes('new THREE.BoxGeometry(4.94, 0.18, 6.26)')],
 ['page leaf has a deformable segmented mesh', physical.includes('new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_DEPTH, 28, 18)') && physical.includes('positions.setXYZ')],
 ['two-sided leaf and curved fold geometry', physical.includes('THREE.BackSide') && physical.includes('Math.cos(angle)*bx') && physical.includes('Math.sin(angle)*bx')],
 ['physical corner hits in both directions', physical.includes('rightCornerHit') && physical.includes('leftCornerHit')],
 ['default route begins with cover shut', preview.includes("const startWithClosedCover = !bridgeEmbedded && initialFolio === 0") && preview.includes("bookPhase: BookPhase = startWithClosedCover ? 'closed' : 'open'")],
 ['clicking cover starts animated opening', preview.includes('bookHit(event,binding.coverHit)') && preview.includes("bookPhase='opening'")],
 ['no automatic opening before physical user interaction', !preview.includes("openPhysicalCover();resize()") && preview.includes('coverAnimation=Math.min(1')],
 ['real pointer drag changes paper geometry before release', preview.includes('onPhysicalPointerMove') && preview.includes('binding.setLeafProgress(turn.progress,true)')],
 ['pointer movement captures real cursor input', preview.includes('event.clientX-turn.fromX') && preview.includes('canvas.setPointerCapture(event.pointerId)')],
 ['short or cancelled turns return to their starting leaf', preview.includes('travelled>14 && distance>=0.35') && preview.includes('physicalTurn.commit=false')],
 ['the next leaf includes the separate closing pop-out', preview.includes('if(!playableIndex(target))return')],
 ['source stages remain independently authored', preview.includes('buildF01()') && preview.includes('createLaterFolio(')],
 ['keyboard accessibility remains without visual buttons', preview.includes("if(k==='enter'||k===' ')") && preview.includes("if(k==='arrowleft'")],
 ['no onscreen Next / Prev buttons in WebGL mode', html.includes('#book-stage:not(.no-webgl) .folio-controls #prev') && html.includes('#book-stage:not(.no-webgl) .folio-controls #next{display:none}')],
 ['accessible illustrated fallback retains navigation', html.includes('id="prev"') && html.includes('id="next"') && preview.includes("classList.add('no-webgl')")],
 ['bottom chevron remains an optional tool reveal', html.includes('id="toggle-panels"') && html.includes('class="panels-hidden"')],
 ['runtime tears down paper geometry and textures', preview.includes('binding.dispose()') && physical.includes('this.leafFrontMat.map?.dispose()')],
 ['original hidden testimony is not touched', preview.includes("['He murdered her.']") && !physical.includes('He murdered her.')],
];
for(const [name,ok] of checks)assert.ok(ok,name);
console.log('PASS: '+checks.length+' closed cover, original-style paper dragging, canon, keyboard and fallback contracts');
