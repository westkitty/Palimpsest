import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';

const {chromium}=await import(process.env.PALIMPSEST_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4656';
const folder=process.env.PALIMPSEST_PROOF_DIR;
const errors=[];
const opened=[];
async function use(options={}) {
  const page=await browser.newPage({viewport:{width:1360,height:840},...options});
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('console',message=>{if(/KeyframeTrack|PropertyBinding|F06.*unavailable/.test(message.text()))errors.push(message.text());});
  page.on('response',r=>{const p=new URL(r.url()).pathname;if(/palimpsest-f06-.*\.glb$/.test(p)&&r.ok())opened.push(p);});
  return page;
}
async function open(page) {
  await page.goto(origin+'/folio-vnext.html',{waitUntil:'domcontentloaded'});
  const canvas=page.locator('#stage');
  await canvas.waitFor({state:'visible'});
  const box=await canvas.boundingBox();
  assert.ok(box);
  await page.mouse.click(box.x+box.width*.655,box.y+box.height*.475);
  await page.waitForFunction(()=>document.querySelector('#stage')?.dataset.bookPhase==='open');
  return canvas;
}
async function step(page,key,expected) {
  const c=page.locator('#stage');
  await c.focus();
  await page.keyboard.press(key);
  await page.waitForFunction(needle=>document.querySelector('#folio-progress')?.textContent.includes(needle)&&
    document.querySelector('#stage')?.dataset.pageTurn==='idle',expected,{timeout:12000});
}
async function launchF06(page) {
  const canvas=await open(page);
  for(let i=2;i<=6;i++)await step(page,'ArrowRight','F0'+i+' / F12');
  await page.waitForFunction(()=>{const d=document.querySelector('#stage')?.dataset;return d?.blenderFolio==='06'&&d?.f06CandidateState;});
  return canvas;
}
const state=async canvas=>JSON.parse(await canvas.getAttribute('data-f06-candidate-state'));
const save=async(page,f)=>{if(folder){await mkdir(folder,{recursive:true});await page.screenshot({path:join(folder,f)});}};
const click=async(page,key)=>{await page.locator('#stage').focus();await page.keyboard.press(key);};
const waitState=(page,key,value)=>page.waitForFunction(([k,v])=>JSON.parse(document.querySelector('#stage')?.dataset.f06CandidateState??'{}')[k]===v,[key,value]);
try {
  const desktop=await use({reducedMotion:'reduce'});
  const stage=await launchF06(desktop);
  assert.equal((await state(stage)).nativeLedgerLeaves,6);
  assert.equal((await state(stage)).authoredBlankCasualtyCell,true);
  assert.equal((await state(stage)).era,'7–30');
  assert.equal((await state(stage)).cFrame,69);
  assert.equal((await state(stage)).specimenId,'003');
  await save(desktop,'F06-01-arrival.png');

  await click(desktop,'c');await waitState(desktop,'cFrame',111);
  await click(desktop,'a');await waitState(desktop,'era','31–60');
  assert.equal((await state(stage)).ledgerEra,'31–60');
  assert.equal((await state(stage)).ledgerJiggle,0);
  assert.equal((await state(stage)).ledgerOpen,true);
  await save(desktop,'F06-02-open-era31-60.png');
  for(const id of ['004','009','032','012','019','030','003']){
    await click(desktop,'b');await waitState(desktop,'specimenId',id);
    const current=await state(stage);
    assert.equal(current.era,'31–60');
    assert.equal(current.cFrame,111);
  }
  for(const era of ['61–90','91–120','7–30']){
    await click(desktop,'a');await waitState(desktop,'era',era);assert.equal((await state(stage)).ledgerEra,era);
  }
  await click(desktop,'c');await waitState(desktop,'cFrame',69);
  await click(desktop,'b');await waitState(desktop,'specimenId','004');
  await click(desktop,'a');await waitState(desktop,'era','31–60');
  await click(desktop,'c');await waitState(desktop,'cFrame',111);
  await step(desktop,'ArrowRight','F07 / F12');
  assert.equal(await stage.getAttribute('data-f06-candidate-state'),null);
  await step(desktop,'ArrowLeft','F06 / F12');
  await waitState(desktop,'specimenId','004');
  assert.equal((await state(stage)).ledgerEra,'31–60');
  assert.equal((await state(stage)).cFrame,111);
  await desktop.close();

  const moving=await use();
  const motionStage=await launchF06(moving);
  await click(moving,'c');await waitState(moving,'ledgerOpen',true);
  await moving.waitForFunction(()=>{const f=JSON.parse(document.querySelector('#stage')?.dataset.f06CandidateState??'{}').cFrame;return f>69&&f<111;});
  await save(moving,'F06-03-moving-hinge.png');
  await waitState(moving,'cFrame',111);
  await click(moving,'a');await waitState(moving,'ledgerEra','31–60');
  await moving.waitForFunction(()=>Math.abs(JSON.parse(document.querySelector('#stage')?.dataset.f06CandidateState??'{}').ledgerJiggle)>.005);
  await waitState(moving,'ledgerJiggle',0);
  assert.equal((await state(motionStage)).cFrame,111);
  await moving.close();

  assert.ok(opened.length>=2,'native authored GLB was actually served');
  assert.deepEqual(errors,[]);
  console.log('PASS F06 reviewed Blender geometry, 6 keyed leaves, all four eras, seven specimen detents, independent C, live jog, reduced motion and state-preserving return.');
} finally {await browser.close();}
