import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const {chromium,devices}=await import(process.env.PALIMPSEST_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4641';
const proof=process.env.PALIMPSEST_PROOF_DIR;
let errors=[];
async function open(seed,viewport={}){
  const p=await browser.newPage({viewport:{width:1160,height:766},...viewport});
  p.on('pageerror',e=>errors.push(String(e)));
  await p.addInitScript(seed=>{
    Object.defineProperty(globalThis,Symbol.for('palimpsest.qa.f05-offcut-sample'),{value:seed});
    window.offcutTrace=[];
    const watch=()=>{
      const stage=document.querySelector('#stage');
      if(!stage)return;
      new MutationObserver(()=>{
        const s=JSON.parse(stage.dataset.f05CandidateState||'{}');
        if(!s.factory?.offcut)return;
        const next={orbit:s.orbitalPhase,axis:s.planetPhase,line:s.nativeLineFrame,ring:s.ring,...s.factory.offcut};
        const prior=window.offcutTrace.at(-1);
        if(prior?.orbit!==next.orbit||prior?.phase!==next.phase)window.offcutTrace.push(next);
      }).observe(stage,{attributes:true,attributeFilter:['data-f05-candidate-state']});
    };
    document.addEventListener('DOMContentLoaded',watch,{once:true});
  },seed);
  await p.goto(origin+'/folio-vnext.html?folio=5',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>{
    const el=document.querySelector('#stage');
    return !el.hidden&&el.dataset.blenderFolio==='05'&&
      !!JSON.parse(el.dataset.f05CandidateState||'{}').factory?.offcut;
  },null,{timeout:55000});
  return p;
}
const key=(p,k)=>p.locator('#stage').focus().then(()=>p.keyboard.press(k));
function wait(p,expr){
  return p.waitForFunction(`(() => {
    const s=JSON.parse(document.querySelector('#stage').dataset.f05CandidateState||'{}');
    return ${expr}?s:null;
  })()`,null,{timeout:55000}).then(v=>v.jsonValue());
}
async function screen(p,f){
  if(!proof)return;
  await mkdir(proof,{recursive:true});
  await p.screenshot({path:join(proof,f),timeout:55000});
}

try{
  const p=await open(.03);
  await key(p,'a');
  await key(p,'b');
  await wait(p,'s.ring&&s.factory?.bay===1&&s.factory.offcut.phase==="paper"');
  await key(p,'b');
  const first=await wait(p,'s.factory?.offcut.phase==="flame"&&s.factory.offcut.heat>.86&&s.ring');
  assert.ok(first.factory.offcut.elapsed>0);
  await screen(p,'F05-rare-offcut-flame.png');
  const marked=await wait(p,'s.factory?.offcut.phase==="aftermath"&&s.factory.offcut.gone');
  assert.equal(marked.factory.offcut.heat,0);
  assert.equal(marked.factory.rhythm.arrested,false);
  assert.equal(marked.ring,true);
  assert.ok(marked.orbitalPhase>first.orbitalPhase&&marked.planetPhase>first.planetPhase);
  await screen(p,'F05-offcut-charred-missing-corner.png');
  await key(p,'c');
  await wait(p,'s.record&&s.factory?.offcut.phase==="aftermath"');
  await key(p,'b');
  await wait(p,'s.factory?.bay===3&&s.factory.offcut.phase==="aftermath"&&s.ring&&s.record');
  const trace=await p.evaluate(()=>window.offcutTrace);
  assert.equal(trace.filter((x,i)=>x.phase==='flame'&&trace[i-1]?.phase!=='flame').length,1);
  assert.ok(trace.filter(x=>x.phase==='flame').every(x=>x.ring));
  assert.ok(trace.filter(x=>x.phase==='flame').some(x=>x.fall>0));
  await p.close();

  const phone=await open(.03,{...devices['Pixel 7'],reducedMotion:'reduce'});
  await phone.locator('#toggle-panels').tap();
  await phone.locator('[data-mechanism="a" i]').tap();
  await phone.locator('[data-mechanism="b" i]').tap();
  await phone.locator('[data-mechanism="b" i]').tap();
  const reduced=await wait(phone,'s.ring&&s.factory?.bay===2&&s.factory.offcut.phase==="aftermath"');
  assert.equal(reduced.factory.offcut.heat,0);
  assert.equal(reduced.factory.offcut.gone,true);
  assert.ok((await phone.evaluate(()=>window.offcutTrace)).every(x=>x.phase!=='flame'));
  await phone.locator('#toggle-panels').tap();
  await screen(phone,'F05-phone-static-charred-corner.png');
  await phone.close();

  const ordinary=await open(.70,{reducedMotion:'reduce'});
  await key(ordinary,'b');await key(ordinary,'b');
  await wait(ordinary,'s.factory?.bay===2&&s.factory.offcut.phase==="paper"');
  assert.deepEqual(errors,[]);
  console.log('PASS F05 real WebGL one seeded rare event, warm short fire, curling and missing corner, orbit runs independently, no blocked controls; phone reduced scar and ordinary no-fire visit.');
}finally{await browser.close();}
