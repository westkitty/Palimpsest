const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const base=(process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8793')+'/folio-vnext.html?folio=8';
const dir=process.env.PALIMPSEST_PROOF_DIR;
if(dir)fs.mkdirSync(dir,{recursive:true});
const read=()=>JSON.parse(document.querySelector('#stage')?.dataset.f08CandidateState||'null');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
  const errors=[];
  for(const [mode,width,height,reduced] of [['desktop',1050,720,false],['portrait',412,830,true]]){
    const p=await browser.newPage({viewport:{width,height},hasTouch:reduced,reducedMotion:reduced?'reduce':'no-preference'});
    p.on('pageerror',error=>errors.push(String(error)));
    const cdp=await p.context().newCDPSession(p);
    await p.addInitScript(()=>{
      const native=window.requestAnimationFrame.bind(window);
      const a=window.f08BrowserEvidence={states:[],hold:null,release(){this.hold=null;}};
      window.requestAnimationFrame=cb=>{
        function run(now){
          const raw=document.querySelector('#stage')?.dataset.f08CandidateState;
          const last=raw?JSON.parse(raw):null, z=last?.thresholdResponse;
          if(z&&JSON.stringify(a.states.at(-1))!==raw)a.states.push(last);
          if(z&&(a.hold==='crawl'&&z.pathHead===3||a.hold==='marcel'&&z.climb>.50&&z.climb<.85)){native(run);return;}
          cb(now);
        }
        return native(run);
      };
    });
    await p.goto(base);
    const wait=async criteria=>p.waitForFunction(criteria,null,{timeout:35000,polling:75}).then(h=>h.jsonValue());
    const shot=async key=>{if(dir){const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
      fs.writeFileSync(path.join(dir,'F08-'+mode+'-'+key+'.png'),Buffer.from(data,'base64'));}};
    const stage=p.locator('#stage');
    const key=async k=>{await stage.focus();await p.keyboard.press(k);};
    await wait(()=>document.querySelector('#stage')?.dataset.blenderFolio==='08');
    await wait(()=>JSON.parse(document.querySelector('#stage')?.dataset.f08CandidateState||'{}').thresholdResponse?.phase==='off');
    const before=await p.evaluate(read);
    assert.equal(before.rings,20);assert.ok(before.thresholdResponse.foldAngles.every(a=>a===.1));
    await shot('resting');
    if(!reduced)await p.evaluate(()=>window.f08BrowserEvidence.hold='crawl');
    await key('a');
    if(!reduced){
      await wait(()=>JSON.parse(document.querySelector('#stage').dataset.f08CandidateState).thresholdResponse?.pathHead===3);
      const mid=(await p.evaluate(read)).thresholdResponse;
      assert.ok(mid.foldAngles[0]>mid.foldAngles[6]+.23);
      assert.ok(mid.litEdges.slice(1,4).some(x=>x>.5)&&mid.litEdges.slice(4).every(x=>x===0));
      assert.equal(mid.actorLight,0);
      await shot('fold-crawl');
      await p.evaluate(()=>window.f08BrowserEvidence.hold='marcel');
      await wait(()=>{const s=JSON.parse(document.querySelector('#stage').dataset.f08CandidateState).thresholdResponse;return s.actorLight>1.5&&s.climb>.50&&s.climb<.85;});
      await shot('marcel-reflects');await p.evaluate(()=>window.f08BrowserEvidence.release());
    }
    await wait(()=>{const s=JSON.parse(document.querySelector('#stage').dataset.f08CandidateState);return s.portalCue==='settled'&&s.thresholdResponse?.climb===1;});
    const lit=await p.evaluate(read);
    assert.deepEqual(lit.shutterFrames,[40,40]);assert.equal(lit.plasma,1);
    assert.deepEqual(lit.authoredFrames,{A:40,B:1,C:1});
    await shot('settled');
    if(!reduced){
      const q=await p.evaluate(()=>window.f08BrowserEvidence.states.map(s=>s.thresholdResponse.pathHead));
      assert.deepEqual([...new Set(q.filter(i=>i>=0))],[0,1,2,3,4,5,6,7],'ordered head visits all seven folds and the actor');
    }
    await key('b');await key('c');
    await wait(()=>{const s=JSON.parse(document.querySelector('#stage').dataset.f08CandidateState);return s.authoredFrames.B===88&&s.authoredFrames.C===153;});
    const all=await p.evaluate(read);
    assert.equal(all.rings,20);assert.deepEqual(all.leafFrames,[153,153,153,153]);assert.deepEqual(all.shutterFrames,[40,40]);
    await shot('independent-twenty');
    await key('a');
    await wait(()=>{const s=JSON.parse(document.querySelector('#stage').dataset.f08CandidateState);return s.portalCue==='off'&&s.shutterFrames.every(x=>x===1);});
    const closed=await p.evaluate(read);
    assert.equal(closed.rings,20);assert.deepEqual(closed.authoredFrames,{A:1,B:88,C:153});
    assert.ok(closed.thresholdResponse.litEdges.every(x=>x===0)&&closed.thresholdResponse.foldAngles.every(x=>x===.1));
    await p.close();console.log('F08_THRESHOLD_WEBGL_PASS',mode);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
