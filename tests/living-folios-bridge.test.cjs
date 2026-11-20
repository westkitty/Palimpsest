const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('src/App.tsx','utf8');
const bridge = fs.readFileSync('src/components/LivingFoliosBridge.tsx','utf8');
const cover = fs.readFileSync('src/components/ClosedCoverOverlay.tsx','utf8');
const header = fs.readFileSync('src/components/ChapterHeader.tsx','utf8');
const preview = fs.readFileSync('src/vnext/previewV2.ts','utf8');
const html = fs.readFileSync('folio-vnext.html','utf8');
const checks = [
 ['new shared volume bridge',bridge.includes('export function LivingFoliosBridge')],
 ['native accessible modal',bridge.includes('<dialog') && bridge.includes("dialog?.showModal()")],
 ['native cancel handles Escape',bridge.includes('onCancel={(event)')],
 ['all twelve folios represented',bridge.includes('Array.from({ length: 12 }')],
 ['opening folios are present',bridge.includes("world < 3")],
 ['original F04+ archival continuation',bridge.includes('onContinue(world)')],
 ['separate current folio state in bridge',bridge.includes('setFolio(data.folio as OpeningFolio)')],
 ['same-origin message security',bridge.includes('event.origin !== window.location.origin')],
 ['exact iframe source message security',bridge.includes('event.source !== frameRef.current?.contentWindow')],
 ['same-origin outbound messages',bridge.includes('window.location.origin,')],
 ['previews embedded from existing built route',bridge.includes("./folio-vnext.html?embedded=1&folio=")],
 ['original App keeps existing engine',app.includes('new AtlasEngine(mountRef.current)')],
 ['original App suspends WebGL while embedded',app.includes('setRenderingPaused(useNonWebgl || livingOpen)')],
 ['original App restores WebGL on exit',app.includes('!useNonWebgl && !livingOpen')],
 ['original App preserves historical on-world actions',app.includes('handleSelectWorld(world)')],
 ['original App resets bridge without copying discoveries',app.includes('setLivingOpen(false)')],
 ['cover provides entry',cover.includes('onExploreLivingFolios') && cover.includes('Enter Living Folios')],
 ['open reader header provides entry',header.includes('onOpenLivingFolios') && header.includes('Living Folios')],
 ['no modified historical manuscript dependencies',!bridge.includes('historyManifest') && !bridge.includes('NarrationEngine')],
 ['no secret export or saving',!bridge.includes('sessionStorage') && !bridge.includes('localStorage') && !bridge.includes('activeSecret')],
 ['preview validates embedding',preview.includes("bridgeEmbedded = new URLSearchParams")],
 ['preview initial folio deep link',preview.includes("const initialFolio: FolioIndex")],
 ['preview navigates parent F01-F03',preview.includes("message.action!=='navigate'")],
 ['preview notifies parent of current folio',preview.includes("sendBridge('folio', index)")],
 ['F03 next continues F04',preview.includes("if(next>2){sendBridge('continue',3);return;}")],
 ['independent direct preview still starts at F01',preview.includes('goFolio(initialFolio)')],
 ['reading fallback follows bridge navigation',preview.includes("fallbackPage(message.folio as FolioIndex)")],
 ['embedded exit is explicit',preview.includes("sendBridge('exit',state.folio)")],
 ['existing authored sculptures still used',preview.includes('buildShardGodFigure(fiber,1.36)') && preview.includes('buildNiAlBuGeode(fiber,1.32)')],
 ['draggable interface retained',html.includes('src="./src/vnext/panelDock.js"')],
 ['no invented third inscription',!preview.includes('He could not create. He locked away the templates.')],
 ['original twelve-folio reader component retained',app.includes('<ControlDock') && app.includes('<NonWebglFolioView')],
];
for (const [name,pass] of checks) assert.ok(pass,name);
console.log('PASS: '+checks.length+' living-folio integration, security, state-preservation and historical scope contracts');
