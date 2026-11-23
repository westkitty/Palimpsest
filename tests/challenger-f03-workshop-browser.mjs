import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const {chromium,devices}=await import(process.env.PALIMPSEST_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4603';
const proof=process.env.PALIMPSEST_PROOF_DIR;
const failures=[];
async function use(options={},freezeProofs=false){
  const p=await browser.newPage({viewport:{width:1280,height:860},...options});
  p.on('pageerror',e=>failures.push(String(e)));
  if(freezeProofs)await p.addInitScript(()=>{
    const realNow=performance.now.bind(performance);
    performance.now=()=>window.__f03ProofPause??realNow();
  });
  await p.goto(origin+'/folio-vnext.html?folio=3',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>{const d=document.querySelector('#stage')?.dataset;return d?.blenderFolio==='03'&&d?.f03WorkshopState;},
    null,{timeout:45000});
  return p;
}
const state=p=>p.locator('#stage').evaluate(c=>JSON.parse(c.dataset.f03WorkshopState??'{}'));
async function control(p,key){
  await p.locator('#stage').focus();
  await p.keyboard.press(key);
}
async function verify(p,values){
  await p.waitForFunction(expected=>{
    const now=JSON.parse(document.querySelector('#stage')?.dataset.f03WorkshopState??'{}');
    return Object.entries(expected).every(([k,v])=>now[k]===v);
  },values,{timeout:45000});
}
async function screen(p,name){
  if(proof){await mkdir(proof,{recursive:true});await p.screenshot({path:join(proof,name)});}
}
try{
  const desktop=await use({reducedMotion:'no-preference'},true);
  await verify(desktop,{template:'Syrrian IV',sourceVisible:false,outputVisible:false});
  await screen(desktop,'F03-01-folded-cabinet.png');
  await control(desktop,'a');
  await desktop.waitForFunction(()=>{
    const x=JSON.parse(document.querySelector('#stage')?.dataset.f03WorkshopState??'{}');
    return x.sourceVisible && x.sourceRoll>0 && x.sourceRoll<.85;
  },null,{timeout:45000});
  await verify(desktop,{sourceRoll:1});
  const base=await state(desktop);assert.ok(base.printedProfileVertices>9);
  await control(desktop,'c');
  await desktop.waitForFunction(()=>{
    const x=JSON.parse(document.querySelector('#stage')?.dataset.f03WorkshopState??'{}');
    const ready=x.sourceRoll===1&&x.pressDepth>.65&&x.folded===0&&!x.outputVisible;
    if(ready)window.__f03ProofPause=performance.now();
    return ready;
  },null,{timeout:45000});
  await screen(desktop,'F03-02-notebook-press.png');
  await desktop.evaluate(()=>delete window.__f03ProofPause);
  // New print for the fold snapshot; PNG capture can block for longer than
  // one complete press on a busy software renderer.
  await verify(desktop,{outputVisible:true,folded:1,generation:1});
  await control(desktop,'c');
  await desktop.waitForFunction(()=>{
    const x=JSON.parse(document.querySelector('#stage')?.dataset.f03WorkshopState??'{}');
    const ready=x.folded>.20&&x.folded<.95&&!x.outputVisible;
    if(ready)window.__f03ProofPause=performance.now();
    return ready;
  },null,{timeout:45000});
  await screen(desktop,'F03-03-paper-buckles.png');
  await desktop.evaluate(()=>delete window.__f03ProofPause);
  await verify(desktop,{sourceVisible:true,outputVisible:true,folded:1,profileKey:'1001'});
  await screen(desktop,'F03-04-Syrrian-IV-pair.png');
  await control(desktop,'b');
  await verify(desktop,{template:'Nimbus III',outputVisible:true,folded:1,profileKey:'0110',generation:2});
  assert.notEqual((await state(desktop)).geometrySignature,base.geometrySignature);
  await screen(desktop,'F03-05-Nimbus-III-pair.png');
  await desktop.close();

  const phone=await use({...devices['Pixel 7'],reducedMotion:'reduce'});
  await phone.locator('#toggle-panels').tap();
  await phone.locator('[data-mechanism="a" i]').tap();
  await verify(phone,{sourceVisible:true,sourceRoll:1});
  await phone.locator('[data-mechanism="b" i]').tap();
  await phone.locator('[data-mechanism="b" i]').tap();
  await phone.locator('[data-mechanism="c" i]').tap();
  await verify(phone,{template:'Cirrus I',sourceVisible:true,outputVisible:true,folded:1,profileKey:'1100'});
  await phone.locator('#toggle-panels').tap();
  await screen(phone,'F03-06-phone-Cirrus-I-pair.png');
  assert.deepEqual(failures,[]);
  console.log('PASS F03 native Blender, sleeve roll, matched die, actual flattened gores buckle then settle, three distinct template states, and phone touch');
}finally{await browser.close();}
