const assert=require('node:assert/strict');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const path=require('node:path');
const fs=require('node:fs');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8795';
const proof=process.env.PALIMPSEST_PROOF_DIR;
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
  const errors=[];
  for(const [label,viewport,motion] of [['desktop',{width:966,height:668},'no-preference'],['touch',{width:412,height:830},'reduce']]){
    const p=await browser.newPage({viewport,reducedMotion:motion,hasTouch:label==='touch'});
    p.on('pageerror',e=>errors.push(String(e)));
    const cdp=await p.context().newCDPSession(p);
    await p.addInitScript(()=>{
      const raf=window.requestAnimationFrame.bind(window);
      let time=performance.now(),held=false,holdWave=false;
      const history=[];
      window.__f10Proof={history,hold(){holdWave=true;},release(){held=false;holdWave=false;}};
      window.requestAnimationFrame=cb=>{
        function go(){
          const raw=document.querySelector('#stage')?.dataset.f10CandidateState;
          if(raw){
            const s=JSON.parse(raw);
            if(history.at(-1)!==raw)history.push(raw);
            if(holdWave&&s.lift>.37&&s.lift<.6)held=true;
          }
          if(held){raf(go);return;}
          time+=55;cb(time);
        }
        return raf(go);
      };
    });
    await p.goto(origin+'/folio-vnext.html?folio=10');
    const stage=p.locator('#stage');
    const status=p.locator('#mechanism-status');
    const shot=async id=>{if(proof){
      const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
      fs.writeFileSync(path.join(proof,`F10-${label}-${id}.png`),Buffer.from(data,'base64'));
    }};
    const key=async k=>{const previous=await status.textContent();await stage.focus();await p.keyboard.press(k);assert.notEqual(await status.textContent(),previous,k);};
    const wait=async (lift,captured,extra)=>p.waitForFunction(({lift,captured,extra})=>{
      const raw=document.querySelector('#stage')?.dataset.f10CandidateState;
      if(!raw)return false;
      const s=JSON.parse(raw);
      return s.hinges===12&&s.lift>=lift[0]&&s.lift<=lift[1]&&(captured===null||captured===s.captured)&&
        (!extra||Object.entries(extra).every(([k,v])=>s.story[k]===v))&&s;
    },{lift,captured,extra},{timeout:45000,polling:100}).then(h=>h.jsonValue());
    const arrival=await wait([0,.005],0,{record:false,horizon:false,litWindows:8,streaks:0});
    assert.equal(await stage.getAttribute('data-blender-folio'),'10');
    assert.ok(arrival.wave.every(v=>v===0));
    assert.deepEqual(arrival.story.environment,{folds:Array(10).fill(0),moved:0,shelterWarmth:0});
    await shot('arrival');
    if(motion==='no-preference')await p.evaluate(()=>window.__f10Proof.hold());
    await key('a');
    if(motion==='no-preference'){
      const wave=await wait([.37,.6],null);
      assert.ok(Math.max(...wave.wave)-Math.min(...wave.wave)>.55);
      assert.ok(wave.wave[6]>wave.wave[0]&&wave.wave[0]>wave.wave[5]);
      assert.ok(Math.max(...wave.story.environment.folds)>.65);
      assert.ok(Math.max(...wave.story.environment.folds)-Math.min(...wave.story.environment.folds)>.45);
      await shot('native-wave');await p.evaluate(()=>window.__f10Proof.release());
    }
    const secured=await wait([.9998,1],3);
    assert.ok(secured.wave.every(v=>v>=.99));
    assert.ok(secured.story.actors.every(v=>v==='below-lip'));
    const held=secured.story.environment;
    assert.equal(held.moved,9);assert.equal(held.shelterWarmth,1);
    assert.ok(held.folds.reduce((a,b)=>a+b,0)>5.8);
    if(motion==='no-preference'){
      const seen=await p.evaluate(()=>window.__f10Proof.history.flatMap(s=>JSON.parse(s).story.actors));
      assert.ok(['braced','slipping','descending'].every(p=>seen.includes(p)),seen.join(','));
    }
    await shot('below-lip');
    await key('b');
    const witnessed=await wait([.9998,1],3,{horizon:true,litWindows:8,streaks:1,record:false});
    assert.deepEqual(witnessed.story.environment,held);await shot('inhabited-horizon');
    await key('c');await wait([.9998,1],3,{door:1,record:true,streaks:1,horizon:true});await shot('threshold-open');
    await key('a');
    const reset=await wait([0,.005],0,{door:1,record:true,streaks:1,horizon:true});
    assert.deepEqual(reset.story.environment,arrival.story.environment);
    await key('c');await wait([0,.005],0,{door:0,record:false,streaks:1,horizon:true});
    await p.close();console.log('F10_STORY_WEBGL_PASS',label);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
