const assert=require('node:assert/strict');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const path=require('node:path');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8783';
const proof=process.env.PALIMPSEST_PROOF_DIR;
const expected=['barren','codec','marcel','jungle-growing','jungle-hold','tiger-arrival','emotional-split'];
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
    args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try {
    const errors=[];
    for(const [label,viewport,motion] of [['desktop',{width:1120,height:760},'no-preference'],['touch',{width:412,height:830},'reduce']]){
      const p=await browser.newPage({viewport,reducedMotion:motion,hasTouch:label==='touch'});
      p.on('pageerror',e=>errors.push(String(e)));
      await p.addInitScript(()=>{
        window.__f11Trace=[];
        const observe=()=>{
          const c=document.querySelector('#stage');if(!c){requestAnimationFrame(observe);return;}
          const remember=()=>{
            const phase=c.dataset.blenderFolio==='11'?c.dataset.revisionPhase:null;
            if(phase&&window.__f11Trace.at(-1)!==phase)window.__f11Trace.push(phase);
          };
          new MutationObserver(remember).observe(c,{attributes:true,attributeFilter:['data-revision-phase','data-blender-folio']});
          remember();
        };observe();
      });
      const url=process.env.PALIMPSEST_STANDALONE ? require('node:url').pathToFileURL(process.env.PALIMPSEST_STANDALONE).href+'?folio=11' : origin+'/folio-vnext.html?folio=11';
      await p.goto(url);
      const stage=p.locator('#stage');
      await p.waitForFunction(()=>document.querySelector('#stage')?.dataset.blenderFolio==='11',{},{timeout:30000});
      assert.equal(await stage.evaluate(x=>x.hidden),false);
      if(proof&&label==='desktop')await p.screenshot({path:path.join(proof,'F11-Arrival.png')});
      await p.waitForFunction(()=>window.__f11Trace.includes('emotional-split'),{},{timeout:55000}).catch(async e=>{
        const state=await stage.evaluate(c=>({phase:c.dataset.revisionPhase,frame:c.dataset.f11AuthoredFrame,trace:window.__f11Trace}));
        throw new Error(JSON.stringify({state,errors}),{cause:e});
      });
      assert.deepEqual(await p.evaluate(()=>window.__f11Trace),expected);
      await p.waitForFunction(()=>Number(document.querySelector('#stage')?.dataset.f11AuthoredFrame)>155,{},{timeout:25000});
      if(proof)await p.screenshot({path:path.join(proof,'F11-'+label+'.png')});
      await stage.focus();
      const status=p.locator('#mechanism-status');
      const before=await status.textContent();
      for(const k of ['a','b','c']){
        const previous=await status.textContent();await p.keyboard.press(k);
        assert.notEqual(await status.textContent(),previous,`F11 mechanism ${k} remains interactive`);
      }
      assert.notEqual(await status.textContent(),before);
      if(proof&&label==='desktop')await p.screenshot({path:path.join(proof,'F11-Controls.png')});
      assert.equal(await stage.getAttribute('data-blender-folio'),'11');
      await p.close();console.log('F11_WEBGL_PASS',label,expected.join('→'));
    }
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
