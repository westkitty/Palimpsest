import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1360,height:840},reducedMotion:'reduce'});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
try {
  let ready=false;
  for(let i=0;i<25;i++) {
    try {const res=await page.goto(origin+'/folio-vnext.html',{waitUntil:'domcontentloaded',timeout:5000}); if(res?.ok()){ready=true;break;}} catch{}
    await wait(500);
  }
  assert.ok(ready,'Built review route must serve HTTP success');
  await page.waitForTimeout(1100);
  const canvasShown=await page.locator('#stage').evaluate(e=>!e.hidden);
  // An actual WebGL scene is required for this optional signature acceptance pass.
  assert.ok(canvasShown,'WebGL must initialize in software renderer for browser smoke');
  assert.equal(await page.locator('[data-panel-id]').count(),4,'four movable instruments');
  const title=page.locator('#folio-title');
  assert.match(await title.textContent(),/Before the Stars/);
  const handle=page.locator('[data-panel-id="folio"] [data-panel-handle]');
  const boxBefore=await page.locator('[data-panel-id="folio"]').boundingBox();
  await handle.focus(); await page.keyboard.press('ArrowRight');
  const boxAfter=await page.locator('[data-panel-id="folio"]').boundingBox();
  assert.ok(boxAfter.x>boxBefore.x,'Keyboard reposition works independently from orbit');
  await page.locator('#next').click();
  assert.match(await title.textContent(),/All Unfolds/);
  const witness=page.locator('#witness');
  assert.equal(await witness.isHidden(),true,'scale passage withheld before stage C');
  await page.locator('[data-mechanism="A"]').click();
  assert.equal(await witness.isHidden(),true,'A alone cannot trigger signature');
  await page.locator('[data-mechanism="B"]').click();
  assert.equal(await witness.isHidden(),true,'B alone cannot trigger signature');
  await page.locator('[data-mechanism="C"]').click();
  assert.equal(await witness.isVisible(),true,'C opens explicit scale control');
  await witness.click();
  assert.equal(await witness.getAttribute('aria-pressed'),'true','witness toggle engaged');
  await page.keyboard.press('Escape');
  assert.equal(await witness.getAttribute('aria-pressed'),'false','Escape restores reader to book');
  await page.locator('#next').click();
  assert.match(await title.textContent(),/Notebook Program/);
  await page.locator('[data-mechanism="C"]').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/Variation: 1/);
  await page.locator('#toggle-panels').click();
  assert.equal(await page.locator('#window-layer').getAttribute('class'),'panels-hidden');
  await page.locator('#toggle-panels').click();
  await page.locator('#reset-panels').click();
  assert.equal(await page.locator('#window-layer').getAttribute('class'),'');
  const home=await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  assert.ok(home?.ok(),'Original twelve-folio route remains available');
  assert.equal(pageErrors.length,0,`no uncaught browser exceptions: ${pageErrors.join('; ')}`);
  console.log('PASS: integrated WebGL scene, movable controls, F02 explicit signature, Escape return, F03 generator, 12-folio route');
} finally {await browser.close();}
