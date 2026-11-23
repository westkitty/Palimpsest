const assert=require('node:assert/strict');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const path=require('node:path');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8766';
const openURL=n=>process.env.PALIMPSEST_STANDALONE ? require('node:url').pathToFileURL(process.env.PALIMPSEST_STANDALONE).href+'?folio='+n : origin+'/folio-vnext.html?folio='+n;
const out=process.env.PALIMPSEST_PROOF_DIR||'/tmp';
(async()=>{
 const args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'];
 const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,args});
 const failures=[];
 async function screen(p,name){await p.screenshot({path:path.join(out,name+'.jpg'),quality:88,timeout:30000});}
 const touch=await browser.newContext({viewport:{width:962,height:680},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
 const p=await touch.newPage();
 p.on('pageerror',e=>failures.push(String(e)));
 const stage=p.locator('#stage');
 async function go(n){
   const response=await p.goto(openURL(n));assert.ok(process.env.PALIMPSEST_STANDALONE||response?.ok());
   await p.waitForFunction(expected=>document.querySelector('#stage')?.dataset.revisionFolio===expected,n===13?'coda':String(n),{timeout:25000});
   assert.equal(await stage.evaluate(e=>e.hidden),false,'requires actual WebGL');
   await stage.focus();
 }
 async function key(k){await stage.focus();await p.keyboard.press(k);}
 try{
  await go(1); await key('Enter');await p.waitForFunction(()=>document.querySelector('#stage').dataset.bookPhase==='open');await key('a');await screen(p,'F01');
  await go(2);
  await p.waitForFunction(()=>Number(document.querySelector('#stage').dataset.inkAdvance)===0);
  await screen(p,'F02-arrival');
  await p.locator('#toggle-panels').tap();
  await p.locator('[data-mechanism="A"]').tap();
  await p.waitForFunction(()=>Number(document.querySelector('#stage').dataset.inkAdvance)>.2);
  await key('b');await key('c');await p.waitForFunction(()=>Number(document.querySelector('#stage').dataset.inkAdvance)===1);
  await p.locator('#toggle-panels').tap();await screen(p,'F02-reveal');
  await go(3);await key('a');await key('b');await key('c');assert.match(await p.locator('#mechanism-status').textContent(),/Nimbus III.*Variation: 1/);await screen(p,'F03');
  const revised=process.env.PALIMPSEST_QUICK ? [11,12] : [4,5,6,7,8,9,10,11,12];
  for(const n of revised){
    await go(n);await key(n===4?'b':'a');if(n===12)await key('c');await screen(p,'F'+String(n).padStart(2,'0'));console.log('WebGL captured folio',n);
  }
  await key('ArrowRight');
  await p.waitForFunction(()=>document.querySelector('#stage').dataset.revisionFolio==='coda'&&document.querySelector('#stage').dataset.pageTurn==='idle');
  assert.equal(await p.locator('#folio-description').textContent(),'Your fate is in our hands.');
  await screen(p,'Coda');
  await key('ArrowRight');assert.equal(await stage.getAttribute('data-revision-folio'),'coda');
  await key('ArrowLeft');await p.waitForFunction(()=>document.querySelector('#stage').dataset.revisionFolio==='12'&&document.querySelector('#stage').dataset.pageTurn==='idle');
  await p.close();
  const desktop=await browser.newPage({viewport:{width:824,height:570},reducedMotion:'no-preference'});
  desktop.on('pageerror',e=>failures.push(String(e)));
  await desktop.addInitScript(()=>{
   const t=[];Object.defineProperty(window,'__phaseTrace',{value:t});
   const observe=()=>{const c=document.querySelector('#stage');if(!c){requestAnimationFrame(observe);return;}
    const check=()=>{const v=c.dataset.revisionPhase;if(v&&t.at(-1)!==v)t.push(v);};
    new MutationObserver(check).observe(c,{attributes:true,attributeFilter:['data-revision-phase']});check();};
   observe();
  });
  await desktop.goto(openURL(11));
  await desktop.waitForFunction(()=>window.__phaseTrace.includes('emotional-split'),undefined,{timeout:100000});
  const trace=await desktop.evaluate(()=>window.__phaseTrace);
  assert.deepEqual(trace,['barren','codec','marcel','jungle-growing','jungle-hold','tiger-arrival','emotional-split']);
  await screen(desktop,'F11-story');
  assert.deepEqual(failures,[]);
  console.log('PASS: '+(process.env.PALIMPSEST_QUICK?'selected':'all 12')+' WebGL spreads; early controls and tablet touch; reversible coda; exact F11 event order; no unexpected runtime errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
