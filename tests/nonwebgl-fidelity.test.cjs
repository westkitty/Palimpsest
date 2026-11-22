'use strict';
// Source-compiled semantic and DOM-free SVG regression fixtures.
// This test runner does not require React or a browser; it validates the exact
// renderer fragment intended for the pinned non-WebGL component.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');
// Verify the committed application component directly; no duplicate fragment source.
const sourcePath = path.join(__dirname, '..', 'src', 'components', 'NonWebglFolioView.tsx');
const applicationSource = fs.readFileSync(sourcePath, 'utf8');
const startMarker = '/* PALIMPSEST P0: manuscript-grounded non-WebGL SVG, F01-F12.';
const endMarker = '\nexport function NonWebglFolioView({';
const start = applicationSource.indexOf(startMarker);
const end = applicationSource.indexOf(endMarker, start);
assert.ok(start >= 0 && end > start, 'F01-F12 renderer must exist in non-WebGL component');
assert.equal(applicationSource.split(startMarker).length, 2, 'Renderer region must be unique');
assert.match(applicationSource, /role="status" aria-live="polite" aria-atomic="true"/, 'Missing accessible state status');
const source = applicationSource.slice(start, end);
const TS=transformSync(source+'\nmodule.exports = { renderFolioSvg, getFolioVisualStatus };\n', {
  loader:'tsx', format:'cjs', jsx:'automatic', target:'es2022',
});
const jsx=(type,props,key)=>({type,props:props||{},key});
const Fragment=Symbol('Fragment');
const mod={exports:{}};
const titles=['The Initialization of Reality','The Triarchic Order & Primordial Betrayal','Mother & the Great Misunderstanding','Year 0 — First Contact','Year 3 — The Standard of Conquest','Years 7–120 — The Long Attrition','Year 121 — The Siege of the Ruby Eclipse','Year 170 — The Aureal Gate',"The Hal'Ven Heliocide",'The Siege Wall & the Postwar Protocols','31 Days Post-War — The First Dirt','The Unfinished Peace'];
const ids=['001','023','019','008','032','003','004','009','012','030','044','029','005','055','045','036'];
const names=['MAGMA PLEURON','BRINECHOIR','TERRAGULLET','AEROKARST','LYRIBORIS','FAULT-TONGUE','OBSIDIAN GUL','CLOUDMAW','VORTENBRAY','SOLNEXUS','GOREVAULT','RINGTHROAT','TREMORHOUND','FOLDHOWL','LEXICLAST','SINGULARARCH'];
const DRAXIS_BY_ID=Object.fromEntries(ids.map((id,i)=>[id,{id,name:names[i]}]));
const FOLIO_BY_WORLD=titles.map((title,i)=>({code:`F${String(i+1).padStart(2,'0')}`,title}));
const env={module:mod,exports:mod.exports,require(n){if(n==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment};throw Error('Unexpected import '+n)}, FOLIO_BY_WORLD,DRAXIS_BY_ID,ADMINISTRATION_SLOGAN:'Your fate is in our hands.'};
vm.runInNewContext(TS.code,env,{timeout:2000,filename:'renderFolioSvg.fragment.js'});
const {renderFolioSvg,getFolioVisualStatus}=mod.exports;
const maxB=[4,2,5,2,4,7,2,2,3,2,2,2];
function snap(world,slot,step){
 const worlds=Array.from({length:12},(_,i)=>({interactions:{A:{active:false,step:0,locked:false},B:{active:false,step:0,locked:false},C:{active:false,step:0,locked:false}}}));
 if(slot){const s=worlds[world].interactions[slot];s.active=true;s.step=step??1; if(slot==='A'&&world===8)s.locked=true;}
 const B=worlds[world].interactions.B;
 const specimen=['003','004','009','032','012','019','030'][Math.min(B.step,6)];
 return {activeWorld:world, worlds, activeDraxisId:specimen};
}
const camelToSvg=k=>({className:'class',textAnchor:'text-anchor',fontSize:'font-size',fontWeight:'font-weight',strokeWidth:'stroke-width',strokeDasharray:'stroke-dasharray',strokeLinecap:'stroke-linecap',viewBox:'viewBox',opacity:'opacity'}[k]||k);
function escape(x){return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function svg(node){
 if(node===null||node===undefined||typeof node==='boolean')return '';
 if(Array.isArray(node))return node.map(svg).join('');
 if(typeof node!=='object')return escape(node);
 if(node.type===Fragment)return svg(node.props.children);
 const {type,props}=node;
 const attrs=Object.entries(props).filter(([k,v])=>k!=='children'&&k!=='key'&&v!==null&&v!==undefined).map(([k,v])=>` ${camelToSvg(k)}="${escape(v)}"`).join('');
 return `<${type}${attrs}>${svg(props.children)}</${type}>`;
}
const render=(w,slot,step)=>svg(renderFolioSvg(snap(w,slot,step)));
let assertions=0;
function expect(test,msg){assert.ok(test,msg);assertions++;}
// 12 baselines + 36 A/B/C activations. Each action changes the actual SVG.
for(let i=0;i<12;i++){
 const base=render(i);
 expect(base.includes(`<title>F${String(i+1).padStart(2,'0')}`),`F${i+1} missing title`);
 expect(base.includes('aria-label="F'),`F${i+1} missing meaningful accessible state`);
 for(const slot of ['A','B','C']){
   const on=render(i,slot,1);
   expect(on!==base,`F${i+1} ${slot} did not change rendered SVG`);
   expect(on.includes('A:')&&on.includes('B:')&&on.includes('C:'),`F${i+1} ${slot} lost state semantics`);
 }
}
// All B positions render meaningfully distinct, including last index.
for(let i=0;i<12;i++){
 const states=[];
 for(let n=0;n<maxB[i];n++){
  const s=snap(i,'B',n);const t=svg(renderFolioSvg(s));
  expect(t.length>100,`F${i+1} B ${n} empty`);
  states.push(t);
 }
 if(maxB[i]>2)expect(new Set(states).size===states.length,`F${i+1} B stages not uniquely represented`);
}
const lacks=(w,terms)=>{const all=['', 'A','B','C'].map(s=>render(w,s||undefined)).join(' '); for(const term of terms)expect(!all.includes(term),`F${w+1} stale term ${term}`)};
lacks(3,['40-60%','40–60% LOST','YEAR 3','CRATER PLATE']);
lacks(6,['MUTINY','CODEC (PROSTHETIC)','MARCEL (SYNCHRONIZED)']);
lacks(7,['MNEMONIC','RECRUITABLE','MUTINY','YEAR 121']);
lacks(9,['KAIL','SYRIN &','WAR CONTINUES']);
// F05 source-defined four-stage process: the initial panel is CLOSED.
// The shared store increments 0->1 on the first B actuation and 3->0 on the fourth.
// The schematic must map that actual store semantics onto four successive stages.
expect(render(4).includes('CUTAWAY CLOSED'),'F05 baseline must keep manufacturing cutaway closed');
for(const [step,label] of [[1,'STAGE 1/4: INPUT'],[2,'STAGE 2/4: GOREVAULT 044'],[3,'STAGE 3/4: RINGTHROAT 029'],[0,'STAGE 4/4: VITRIFIED RING']]){
  const view=render(4,'B',step);
  expect(view.includes(label),`F05 B step ${step} must show ${label}`);
  expect(!view.includes('CUTAWAY CLOSED'),`F05 B step ${step} is improperly covered`);
}
expect(getFolioVisualStatus(snap(4)).includes('Manufacturing cutaway closed'),'F05 baseline accessible status must match visual closure');
expect(getFolioVisualStatus(snap(4,'B',1)).includes('Manufacturing stage 1 of 4'),'F05 first B actuation status must describe first stage');
expect(render(6,'A').includes('NOT TO SCALE'),'F07 planning must disclose NOT TO SCALE');
expect(render(7,'C').match(/r="7" fill="#272E3A"/g)?.length===20,'F08 C must render 20 markers');
expect(render(8,'A').includes('BLACK HOLE / LOCKED'),'F09 A must show irreversible collapsed model');
expect(render(9,'B').includes('PITCH-BLACK SKY STREAK'),'F10 B must depict ground-view pitch-black streak');
expect(!render(9,'B').includes('WIRE'), 'F10 B must not use bright wireframe');
expect(render(10,'A').includes('OPTICAL INSET'),'F11 A must supply optical inspection');
expect(render(10,'B').includes('PRESERVATION MACRO'),'F11 B must compare Macro purpose, not wheat height');
expect(render(10,'C').includes('Your private discomfort'),'F11 C must show quote');
expect(render(11,'C').includes('SYRIN 4 / ARCHIVAL RECORD'),'F12 C must show archive');
expect(render(11,'B').includes('STARSILK INERT'),'F12 B must show inert Starsilk');
const noMotion=['animation','@keyframes','flash','transition','setTimeout'];
for(const w of [3,6,7,9])for(const v of noMotion)expect(!render(w,'A').includes(v),`F${w+1} unexpectedly requires animation`);
console.log(`PASS: ${assertions} source-compiled SVG assertions across 12 folios, 36 mechanisms, all B stages`);
if(process.argv.includes('--gallery')){
 const out=process.argv[process.argv.indexOf('--gallery')+1];
 const panels=[];
 for(let w=0;w<12;w++){
  const states=[['BASE',null,0],['A ON','A',1],['B ON','B',w===5?6:1],['C ON','C',1]];
  for(const [title,slot,step] of states){
    const x=render(w,slot,step);
    panels.push(`<article><h2>F${String(w+1).padStart(2,'0')} ${escape(title)}</h2>${x}<p>${escape(getFolioVisualStatus(snap(w,slot,step)))}</p></article>`);
  }
 }
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Palimpsest P0 F01-F12 visual fixtures</title><style>body{font:14px system-ui;background:#0e1116;color:#dce1e7;padding:16px}main{display:grid;grid-template-columns:repeat(2,minmax(320px,1fr));gap:14px}article{background:#222a35;border:1px solid #6b7480;padding:12px;border-radius:8px;min-width:0}h2{font-size:16px;margin:2px 0 8px}svg{width:100%;height:auto;display:block}p{font-size:11px;color:#ced2da;max-height:3.2em;overflow:hidden}@media(max-width:720px){main{grid-template-columns:1fr}}</style></head><body><h1>F01-F12 - Historical SVG fixtures (source-compiled)</h1><main>${panels.join('')}</main></body></html>`;
 fs.writeFileSync(out,html);console.log(`WROTE: ${out} (48 representative states)`);
}
