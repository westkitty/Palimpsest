const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const out=process.env.PALIMPSEST_PROOF_DIR;
const base=(process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8789')+'/folio-vnext.html';
const mode=process.argv[2]||'desktop';
(async()=>{
 const fallback=mode==='fallback', reduced=mode!=='desktop';
 const args=fallback?['--no-sandbox','--disable-webgl']:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'];
 const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,args});
 try{
  const p=await browser.newPage({viewport:mode==='desktop'?{width:1100,height:740}:{width:412,height:830},reducedMotion:reduced?'reduce':'no-preference',hasTouch:mode==='phone'});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.addInitScript(()=>{
    window.catastropheTrace=[];
    window.watchCatastrophe=()=>{
      const stage=document.querySelector('#stage');
      new MutationObserver(()=>{
        const d=stage.dataset;
        const q=JSON.parse(d.f09CandidateState||'{}');
        const t={folio:d.revisionFolio,turn:d.pageTurn,cat:d.f09Catastrophe,frame:q.authorFrame,rings:q.survivingRings,chips:q.ruptureFragments,hist:q.historicalStep};
        const prior=window.catastropheTrace.at(-1);
        if(JSON.stringify(prior)!==JSON.stringify(t))window.catastropheTrace.push(t);
      }).observe(stage,{attributes:true});
    };
  });
  let tick=0;
  const wait=(k,v)=>p.waitForFunction(([k,v])=>document.querySelector('#stage')?.dataset[k]===v,[k,v],{timeout:35000});
  const save=async phase=>{if(out)await p.screenshot({path:path.join(out,`F09-${mode}-${String(++tick)}-${phase}.png`),timeout:30000});};
  await p.goto(base+'?folio=9');await p.evaluate(()=>window.watchCatastrophe());
  const action=slot=>p.locator(`[data-mechanism="${slot}"]`).click();
  if(!fallback)await wait('blenderFolio','09');
  await save('star');
  await action('B');
  await wait('revisionFolio','9');
  assert.equal((await p.evaluate(()=>window.catastropheTrace)).some(t=>t.cat),false);
  await action('A');
  if(!reduced){await wait('f09Catastrophe','rupture');await save('fracture');}
  await wait('f09Catastrophe','aftermath');
  if(fallback)assert.match(await p.locator('#later-plate-scene').textContent(),/DESTROYED MODEL AND MOUNT/);
  await save('ruin');
  await wait('revisionFolio','10');await wait('pageTurn','idle');await save('forced-destination');
  const t=await p.evaluate(()=>window.catastropheTrace);
  assert.ok(t.some(x=>x.cat==='aftermath'&&x.folio==='9'));
  if(!fallback){
    assert.ok(t.some(x=>x.cat==='aftermath'&&x.rings===0&&x.chips===4&&x.hist===1));
    assert.ok(t.some(x=>x.turn==='settling'));
    if(!reduced) assert.ok(t.some(x=>x.cat==='rupture'&&x.chips>4));
  }
  await p.locator('#prev').click();await wait('revisionFolio','9');await wait('pageTurn','idle');
  if(!fallback)await wait('blenderFolio','09');
  assert.equal(await p.locator('[data-mechanism="A"]').isDisabled(),true);
  await p.waitForTimeout(reduced?1350:4600);
  await wait('revisionFolio','9');await wait('pageTurn','idle');
  assert.equal(await p.locator('#next').isEnabled(),true);
  assert.equal(await p.locator('#stage').getAttribute('data-f09-catastrophe'),null);
  assert.deepEqual(errors,[]);console.log('F09_CATASTROPHE_PASS',mode,JSON.stringify(t.filter(x=>x.cat&&x.frame%5<.30).slice(-12)));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
