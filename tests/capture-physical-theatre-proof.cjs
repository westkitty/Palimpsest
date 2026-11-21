/**
 * PALIMPSEST feature-branch-only visual proof capture.
 *
 * Run with the repository's built Vite preview and external Playwright:
 *   NODE_PATH=/path/to/playwright/node_modules \
 *   PALIMPSEST_CHROME_PATH=/path/to/chromium \
 *   node tests/capture-physical-theatre-proof.cjs
 *
 * Never deploy or consider this automation a substitute for human review.
 */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4173';
const out=process.env.PALIMPSEST_EVIDENCE_DIR||
  path.join(root,'production/folio_vnext/evidence/physical-theatre-20261120');
const chrome=process.env.PALIMPSEST_CHROME_PATH;
const visual={recordedAt:new Date().toISOString(),source:base,browser:'Chromium',
  gpuMode:'software ANGLE SwiftShader for reproducible headless fallback',frames:[],
  errors:[],results:[],visualApproval:'PENDING'};
fs.mkdirSync(out,{recursive:true});
let browser;
async function capture(page,name){
  const loc=path.join(out,name+'.png');
  await page.screenshot({path:loc,timeout:60000});
  const data=await page.locator('#stage').evaluate(el=>({...el.dataset,hidden:el.hidden}));
  const status=await page.locator('#folio-title').textContent().catch(()=>null);
  const item={name,size:fs.statSync(loc).size,bookPhase:data.bookPhase,
    pageTurn:data.pageTurn,folio:status};
  visual.frames.push(item);
  console.log('FRAME',JSON.stringify(item),{flush:true});
}
async function main(){
  browser=await chromium.launch({headless:true,executablePath:chrome,args:[
    '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader',
  ]});
  const context=await browser.newContext({viewport:{width:1100,height:720},
    deviceScaleFactor:1,reducedMotion:'no-preference',
    ...(process.env.PALIMPSEST_VIDEO_DIR?{recordVideo:{dir:process.env.PALIMPSEST_VIDEO_DIR,size:{width:1100,height:720}}}:{})});
  const page=await context.newPage();
  page.on('pageerror',e=>visual.errors.push('desktop: '+String(e)));
  await page.goto(base+'/folio-vnext.html',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForTimeout(900);
  await capture(page,'01-closed-book');
  const rect=await page.locator('#stage').boundingBox();
  if(!rect)throw Error('Desktop canvas unavailable');
  await page.mouse.click(rect.x+rect.width*0.655,rect.y+rect.height*0.475);
  await page.waitForTimeout(620);
  await capture(page,'02-opening-cover');
  await page.waitForFunction(()=>document.querySelector('#stage')?.dataset.bookPhase==='open',null,{timeout:30000});
  await page.waitForTimeout(290);
  await capture(page,'03-F01-settled');
  // Actually grab and move the right-hand leaf, preserving the live curl.
  const startX=rect.x+rect.width*0.78,y=rect.y+rect.height*0.61;
  await page.mouse.move(startX,y);await page.mouse.down();
  await page.mouse.move(rect.x+rect.width*0.56,y,{steps:10});
  await capture(page,'04-mid-page-turn');
  await page.mouse.move(rect.x+rect.width*0.29,y,{steps:12});
  await page.mouse.up();
  await page.waitForFunction(()=>document.querySelector('#stage')?.dataset.pageTurn==='idle',null,{timeout:40000});
  await page.waitForFunction(()=>document.querySelector('#folio-title')?.textContent?.includes('All Unfolds'),null,{timeout:15000});
  await page.waitForTimeout(350);
  await capture(page,'05-F02-arrival');
  // Reveal all THREE original F02 stellar folds to prove the authored work.
  await page.locator('#stage').focus();
  for(const key of ['a','b','c'])await page.keyboard.press(key);
  await page.waitForTimeout(1200);
  await capture(page,'06-F02-three-stage-assembly');
  await page.goto(base+'/folio-vnext.html?folio=10',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForTimeout(1200);
  await capture(page,'07-F10-later-folio');
  // Keep evidence video closed and finalized before closing the browser.
  const video=page.video();
  await page.close();
  if(video)visual.video=path.basename(await video.path());
  await context.close();
  // A separate portrait session makes the mobile camera test independent.
  const phone=await browser.newContext({viewport:{width:390,height:844},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const mobile=await phone.newPage();
  mobile.on('pageerror',e=>visual.errors.push('mobile: '+String(e)));
  await mobile.goto(base+'/folio-vnext.html',{waitUntil:'domcontentloaded',timeout:90000});
  await mobile.waitForTimeout(1050);
  await capture(mobile,'08-mobile-closed-book');
  await mobile.touchscreen.tap(195,440);
  await mobile.waitForFunction(()=>document.querySelector('#stage')?.dataset.bookPhase==='open',null,{timeout:25000});
  await mobile.waitForTimeout(200);
  await capture(mobile,'09-mobile-open-F01');
  await phone.close();
}
main().then(()=>{visual.ok=true;}).catch(e=>{
  visual.ok=false;visual.errors.push(String(e));console.error('VISUAL_CAPTURE_FAILED',e);
}).finally(async()=>{
  fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify(visual,null,2));
  await browser?.close().catch(()=>{});
  if(!visual.ok)process.exitCode=1;
});
