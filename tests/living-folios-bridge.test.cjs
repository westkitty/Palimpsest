const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('src/App.tsx','utf8');
const bridge = fs.readFileSync('src/components/LivingFoliosBridge.tsx','utf8');
const cover = fs.readFileSync('src/components/ClosedCoverOverlay.tsx','utf8');
const header = fs.readFileSync('src/components/ChapterHeader.tsx','utf8');
const preview = fs.readFileSync('src/vnext/previewV2.ts','utf8');
const html = fs.readFileSync('folio-vnext.html','utf8');
const scenes = fs.readFileSync('src/vnext/laterFolioScenes.ts','utf8');
const state = fs.readFileSync('src/vnext/laterFolioState.ts','utf8');
const checks = [
 ['one shared twelve-folio living volume',bridge.includes('export function LivingFoliosBridge')&&bridge.includes('Array.from({ length: 12 }')],
 ['native accessible modal',bridge.includes('<dialog') && bridge.includes("dialog?.showModal()")],
 ['native cancel handles Escape',bridge.includes('onCancel={(event)')],
 ['all twelve folios show as living edition',bridge.includes("', living edition'")],
 ['archival counterpart is optional and explicit',bridge.includes('onContinue(folio)')&&bridge.includes('Archival counterpart')],
 ['no forced archival navigation on F04',!bridge.includes('world > 2')&&!bridge.includes('onContinue(world)')],
 ['bridge selects internal folios from event',bridge.includes('setFolio(data.folio)')],
 ['same-origin inbound security',bridge.includes('event.origin !== window.location.origin')],
 ['exact iframe source security',bridge.includes('event.source !== frameRef.current?.contentWindow')],
 ['same-origin outbound messages',bridge.includes('window.location.origin,')],
 ['living overlay uses built standalone route',bridge.includes("./folio-vnext.html?embedded=1&folio=")],
 ['original archive engine intact',app.includes('new AtlasEngine(mountRef.current)')],
 ['archive rendering pauses during modal',app.includes('setRenderingPaused(useNonWebgl || livingOpen)')],
 ['archive rendering resumes afterwards',app.includes('!useNonWebgl && !livingOpen')],
 ['living start follows any current archive folio',app.includes('setLivingStart(active)')],
 ['original archival path retained',app.includes('handleSelectWorld(world)')],
 ['cover provides entry',cover.includes('onExploreLivingFolios') && cover.includes('Enter Living Folios')],
 ['header provides entry',header.includes('onOpenLivingFolios') && header.includes('Living Folios')],
 ['no maker testimony sent from iframe',!bridge.includes('activeSecret')&&!bridge.includes('discoveredSecrets')],
 ['no archival storage mutation',!bridge.includes('sessionStorage')&&!bridge.includes('localStorage')],
 ['full deep-link support',preview.includes('requestedFolio <= 12')],
 ['living scene navigation is across all twelve',preview.includes('if(!isLivingIndex(next))return;')],
 ['next page never silently exits to archive',!preview.includes("sendBridge('continue',3)")],
 ['original F01-F03 authored visuals protected',preview.includes('buildShardGodFigure(fiber,1.36)') && preview.includes('buildNiAlBuGeode(fiber,1.32)')],
 ['F04-F12 instantiate existing source classes',scenes.includes('F04FolioWorld')&&scenes.includes('F12FolioWorld')&&scenes.includes('folio.build(state)')],
 ['later scenes have separate study state',state.includes('LATER_STUDY_STORAGE_KEY')&&preview.includes('saveLaterStudy()')],
 ['later scenes use same draggable controls',html.includes('src="./src/vnext/panelDock.js"')],
 ['non-WebGL F04-F12 reading exists',html.includes('id="later-fallback"')&&preview.includes('fallbackPage(index:number)')],
 ['no invented F03 inscription',!preview.includes('He could not create. He locked away the templates.')],
 ['original twelve-folio reader is preserved',app.includes('<ControlDock') && app.includes('<NonWebglFolioView')],
];
for (const [name,pass] of checks) assert.ok(pass,name);
console.log('PASS: '+checks.length+' unified twelve-folio source/navigation/isolation contracts');
