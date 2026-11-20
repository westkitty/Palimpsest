const assert = require('node:assert/strict');
const fs = require('node:fs');
const dock = fs.readFileSync('src/vnext/panelDock.js','utf8');
const page = fs.readFileSync('folio-vnext.html','utf8');
const scene = fs.readFileSync('src/vnext/previewV2.ts','utf8');
const checks = [
  ['four independent movable panels', (page.match(/<section class="window" data-panel-id="/g)||[]).length===4],
  ['dedicated pointer grip for each', (page.match(/data-panel-handle/g)||[]).length===4],
  ['all panels collapsible', (page.match(/data-panel-fold/g)||[]).length===4],
  ['layout reset and hide reachable even after hiding panels', page.includes('id="reset-panels"') && page.includes('id="toggle-panels"') && page.includes('id="layout-tools"')],
  ['independent live region never hidden by panels', page.indexOf('id="global-announcer"')>page.indexOf('</div>\n    </section>') && page.includes('aria-live="polite"')],
  ['all panels remain in viewport', dock.includes('r.width - width - minInset') && dock.includes('r.height - height - minInset')],
  ['pointercapture handling mouse and touch', dock.includes("'pointerdown'") && dock.includes("'pointermove'") && dock.includes('setPointerCapture') && dock.includes("'pointercancel'")],
  ['keyboard accessible arrow and home reset', dock.includes("event.key === 'Home'") && dock.includes('event.shiftKey ? 36 : 12')],
  ['placement saved in sessionStorage only', dock.includes('sessionStorage.setItem') && !dock.includes('localStorage')],
  ['responsive clamping on viewport changes', dock.includes("window.addEventListener('resize'") && dock.includes("window.addEventListener('pageshow'")],
  ['controls remain distinct from renderer', !dock.includes('THREE.') && !dock.includes('narration') && !dock.includes('mayReveal')],
  ['canvas can pan separately from UI', scene.includes('controls.enablePan=true') && scene.includes('THREE.MOUSE.PAN')],
  ['mobile movement inputs preserved', page.includes('data-move="w"') && scene.includes("activeMove.add(dir)")],
  ['reduced motion respected', page.includes('prefers-reduced-motion') && scene.includes('reducedMotion')],
  ['literate paper material quality', scene.includes('function paperGrain') && scene.includes('function cutArch') && scene.includes('THREE.ExtrudeGeometry')],
  ['depth and light with bounded resolution', scene.includes('renderer.shadowMap.enabled=!softwareRenderer') && scene.includes('softwareRenderer?0.85:Math.min(window.devicePixelRatio||1,1.6)')],
  ['study and panel layout use independent scoped session keys', scene.includes("const STUDY_STORAGE_KEY='palimpsest.folio.review.study-state.v1'") && dock.includes("const LAYOUT_KEY = 'palimpsest.folio.review.panel-layout.v1'") && !scene.includes('panel-layout.v1') && !dock.includes('study-state.v1') && !scene.includes('localStorage')],
  ['F01 remains starless', !scene.split('function buildF01():void {')[1].split('function spiralInstances')[0].includes('spiralInstances')],
  ['no unapproved third testimony', !scene.includes('He could not create. He locked away the templates.')],
  ['narrator independent of discoveries', !/NarrationEngine|narrationEngine|speechSynthesis/.test(scene)],
];
for(const [name,good] of checks) assert.ok(good,name);
console.log(`PASS: ${checks.length} draggable console, papercraft and canon boundary contracts`);
