const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const output=process.env.PALIMPSEST_PROOF_DIR;
const url=(process.env.PALIMPSEST_STANDALONE
  ? pathToFileURL(process.env.PALIMPSEST_STANDALONE).href
  : (process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4512')+'/folio-vnext.html')+'?folio=9';
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,args:[
    '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try{
    const pages=[['desktop',{width:1190,height:790},'no-preference'],['touch',{width:412,height:830},'reduce']];
    for(const [form,viewport,reducedMotion] of pages){
      const p=await browser.newPage({viewport,reducedMotion,hasTouch:form==='touch'});
      const errors=[];const messages=[];
      p.on('pageerror',e=>errors.push(String(e)));
      p.on('console',x=>{if(x.type()==='warning'||x.type()==='error')messages.push(x.text());});
      await p.addInitScript(()=>{
        window.__f09Reads=[];
        const setup=()=>{
          const stage=document.querySelector('#stage');
          if(!stage){requestAnimationFrame(setup);return;}
          new MutationObserver(()=>{
            if(stage.dataset.f09CandidateState){
              const n=JSON.parse(stage.dataset.f09CandidateState), last=window.__f09Reads.at(-1);
              if(!last||Math.abs(n.authorFrame-last.authorFrame)>.6||n.modelState!==last.modelState||n.historicalStep!==last.historicalStep||n.survey!==last.survey){
                window.__f09Reads.push(n);
              }
            }
          }).observe(stage,{attributes:true,attributeFilter:['data-f09-candidate-state']});
        };setup();
      });
      const stage=p.locator('#stage');
      const ready=()=>p.waitForFunction(()=>document.querySelector('#stage')?.dataset.blenderFolio==='09',null,{timeout:20000});
      const state=()=>stage.evaluate(e=>JSON.parse(e.dataset.f09CandidateState));
      const field=(key,value)=>p.waitForFunction(([key,value])=>
        JSON.parse(document.querySelector('#stage').dataset.f09CandidateState||'{}')[key]===value,[key,value]);
      const save=async(label)=>{if(output)await p.screenshot({path:path.join(output,'F09-'+form+'-'+label+'.png')});};
      await p.goto(url);await ready().catch(async e=>{throw new Error(JSON.stringify({errors,messages}),{cause:e});});
      await p.waitForFunction(()=>document.querySelector('#stage')?.dataset.bookPhase==='open',null,{timeout:15000});
      await stage.focus();
      const before=await state();
      assert.equal(before.modelState,'star');assert.equal(before.authorFrame,1);
      assert.deepEqual(before.witness,[0,0,0]); assert.equal(before.historicalStep,0);
      await save('model');
      await p.keyboard.press('b');
      await field('historicalStep',1);
      assert.equal((await state()).authorFrame,1);
      await p.keyboard.press('c');
      await field('survey',true);
      assert.equal((await state()).historicalStep,1);
      if(form==='desktop')await p.mouse.click(551,405); // original mesh of cyan pull ring, not keyboard/overlay
      else await p.keyboard.press('a');
      await field('latched',true);
      if(form==='desktop'){
        await p.waitForFunction(()=>JSON.parse(document.querySelector('#stage').dataset.f09CandidateState).authorFrame>26);
        await save('inward-pull');
      }
      await p.waitForFunction(()=>JSON.parse(document.querySelector('#stage').dataset.f09CandidateState).authorFrame===70,null,{timeout:18000});
      const after=await state();
      assert.equal(after.modelState,'matte-absence');
      assert.equal(after.latched,true);
      assert.ok(after.witness[0] > after.witness[1] && after.witness[1] > after.witness[2]);
      assert.ok(after.foldDegrees>101 && after.filamentTravel>1.63);
      assert.equal(after.activeFilamentMorphs,1);
      assert.equal(after.slivers,0);
      assert.equal(after.historicalStep,1);
      assert.equal(after.survey,true);
      if(form==='desktop'){
        const trace=await p.evaluate(()=>window.__f09Reads);
        assert.ok(trace.some(n=>n.authorFrame>20&&n.authorFrame<44&&n.slivers>0&&n.filamentTravel>.1&&n.activeFilamentMorphs>0));
        assert.ok(trace.some(n=>n.modelState==='extraction'&&n.foldDegrees>10));
        assert.ok(trace.every(n=>n.authorFrame<10||n.historicalStep===1),'no reaction of historical B to A');
      }
      await save('latched');
      await p.keyboard.press('a');assert.equal((await state()).authorFrame,70);
      for(let i=0;i<4;i++)await p.keyboard.press('b');
      await field('historicalStep',3);
      assert.equal((await state()).authorFrame,70);
      await p.keyboard.press('c');
      await field('survey',false);
      await p.reload();await ready();
      await p.waitForFunction(()=>JSON.parse(document.querySelector('#stage').dataset.f09CandidateState||'{}').authorFrame===70);
      const restored=await state();
      assert.equal(restored.historicalStep,3);
      assert.equal(restored.survey,false);
      assert.deepEqual(errors,[]);
      await p.close();console.log('F09_WEBGL_PASS',form,'A source-native→latched, historical B to 3, C independent, reload held');
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
