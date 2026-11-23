const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const folder=process.env.PALIMPSEST_PROOF_DIR;
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4561';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PALIMPSEST_CHROME_PATH,headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try {
  for(const [device,viewport] of [['desktop',{width:1080,height:730}],['phone',{width:412,height:830}]]){
   const p=await browser.newPage({viewport,reducedMotion:'reduce',hasTouch:device==='phone'});
   const errors=[];p.on('pageerror',e=>errors.push(String(e)));
   await p.goto(origin+'/folio-vnext.html?folio=1');
   const canvas=p.locator('#stage');
   const check=(count,detent)=>p.waitForFunction(([count,detent])=>{
    const c=document.querySelector('#stage');
    const stage=JSON.parse(c?.dataset.f01Stage||'{}');
    return c?.dataset.f01Challenger==='ready'&&c?.dataset.bookPhase==='open'&&+c?.dataset.f01Detent===detent
      &&stage.consequences?.impressionCount===count;
   },[count,detent],{timeout:85000});
   await p.waitForFunction(()=>document.querySelector('#stage')?.dataset.f01Challenger==='ready',null,{timeout:65000});
   await canvas.focus();
   if(await canvas.getAttribute('data-book-phase')==='closed')await p.keyboard.press('Enter');
   await check(1,0);
   assert.equal(await canvas.evaluate(c=>c.hidden),false);
   if(folder)await p.screenshot({path:path.join(folder,'F01-'+device+'-before.png'),timeout:90000});
   await canvas.focus();await p.keyboard.press('a');
   await check(4,1);
   assert.deepEqual(await canvas.evaluate(c=>JSON.parse(c.dataset.f01Stage).consequences),
    {mountOpening:1,lineRegistered:1,recurrenceSpread:1,impressionCount:4});
   if(folder)await p.screenshot({path:path.join(folder,'F01-'+device+'-after.png'),timeout:90000});
   await p.keyboard.press('a');await check(1,0);
   assert.deepEqual(errors,[]);
   await p.close();
   console.log('F01 PAPER CONSEQUENCES PASS',device);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
