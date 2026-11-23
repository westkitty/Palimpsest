const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8971';
const proof=process.env.PALIMPSEST_F11_PROOFDIR;
const devices=process.env.PALIMPSEST_F11_DEVICES?.split(',');
const checkpoints=[
  ['stations',32],['marcel-initiates',40],['codec-finishes',45],['shared-loam',48],
  ['bird-check',105],['bird-clears',111],['codec-nearly-follows',138],['turned-away',158]
];
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try {
  const errors=[];
  for(const [label,viewport,motion] of [['desktop',{width:1120,height:760},'no-preference'],['touch',{width:412,height:830},'reduce']]){
    if(devices&&!devices.includes(label))continue;
    const p=await browser.newPage({viewport,reducedMotion:motion,hasTouch:label==='touch'});
    p.on('pageerror',e=>errors.push(String(e)));
    const cdp=await p.context().newCDPSession(p);
    await p.addInitScript(({targets})=>{
      let sim=performance.now(), i=0;
      const raf=window.requestAnimationFrame.bind(window);
      Object.defineProperty(performance,'now',{value:()=>sim});
      window.__paperActing={seen:[],advance(){i++;}};
      window.requestAnimationFrame=(cb)=>raf(function next(){
        const stage=document.querySelector('#stage');
        if(Number(stage?.dataset.f11AuthoredFrame)>=targets[i]){
          window.__paperActing.seen[i] ||= JSON.parse(stage.dataset.f11Story);
          return raf(next);
        }
        sim+=Number(stage?.dataset.f11AuthoredFrame)&&targets[i]-Number(stage?.dataset.f11AuthoredFrame)<=7?67:500;cb(sim);
      });
    },{targets:checkpoints.map(([,f])=>f)});
    await p.goto(origin+'/folio-vnext.html?folio=11');
    await p.waitForFunction(()=>document.querySelector('#stage')?.dataset.blenderFolio==='11',null,{timeout:35000,polling:100});
    const poses=[];
    for(const [i,[name]] of checkpoints.entries()){
      const s=await p.waitForFunction(i=>window.__paperActing.seen[i]||false,i,{timeout:90000,polling:100}).then(h=>h.jsonValue());
      poses.push(s);
      assert.ok(s.choreography.groundContact,label+name);
      if(motion==='reduce')assert.equal(s.choreography.codec.bob+s.choreography.marcel.bob,0);
      if(proof){const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
        fs.writeFileSync(path.join(proof,`${label}-${name}.png`),Buffer.from(data,'base64'));}
      await p.evaluate(()=>window.__paperActing.advance());
      console.log('F11_ACTING_WEBGL',label,name,JSON.stringify(s.choreography),s.wildlife.encounter);
    }
    const [start,marcelStep,codecStep,lean,waiting,clear,hesitate,leave]=poses;
    assert.ok(marcelStep.choreography.marcel.x<start.choreography.marcel.x);
    assert.equal(marcelStep.choreography.codec.x,start.choreography.codec.x);
    assert.ok(codecStep.choreography.codec.x>start.choreography.codec.x);
    assert.equal(lean.choreography.beat,'shared-loam');
    assert.deepEqual([lean.gutterRoot,lean.rootedCanopy],[0,0]);
    assert.ok(lean.choreography.codec.pitch>.20&&lean.choreography.marcel.pitch>.20);
    assert.equal(waiting.choreography.beat,'wait-for-bird');
    assert.equal(waiting.wildlife.encounter,'in-path');
    assert.equal(waiting.tiger,false);
    assert.ok(Math.abs(waiting.wildlife.birdZ-waiting.choreography.marcel.z)<.05);
    assert.equal(clear.wildlife.encounter,'clear');
    assert.ok(clear.choreography.marcel.x>waiting.choreography.marcel.x+.14);
    assert.equal(hesitate.choreography.beat,'codec-plants');
    assert.equal(hesitate.tiger,true);
    assert.ok(leave.choreography.marcel.x>hesitate.choreography.marcel.x);
    assert.ok(leave.choreography.codec.x<hesitate.choreography.codec.x-.25);
    assert.equal(waiting.witness.id,leave.witness.id);
    assert.deepEqual([waiting.witness.x,waiting.witness.z],[leave.witness.x,leave.witness.z]);
    await p.close();
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
