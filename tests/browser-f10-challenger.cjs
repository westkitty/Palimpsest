const assert=require('node:assert/strict');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const path=require('node:path');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8792';
const proof=process.env.PALIMPSEST_PROOF_DIR;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const errors=[];
  for(const [label,viewport,motion] of [['desktop',{width:1050,height:725},'no-preference'],['touch',{width:412,height:825},'reduce']]){
   const p=await browser.newPage({viewport,reducedMotion:motion,hasTouch:label==='touch'});
   p.on('pageerror',e=>errors.push(String(e)));
   const url=process.env.PALIMPSEST_STANDALONE?require('node:url').pathToFileURL(process.env.PALIMPSEST_STANDALONE).href+'?folio=10':origin+'/folio-vnext.html?folio=10';
   await p.goto(url);
   const stage=p.locator('#stage');
   const wait=async (min,max,captured)=>p.waitForFunction(({min,max,captured})=>{
     const raw=document.querySelector('#stage')?.dataset.f10CandidateState;
     if(!raw)return false;
     const a=JSON.parse(raw);
     return a.hinges===12&&a.lift>=min&&a.lift<=max&&(captured===null||captured===a.captured);
   },{min,max,captured},{timeout:30000});
   const shot=async name=>{if(proof)await p.screenshot({path:path.join(proof,`F10-${label}-${name}.png`)});};
   await wait(0,.005,0);
   assert.equal(await stage.getAttribute('data-blender-folio'),'10');
   assert.equal(await stage.evaluate(c=>c.hidden),false);
   await shot('arrival');
   const key=async k=>{await stage.focus();await p.keyboard.press(k);};
   await key('a');
   if(motion==='no-preference')await wait(.14,.88,null);
   await wait(.99,1,3);
   await shot('captured');
   const status=p.locator('#mechanism-status');
   const a=await status.textContent();
   await key('b');
   assert.notEqual(await status.textContent(),a);
   await wait(.99,1,3);
   await shot('horizon');
   const b=await status.textContent();
   await key('c');
   assert.notEqual(await status.textContent(),b);
   await wait(.99,1,3);
   await shot('protocol');
   await key('a');
   await wait(0,.005,0);
   assert.equal(await stage.getAttribute('data-blender-folio'),'10');
   await p.close();
   console.log('F10_WEBGL_PASS',label,'12 authored hinge detents; Drakken capture/recover; independent B and C');
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
