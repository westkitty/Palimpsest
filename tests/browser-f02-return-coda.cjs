const assert=require('node:assert/strict');
const path=require('node:path');
const {writeFileSync}=require('node:fs');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const base=(process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8841')+'/folio-vnext.html';
const output=process.env.PALIMPSEST_PROOF_DIR;
const key=async(p,k)=>{await p.locator('#stage').focus();await p.keyboard.press(k);};
const data=async(p,k)=>JSON.parse(await p.locator('#stage').getAttribute(k)||'null');
const attr=async(p,k,v)=>p.waitForFunction(([key,expected])=>document.querySelector('#stage')?.getAttribute(key)===expected,[k,v],{timeout:50000});
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
    args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const errors=[];
  try {
    for(const [label,viewport,reduced] of [['desktop',{width:990,height:670},false],['phone',{width:430,height:850},true]]){
      const p=await browser.newPage({viewport,hasTouch:label==='phone',reducedMotion:reduced?'reduce':'no-preference'});
      p.on('pageerror',e=>errors.push(e.message));
      p.on('console',m=>{if(m.type()==='error'&&/shader|webgl/i.test(m.text()))errors.push(m.text());});
      await p.addInitScript(({save,seed})=>{
        if(seed&&location.search.includes('folio=2'))sessionStorage.setItem('palimpsest.folio.review.study-state.v1',JSON.stringify({version:1,folios:[null,{folio:1,f02:{reveal:3}}]}));
        if(save){
          // QA-only readback avoids compositor screenshot timeouts on software
          // WebGL without changing the production animation or its scene.
          const get=HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext=function(kind,opts){return get.call(this,kind,kind.startsWith('webgl')?{...opts,preserveDrawingBuffer:true}:opts);};
        }
        window.proofTrace=[];window.proofCradle=null;
        function remember(){
          const stage=document.querySelector('#stage');
          if(stage?.dataset.f02Return){
            const q=JSON.parse(stage.dataset.f02Return);
            if(window.proofTrace.at(-1)?.at!==q.at)window.proofTrace.push(q);
            if(save&&q.stage==='crease-hold'&&!window.proofCradle)window.proofCradle=stage.toDataURL('image/png');
          }
          requestAnimationFrame(remember);
        }
        requestAnimationFrame(remember);
      },{save:Boolean(output),seed:process.env.PALIMPSEST_PROOF_SEED==='1'});
      const shot=async n=>{
        if(!output)return;
        const raw=await p.evaluate(n=>n==='02-crease-hold'&&window.proofCradle?window.proofCradle:document.querySelector('#stage').toDataURL('image/png'),n);
        assert.ok(raw.startsWith('data:image/png;base64,'));
        writeFileSync(path.join(output,label+'-'+n+'.png'),Buffer.from(raw.split(',')[1],'base64'));
      };
      await p.goto(base+'?folio=2',{waitUntil:'domcontentloaded'});
      await attr(p,'data-f02-challenger','ready');
      await key(p,'a');await key(p,'b');await key(p,'c');
      await attr(p,'data-f02-detent','3');
      await key(p,'g');await attr(p,'data-f02-witness','inside');
      await shot('01-between-suspended-folds');
      await key(p,'g');
      if(!reduced){
        await p.waitForFunction(()=>JSON.parse(document.querySelector('#stage')?.dataset.f02Return||'{}').stage==='crease-hold',{},{timeout:50000});
        await shot('02-crease-hold');
      }
      await attr(p,'data-f02-witness','overhead');
      const final=await data(p,'data-f02-return');
      assert.equal(final.stage,'page');
      assert.equal(final.collapse,1);assert.equal(final.glint,0);
      const trace=await p.evaluate(()=>window.proofTrace);
      if(!reduced){
        assert.ok(trace.some(x=>x.stage==='gathering'&&x.collapse>.25&&x.collapse<.9));
        const held=trace.filter(x=>x.stage==='crease-hold');
        assert.ok(held.length>2);
        assert.ok(held.every(x=>x.collapse===1&&JSON.stringify(x.look)===JSON.stringify(x.crease)));
        assert.equal(new Set(held.map(x=>JSON.stringify(x.position))).size,1);
        assert.ok(trace.some(x=>x.stage==='receding'&&x.recede>.25&&x.recede<.9));
      }else assert.ok(trace.every(x=>x.stage==='page'),'no intermediate flight in reduced motion');
      assert.equal(await p.locator('#stage').getAttribute('data-f02-detent'),'3');
      await shot('03-exact-reading-view');
      await key(p,'g');await attr(p,'data-f02-witness','inside');
      assert.equal(await p.locator('#stage').getAttribute('data-f02-return'),null);
      await p.goto(base+'?folio=13',{waitUntil:'domcontentloaded'});
      await attr(p,'data-revision-folio','coda');
      const initial=await data(p,'data-closing-rest');
      assert.ok(initial.angle>1.22&&initial.relief>.85);
      await attr(p,'data-closing-beat','held');
      const held=await data(p,'data-closing-rest');
      await p.waitForTimeout(800);
      assert.deepEqual(await data(p,'data-closing-rest'),held);
      assert.equal(await p.locator('#folio-description').textContent(),'Your fate is in our hands.');
      assert.ok(await p.locator('#next').isDisabled());
      await shot('04-coda-resting-rake');
      await key(p,'ArrowLeft');await attr(p,'data-page-turn','idle');await attr(p,'data-revision-folio','12');
      await key(p,'ArrowRight');await attr(p,'data-page-turn','idle');await attr(p,'data-revision-folio','coda');
      console.log(JSON.stringify({label,recordedF02Frames:trace.length,initial,held,final}));
      await p.close();
    }
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
