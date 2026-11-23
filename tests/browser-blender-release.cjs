const assert=require('node:assert/strict');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const {pathToFileURL}=require('node:url');
const shell=process.env.PALIMPSEST_CHROME_PATH;
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4173';
const standalone=process.env.PALIMPSEST_STANDALONE;
const entry=standalone?pathToFileURL(standalone).href:origin+'/folio-vnext.html';
const expected=process.env.PALIMPSEST_FOLIOS?
  new Set(process.env.PALIMPSEST_FOLIOS.split(',').map(Number)):new Set(Array.from({length:12},(_,i)=>i+1));
const failures=[];
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:shell,
    args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1000,height:700},reducedMotion:'reduce'});
    const stage=page.locator('#stage');
    page.on('pageerror',why=>failures.push(String(why)));
    page.on('request',request=>{
      if(standalone&&/^https?:/.test(request.url()))failures.push('offline review required an outside request');
    });
    const wait=(kv)=>page.waitForFunction(entries=>entries.every(([k,v])=>document.querySelector('#stage')?.dataset[k]===v),
      Object.entries(kv),{timeout:30000});
    const press=async key=>{await stage.focus();await page.keyboard.press(key);};
    await page.goto(entry,{waitUntil:'domcontentloaded'});
    await wait({revisionFolio:'1',bookPhase:'closed'});
    assert.equal(await stage.evaluate(x=>x.hidden),false,'actual WebGL, not illustrated fallback');
    await press('Enter');await wait({bookPhase:'open'});
    for(let n=1;n<=12;n++){
      if(n!==1){
        await press('ArrowRight');await wait({revisionFolio:String(n),pageTurn:'idle'});
      }
      if(!expected.has(n))continue;
      if(n===1)await wait({f01Challenger:'ready'});
      else if(n===2)await wait({f02Challenger:'ready'});
      else await wait({blenderFolio:String(n).padStart(2,'0')});
      const status=page.locator('#mechanism-status');
      const before=await status.textContent();
      // F03's status describes template/variation, not its A-open toggle.
      const key=n===3?'b':'a';
      await press(key);
      assert.notEqual(await status.textContent(),before,'folio '+n+' '+key.toUpperCase()+' changes study state');
      assert.deepEqual(failures,[]);
      console.log('Native Blender runtime: F'+String(n).padStart(2,'0'));
      if(n===9){
        await wait({revisionFolio:'10',pageTurn:'idle'});
        // Return for the independent F10 check; a spent plate never auto-turns again.
        await press('ArrowLeft');await wait({revisionFolio:'9',pageTurn:'idle'});
      }
    }
    await press('ArrowRight');await wait({revisionFolio:'coda',pageTurn:'idle'});
    assert.equal(await page.locator('#folio-description').textContent(),'Your fate is in our hands.');
    await press('ArrowLeft');await wait({revisionFolio:'12',pageTurn:'idle'});
    if(expected.has(12))await wait({blenderFolio:'12'});
    assert.deepEqual(failures,[]);
    console.log('PASS: '+expected.size+' expected native imports, 12 living spreads, A actions, separate reverse coda.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
