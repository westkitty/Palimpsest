const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const base=(process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8794')+'/folio-vnext.html?folio=8';
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
      const a=window.f08TrafficEvidence={states:[],hold:null,release(){this.hold=null;}};
      window.requestAnimationFrame=cb=>{
        function run(now){
          const raw=document.querySelector('#stage')?.dataset.f08CandidateState;
          const last=raw?JSON.parse(raw):null, t=last?.hookshotTraffic;
          if(t&&JSON.stringify(a.states.at(-1))!==raw)a.states.push(last);
          if(t&&(a.hold===t.phase||a.hold==='plane'&&t.permitted&&Math.abs(t.z-t.plane)<.18)){native(run);return;}
          cb(now);
        }
        return native(run);
      };
    });
    await p.goto(base);
    const state=()=>p.evaluate(read);
    const wait=async criteria=>p.waitForFunction(criteria,null,{timeout:85000,polling:75}).then(h=>h.jsonValue()).catch(async e=>{
      throw new Error('unreached state: '+JSON.stringify(await state()),{cause:e});});
    const shot=async key=>{if(dir){const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
      fs.writeFileSync(path.join(dir,'F08-'+mode+'-traffic-'+key+'.png'),Buffer.from(data,'base64'));}};
    const stage=p.locator('#stage');
    const key=async k=>{await stage.focus();await p.keyboard.press(k);};
    await wait(()=>document.querySelector('#stage')?.dataset.blenderFolio==='08');
    await wait(()=>JSON.parse(document.querySelector('#stage')?.dataset.f08CandidateState||'{}')?.hookshotTraffic?.phase==='front-berth');
    await shot('01-front-berth');
    if(!reduced)await p.evaluate(()=>window.f08TrafficEvidence.hold='holding');
    await key('a');
    if(!reduced){
      await wait(()=>JSON.parse(document.querySelector('#stage').dataset.f08CandidateState).hookshotTraffic?.phase==='holding');
      const hold=(await state()).hookshotTraffic;assert.ok(!hold.permitted&&hold.z>hold.plane);
      await shot('02-held-before-gate');
      await p.evaluate(()=>window.f08TrafficEvidence.hold='plane');
      await wait(()=>{const t=JSON.parse(document.querySelector('#stage').dataset.f08CandidateState).hookshotTraffic;
        return t?.permitted&&Math.abs(t.z-t.plane)<.18;});
      await shot('03-at-aperture');
      await p.evaluate(()=>window.f08TrafficEvidence.release());
    }
    await wait(()=>JSON.parse(document.querySelector('#stage').dataset.f08CandidateState).hookshotTraffic?.phase==='docked-far');
    const dock=(await state()).hookshotTraffic;
    assert.ok(dock.z<dock.plane&&dock.x<-3&&dock.progress===1);
    assert.equal(dock.crossings,reduced?0:1);
    await shot('04-arrived-far-side');
    const forward=await p.evaluate(()=>window.f08TrafficEvidence.states.map(x=>x.hookshotTraffic));
    if(!reduced){
      assert.ok(['approach','holding','transit','exit','docked-far'].every(x=>forward.some(s=>s.phase===x)));
      const j=forward.findIndex(s=>s.crossings===1);
      assert.ok(j>0&&forward[j-1].z>forward[j-1].plane&&forward[j].z<=forward[j].plane&&forward[j].permitted);
    }else assert.ok(!forward.some(s=>['approach','holding','transit','exit'].includes(s.phase)));
    await key('a');
    await wait(()=>{const s=JSON.parse(document.querySelector('#stage').dataset.f08CandidateState);return s.portalCue==='off'&&s.shutterFrames.every(x=>x===1);});
    assert.equal((await state()).hookshotTraffic.progress,1);
    await key('b');await key('c');
    await wait(()=>{const s=JSON.parse(document.querySelector('#stage').dataset.f08CandidateState);return s.authoredFrames.B===88&&s.authoredFrames.C===153;});
    const record=await state();assert.equal(record.rings,20);assert.equal(record.hookshotTraffic.progress,1);
    assert.deepEqual(record.shutterFrames,[1,1]);assert.deepEqual(record.leafFrames,[153,153,153,153]);
    if(dir)fs.writeFileSync(path.join(dir,'F08-'+mode+'-traffic-receipt.json'),JSON.stringify({mode,forward,dock,record},null,2));
    await p.close();console.log('F08_HOOKSHOT_TRAFFIC_WEBGL_PASS',mode);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
