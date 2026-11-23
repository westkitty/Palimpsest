const assert=require('node:assert/strict');
const {mkdir,writeFile}=require('node:fs/promises');
const {join}=require('node:path');
const {chromium,devices}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4173';
const proof=process.env.PALIMPSEST_PROOF_DIR;
const timeout=90000;
const here={polling:100,timeout};

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
    args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const errors=[];
  async function open(number,options={}){
    const page=await browser.newPage({viewport:{width:620,height:480},...options});
    page.on('pageerror',e=>errors.push(String(e)));
    const cdp=await page.context().newCDPSession(page);
    await page.addInitScript(f=>{
      const stage=f===7?'f07CandidateState':'f06CandidateState';
      const beat=f===7?'reliefChoreography':'crossingDispatch';
      const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const stages=f===7?['adjust','complete']:reduce?['received']:['rupture','sliding','received'];
      // All native assets, code, transforms, and Three/WebGL renders are real.
      // Each intermediate RAF advances authored time, but only checkpoint
      // frames draw. That avoids filling the SwiftShader software draw queue.
      let drawing=true;
      for(const proto of [window.WebGL2RenderingContext?.prototype,window.WebGLRenderingContext?.prototype]){
        if(!proto)continue;
        for(const name of ['drawArrays','drawElements','drawRangeElements','drawArraysInstanced','drawElementsInstanced']){
          const draw=proto[name];if(!draw)continue;
          proto[name]=function(...args){if(drawing)return draw.apply(this,args);};
        }
      }
      let checkpoint=0,painted=-1,time=performance.now();
      const nativeRaf=window.requestAnimationFrame.bind(window);
      Object.defineProperty(performance,'now',{value:()=>time});
      window.__wartimeRelease=()=>checkpoint++;
      window.__wartimePainted=()=>painted;
      window.requestAnimationFrame=run=>{
        const pulse=()=>{
          const d=document.querySelector('#stage')?.dataset;
          const s=JSON.parse(d?.[stage]||'{}');
          const phase=s[beat]?.phase;
          const target=checkpoint<stages.length&&phase===stages[checkpoint]&&
            (phase!=='adjust'||s.reliefChoreography.rampDeflection>.052)&&
            (phase!=='rupture'||s.tearOpen>.30)&&
            (phase!=='sliding'||s.tearOpen>.95&&s.crossingDispatch.paperX>.18);
          if(target){
            if(painted!==checkpoint){painted=checkpoint;drawing=true;run(time);}
            else nativeRaf(pulse);
          }else{
            time+=60;drawing=false;run(time);
          }
        };
        return nativeRaf(pulse);
      };
    },number);
    await page.goto(origin+'/folio-vnext.html?folio='+number,{waitUntil:'domcontentloaded'});
    const ds=number===7?'f07CandidateState':'f06CandidateState';
    const beat=number===7?'reliefChoreography':'crossingDispatch';
    await page.waitForFunction(({ds,beat,n})=>{
      const d=document.querySelector('#stage')?.dataset;
      return Number(d?.blenderFolio)===n&&Boolean(JSON.parse(d?.[ds]||'{}')[beat]);
    },{ds,beat,n:number},here);
    await page.locator('#stage').focus();
    const key=k=>page.keyboard.press(k);
    const checkpoint=async(index,name)=>{
      await page.waitForFunction(i=>window.__wartimePainted?.()===i,index,here);
      const state=await page.evaluate(ds=>JSON.parse(document.querySelector('#stage').dataset[ds]),ds);
      if(proof){
        await mkdir(proof,{recursive:true});
        const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
        await writeFile(join(proof,name+'.png'),Buffer.from(data,'base64'));
      }
      await page.evaluate(()=>window.__wartimeRelease());
      return state;
    };
    return {page,key,checkpoint};
  }
  try{
    const f07=await open(7,{reducedMotion:'no-preference'});
    const paused=await f07.checkpoint(0,'F07-01-regrip');
    assert.equal(paused.reliefActors,2);
    assert.equal(paused.reliefChoreography.phase,'adjust');
    assert.ok(paused.reliefChoreography.contacts.every(n=>n<.005));
    assert.ok(paused.reliefChoreography.footHeights.flat().every(n=>n===0));
    assert.ok(paused.reliefChoreography.parcelTilt<-.22&&paused.reliefChoreography.rampDeflection>.052);
    const delivered=await f07.checkpoint(1,'F07-02-delivered');
    assert.ok(delivered.reliefPassed&&delivered.reliefChoreography.parcelX>paused.reliefChoreography.parcelX+.2);
    await f07.key('a');
    await f07.page.waitForFunction(()=>JSON.parse(document.querySelector('#stage').dataset.f07CandidateState).frameA===36,null,here);
    await f07.key('a');
    await f07.page.waitForFunction(()=>JSON.parse(document.querySelector('#stage').dataset.f07CandidateState).vellumCut===1,null,here);
    await f07.page.close();

    const f06=await open(6,{reducedMotion:'no-preference'});
    for(let i=0;i<3;i++)await f06.key('a');
    const rupture=await f06.checkpoint(0,'F06-01-rupture');
    const slide=await f06.checkpoint(1,'F06-02-slide');
    const received=await f06.checkpoint(2,'F06-03-received');
    assert.equal(rupture.crossingDispatch.phase,'rupture');
    assert.equal(slide.crossingDispatch.phase,'sliding');
    assert.equal(received.crossingDispatch.phase,'received');
    assert.ok(slide.crossingTorn&&slide.tearOpen>.95&&slide.crossingDispatch.paperParent==='attached-flap');
    assert.ok(rupture.crossingDispatch.paperX<slide.crossingDispatch.paperX&&
      slide.crossingDispatch.paperX<received.crossingDispatch.paperX);
    assert.equal(received.physicalBlankApertures,4);
    await f06.key('a');
    await f06.page.waitForFunction(()=>{
      const s=JSON.parse(document.querySelector('#stage').dataset.f06CandidateState);
      return s.crossingTorn&&s.tearOpen===.43&&s.crossingDispatch.phase==='off';
    },null,here);
    await f06.page.close();

    const phone=await open(6,{...devices['Pixel 7'],reducedMotion:'reduce'});
    for(let i=0;i<3;i++)await phone.key('a');
    const reduced=await phone.checkpoint(0,'F06-04-reduced');
    assert.equal(reduced.crossingDispatch.phase,'received');
    assert.equal(reduced.tearOpen,1);
    assert.ok(reduced.crossingTorn&&reduced.crossingDispatch.paperX>.5);
    await phone.page.close();
    assert.deepEqual(errors,[]);
    console.log('PASS F06 native bonded dispatch and rewind scar on desktop/reduced phone, F07 planted regrip and real native vellum notch.');
  }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
