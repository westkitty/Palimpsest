const assert=require('node:assert/strict');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const path=require('node:path');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8789';
const proof=process.env.PALIMPSEST_PROOF_DIR;
const requiredDevices=process.env.PALIMPSEST_F11_DEVICES?.split(',');
const beats=[
  ['ash',7],['single-patch',28],['gravity-redirect',47],['gutter-root',55],['gutter-root',61],
  ['gutter-cut',71],['unfold-wave',82],['canopy-full',94],['canopy-parts',101],['held-opening',109],
  ['tiger-late',124],['codec-withdraws',155],['codec-withdraws',173]
];
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try {
  const errors=[];
  for(const [label,viewport,motion] of [['desktop',{width:1120,height:760},'no-preference'],['touch',{width:412,height:830},'reduce']]){
    if(requiredDevices&&!requiredDevices.includes(label))continue;
    const p=await browser.newPage({viewport,reducedMotion:motion,hasTouch:label==='touch'});
    p.on('pageerror',e=>errors.push(String(e)));
    const frames=beats.map(b=>b[1]);
    const cdp=await p.context().newCDPSession(p);
    await p.addInitScript(({frames})=>{
      // Browser proof only: steady virtual animation timestamps, freeze at
      // requested checkpoints for a GPU screengrab, then release. The app
      // has no production seek API and no screenshot behavior.
      const raf=window.requestAnimationFrame.bind(window);
      const nativeNow=performance.now.bind(performance);
      let sim=nativeNow(), index=0, samples=[], stage;
      Object.defineProperty(performance,'now',{value:()=>sim});
      window.__f11Proof={samples,get held(){return frames[index]??0;},release(){index++;}};
      window.requestAnimationFrame=(cb)=>{
       function again(){
        stage ||= document.querySelector('#stage');
        const frame=Number(stage?.dataset.f11AuthoredFrame);
        const reached=Number.isFinite(frame)&&frame>=frames[index];
        if(reached&&!samples[index]){
          samples[index]={frame,...JSON.parse(stage.dataset.f11Story)};
        }
        if(reached){raf(again);return;}
        // Walk through the main roots and acting holds without spending
        // twenty-plus software renders on the revised three-second bird beat.
        // Close to a requested checkpoint, step narrowly as before.
        const left=frames[index]-frame;
        sim+=!Number.isFinite(frame)||left>7?335:left>3?185:67;
        cb(sim);
       }
       return raf(again);
      };
    },{frames});
    await p.goto(origin+'/folio-vnext.html?folio=11');
    await p.waitForFunction(()=>document.querySelector('#stage')?.dataset.blenderFolio==='11',null,{timeout:35000,polling:100});
    for(const [i,[name,target]] of beats.entries()){
      const s=await p.waitForFunction(i=>window.__f11Proof.samples[i]||false,i,{timeout:120000,polling:100}).then(h=>h.jsonValue()).catch(async error=>{
        const status=await p.evaluate(()=>({held:window.__f11Proof.held,frame:document.querySelector('#stage').dataset.f11AuthoredFrame,samples:window.__f11Proof.samples.length}));
        throw new Error(`Timed out: ${label} ${name}: ${JSON.stringify(status)}`,{cause:error});
      });
      assert.equal(s.beat,name,`checkpoint ${label} ${target}`);
      assert.ok(s.frame>=target&&s.frame<=target+2,[label,name,target,s.frame]);
      if(i===0)assert.deepEqual([s.patch,s.fibers,s.roots,s.split,s.canopy],Array(5).fill(0));
      if(i<=6)assert.deepEqual([s.wildlife.moth,s.wildlife.bird],['absent','absent']);
      if(i===7)assert.deepEqual([s.wildlife.moth,s.wildlife.bird],[label==='touch'?'perched':'flying','approach']);
      if(i===8)assert.ok(s.wildlife.birdBow>.90&&s.wildlife.bird==='inspect');
      if(i>=10)assert.deepEqual([s.wildlife.moth,s.wildlife.bird,s.wildlife.perch,s.wildlife.birdBow],
        ['perched','still','FROND_26_3',0]);
      if(i===1)assert.deepEqual([s.patch,s.roots,s.split],[1,0,0]);
      if(i===2)assert.ok(s.redirected>.49&&s.fibers===1&&s.roots===0);
      if(i===3)assert.ok(s.gutterRoot>.45&&s.gutterRoot<1&&s.roots===0&&s.rootedCanopy===0&&s.witness===null);
      if(i===4)assert.ok(s.gutterRoot===1&&s.split<.2&&s.rootedCanopy===1&&s.witness.id==='PLANT_22');
      if(i===5)assert.ok(s.split>.85&&s.witness.stem>.40);
      if(i===6)assert.ok(s.canopy>.60&&s.rootedCanopy>20,JSON.stringify(s));
      if(i===7)assert.ok(s.close>.95&&s.tiger===false);
      if(i===8)assert.ok(s.parted>.40&&s.tiger===false);
      if(i===9)assert.ok(s.parted===1&&s.close===0&&s.tiger===false);
      if(i===10)assert.equal(s.tiger,true);
      if(i>=11)assert.deepEqual([s.tiger,s.withdraw,s.codecIdle],[true,1,0]);
      if(i>=4){
        const fixed=await p.evaluate(()=>window.__f11Proof.samples[4].witness);
        assert.deepEqual([s.witness.id,s.witness.x,s.witness.z],[fixed.id,fixed.x,fixed.z],'same physical native plant remains fixed');
      }
      if(i===12){
        const anchor=await p.evaluate(()=>window.__f11Proof.samples[9].codecHeadPitch);
        assert.ok(Math.abs(anchor-s.codecHeadPitch)>17,'actual Codec head pitch changes');
      }
      const out=proof&&path.join(proof,`${label}-${String(i).padStart(2,'0')}-${name}.png`);
      if(out&&!require('node:fs').existsSync(out)&&([0,3,4,6,7,9,10,12].includes(i))){
        const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
        require('node:fs').writeFileSync(out,Buffer.from(data,'base64'));
      }
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
