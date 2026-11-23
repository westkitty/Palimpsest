const assert=require('node:assert/strict');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4173';
const cues=new Map([
  [4,/dock worker climbs.*fifth relay answers.*unfinished spur stays dark/i],
  [5,/workers pause.*clear a snag together/i],
  [6,/dispatch across its attached flap.*ledger remains blank/i],
  [7,/relief workers steady one load together.*ramp bends/i],
  [8,/ground crew clear the lane before the ship crosses/i],
  [11,/meet over the loam before the first root.*pauses to let a paper bird pass.*starts to follow, stops and turns away/i],
  [12,/service figures leave their stations.*stamp lands when the group is ready/i],
]);
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-webgl']});
  try{
    const page=await browser.newPage({viewport:{width:412,height:820},hasTouch:true,reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    for(const [folio,pattern] of cues){
      await page.goto(origin+'/folio-vnext.html?folio='+folio,{waitUntil:'domcontentloaded'});
      await page.locator('#webgl-fallback').waitFor({state:'visible'});
      assert.equal(await page.locator('#stage').isHidden(),true);
      assert.match(await page.locator('[data-later-cues]').textContent(),pattern,'F'+folio+' illustrated reading equivalent');
    }
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(()=>document.querySelector('#stage')?.dataset.revisionFolio==='coda');
    assert.equal(await page.locator('#coda-fallback').textContent().then(x=>x.trim()),'Your fate is in our hands.');
    assert.deepEqual(errors,[]);
    console.log('PASS: seven illustrated choreography folios and untouched closing imprint');
  }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
