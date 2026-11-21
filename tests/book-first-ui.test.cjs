const assert=require('node:assert/strict');
const fs=require('node:fs');
const home=fs.readFileSync('index.html','utf8');
const archive=fs.readFileSync('archive.html','utf8');
const folio=fs.readFileSync('folio-vnext.html','utf8');
const dock=fs.readFileSync('src/vnext/panelDock.js','utf8');
const vite=fs.readFileSync('vite.config.ts','utf8');

const checks=[
 ['homepage routes to living folios by default',home.includes("new URL(archival ? './archive.html' : './folio-vnext.html', source.href)")],
 ['homepage preserves bookmark route and explicit archive override',home.includes("source.searchParams.get('edition') === 'archive'") && home.includes("destination.hash = source.hash")],
 ['original archive edition remains at a separate built route',archive.includes('id="root"')&&archive.includes('src="/src/main.tsx"')&&vite.includes("path.resolve(__dirname, 'archive.html')")],
 ['noscript users retain visible book and archive links',home.includes('<noscript>')&&home.includes('href="./folio-vnext.html"')&&home.includes('href="./archive.html"')],
 ['no floating panel before JavaScript starts',folio.includes('id="window-layer" class="panels-hidden"')],
 ['minimal bottom-center control stays present',folio.includes('id="toggle-panels"')&&folio.includes('aria-label="Expand book controls"')&&folio.includes('left:50%')&&folio.includes('translateX(-50%)')],
 ['all four original physical instruments are retained', (folio.match(/<section class="window" data-panel-id="/g)||[]).length===4],
 ['expanded UI explicitly exposes archival edition',folio.includes('href="./archive.html"')&&folio.includes('id="archival-edition"')],
 ['secondary controls hidden while collapsed',folio.includes('#layout-tools:not(.controls-expanded) .expanded-action{display:none}')],
 ['default hidden state is intentional on every load',dock.includes('let hidden = true;')&&dock.includes('setVisible(false);')],
 ['visibility controlled by a single explicit transition',dock.includes("layoutTools?.classList.toggle('controls-expanded', value)")&&dock.includes("visibility.setAttribute('aria-expanded', String(value))")],
 ['hidden layout does not destroy saved draggable placements',dock.includes("root?.classList.remove('panels-hidden')")&&dock.includes("const saved = stored[panel.dataset.panelId]")],
 ['pointer/keyboard panels are recoverable',dock.includes("visibility?.addEventListener('click',()=>setVisible(hidden))")&&dock.includes("setVisible(true);restoreDefaults()")],
 ['hidden panel focus is returned to opener',dock.includes("root?.contains(document.activeElement)")],
 ['no archival history, narrator or character logic imported into panel controls',!dock.includes('historyManifest')&&!dock.includes('NarrationEngine')&&!dock.includes('THREE.')]
];
for(const [name,good] of checks)assert.ok(good,name);
console.log('PASS: '+checks.length+' book-first route, access, visibility, recovery and archive invariants');
