import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const {chromium,devices}=await import(process.env.PALIMPSEST_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4606';
const proof=process.env.PALIMPSEST_PROOF_DIR;
const url=origin+'/folio-vnext.html?folio=6';
const errors=[];
async function use(options={}){
  const p=await browser.newPage({viewport:{width:1120,height:740},...options});
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('console',m=>{if(/(PropertyBinding|F06.*unavailable)/.test(m.text()))errors.push(m.text());});
  if(!options.isMobile)await p.addInitScript(()=>{
    const realNow=performance.now.bind(performance);
    performance.now=()=>window.__f06ProofPause??realNow();
  });
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>{const d=document.querySelector('#stage')?.dataset;return d?.blenderFolio==='06'&&d?.f06CandidateState;},null,{timeout:45000});
  return p;
}
const state=p=>p.locator('#stage').evaluate(c=>JSON.parse(c.dataset.f06CandidateState??'{}'));
const key=async(p,k)=>{await p.locator('#stage').focus();await p.keyboard.press(k);};
async function confirm(p,expected){
  await p.waitForFunction(obj=>{
    const data=JSON.parse(document.querySelector('#stage')?.dataset.f06CandidateState??'{}');
    return Object.entries(obj).every(([k,v])=>data[k]===v);
  },expected,{timeout:45000});
}
async function screen(p,name){
  if(proof){await mkdir(proof,{recursive:true});await p.screenshot({path:join(proof,name),timeout:120000});}
}
try{
  const desktop=await use({reducedMotion:'no-preference'});
  await confirm(desktop,{routeLayerCount:1,wearMask:1,physicalBlankApertures:4,era:'7–30',paperRipple:0});
  await screen(desktop,'F06-01-first-era-and-closed-ledger.png');
  await key(desktop,'a');
  await desktop.waitForFunction(()=>{
    const s=JSON.parse(document.querySelector('#stage')?.dataset.f06CandidateState??'{}');
    const ok=s.era==='31–60'&&s.paperRipple>.10&&Math.abs(s.ledgerJiggle)>.003;
    if(ok)window.__f06ProofPause=performance.now();
    return ok;
  },null,{timeout:45000});
  await screen(desktop,'F06-02-paper-ripple-and-ledger-jog.png');
  await desktop.evaluate(()=>delete window.__f06ProofPause);
  await confirm(desktop,{era:'31–60',routeLayerCount:2,paperRipple:0,ledgerJiggle:0});
  await key(desktop,'b');
  await confirm(desktop,{specimenId:'004',specimenYaw:.72,routeLayerCount:2,era:'31–60'});
  await key(desktop,'a');await confirm(desktop,{era:'61–90',routeLayerCount:3,specimenYaw:.72});
  await key(desktop,'a');await confirm(desktop,{era:'91–120',routeLayerCount:4});
  await key(desktop,'c');
  await confirm(desktop,{cFrame:111,ledgerEra:'91–120',specimenId:'004',authoredBlankCasualtyCell:true});
  await screen(desktop,'F06-03-all-scores-and-blank-loss-windows.png');
  await key(desktop,'a');await confirm(desktop,{era:'7–30',wearMask:15,routeLayerCount:4,cFrame:111,specimenId:'004'});
  await desktop.reload({waitUntil:'domcontentloaded'});
  await confirm(desktop,{era:'7–30',wearMask:15,routeLayerCount:4,cFrame:111,specimenId:'004',paperRipple:0});
  await screen(desktop,'F06-04-wear-holds-after-reentry.png');
  await desktop.close();

  const phone=await use({...devices['Pixel 7'],reducedMotion:'reduce'});
  await phone.locator('#toggle-panels').tap();
  await phone.locator('[data-mechanism="a" i]').tap();
  await phone.locator('[data-mechanism="b" i]').tap();
  await phone.locator('[data-mechanism="c" i]').tap();
  await confirm(phone,{cFrame:111,era:'31–60',specimenId:'004',routeLayerCount:2,physicalBlankApertures:4,paperRipple:0});
  await phone.locator('#toggle-panels').tap();
  await screen(phone,'F06-05-phone-era-and-open-ledger.png');
  assert.deepEqual(errors,[]);
  console.log('PASS F06 accumulating terrain, A ripple plus ledger jog, B independent rotation, C deep unmarked cuts, persisted wear, phone/reduced motion');
}finally{await browser.close();}
