const assert=require('node:assert/strict');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const path=require('node:path');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8789';
const proof=process.env.PALIMPSEST_PROOF_DIR;
const beats=[
  ['ash',7],['single-patch',28],['gravity-redirect',49],['fine-roots',61],['gutter-cut',71],
  ['unfold-wave',82],['canopy-full',95],['canopy-parts',101],['held-opening',109],['tiger-late',124],['codec-withdraws',168]
];
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try {
  const errors=[];
  for(const [label,viewport,motion] of [['desktop',{width:1120,height:760},'no-preference'],['touch',{width:412,height:830},'reduce']]){
    const p=await browser.newPage({viewport,reducedMotion:motion,hasTouch:label==='touch'});
    p.on('pageerror',e=>errors.push(String(e)));
    const frames=beats.map(b=>b[1]);
    await p.addInitScript(({frames})=>{
      // Browser proof only: steady virtual animation timestamps, freeze at
      // requested checkpoints for a GPU screengrab, then release. The app
      // has no production seek API and no screenshot behavior.
      const raf=window.requestAnimationFrame.bind(window);
      const nativeNow=performance.now.bind(performance);
      let sim=nativeNow(), index=0, samples=[], stage;
      Object.defineProperty(performance,'now',{value:()=>sim});
      window.__f11Proof={samples,get held(){return frames[index]??0;},release(){index++;}};
      window.requestAnimationFrame=(cb)=>raf(()=>{
        stage ||= document.querySelector('#stage');
        const frame=Number(stage?.dataset.f11AuthoredFrame);
        const reached=Number.isFinite(frame)&&frame>=frames[index];
        if(reached&&!samples[index]){
          samples[index]={frame,...JSON.parse(stage.dataset.f11Story)};
        }
        if(!reached)sim+=1000/30;
        cb(sim);
      });
    },{frames});
    await p.goto(origin+'/folio-vnext.html?folio=11');
    await p.waitForFunction(()=>document.querySelector('#stage')?.dataset.blenderFolio==='11',null,{timeout:35000,polling:100});
    for(const [i,[name,target]] of beats.entries()){
      const s=await p.waitForFunction(i=>window.__f11Proof.samples[i]||false,i,{timeout:45000,polling:100}).then(h=>h.jsonValue());
      assert.equal(s.beat,name,`checkpoint ${label} ${target}`);
      assert.ok(s.frame>=target&&s.frame<=target+2,[label,name,target,s.frame]);
      if(i===0)assert.deepEqual([s.patch,s.fibers,s.roots,s.split,s.canopy],Array(5).fill(0));
      if(i===1)assert.deepEqual([s.patch,s.roots,s.split],[1,0,0]);
      if(i===2)assert.ok(s.redirected>.70&&s.fibers===1&&s.roots===0);
      if(i===3)assert.ok(s.roots>.7&&s.split===0&&s.canopy===0);
      if(i===4)assert.ok(s.split>.85&&s.canopy===0);
      if(i===5)assert.ok(s.canopy>.65);
      if(i===6)assert.ok(s.close>.95&&s.tiger===false);
      if(i===7)assert.ok(s.parted>.40&&s.tiger===false);
      if(i===8)assert.ok(s.parted===1&&s.close===0&&s.tiger===false);
      if(i===9)assert.equal(s.tiger,true);
      if(i===10)assert.deepEqual([s.tiger,s.withdraw,s.codecIdle],[true,1,0]);
      if(proof&&(label==='desktop'||[0,2,4,6,8,10].includes(i)))
        await p.screenshot({path:path.join(proof,`${label}-${String(i).padStart(2,'0')}-${name}.png`),timeout:35000});
      await p.evaluate(()=>window.__f11Proof.release());
      console.log('F11_CHECKPOINT',label,JSON.stringify(s));
    }
    const stage=p.locator('#stage'),status=p.locator('#mechanism-status');
    await stage.focus();
    for(const k of ['a','b','c']){
      const old=await status.textContent();await p.keyboard.press(k);assert.notEqual(await status.textContent(),old,k);
    }
    assert.equal(await stage.getAttribute('data-blender-folio'),'11');
    await p.close();
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
