const assert=require('node:assert/strict');
const {mkdirSync,writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8973';
const proof=process.env.PALIMPSEST_PROOF_DIR;
if(proof)mkdirSync(proof,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
    args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const errors=[];
  const onlyFolios=(process.env.PALIMPSEST_PROCESSION_FOLIOS||'8,12').split(',').map(Number);
  const motionModes=process.env.PALIMPSEST_PROCESSION_MOTION==='reduced'?[true]:
    process.env.PALIMPSEST_PROCESSION_MOTION==='full'?[false]:[false,true];
  async function runFolio(folio,reduced) {
    const scene=String(folio).padStart(2,'0');
    const p=await browser.newPage({viewport:reduced?{width:412,height:790}:{width:960,height:690},reducedMotion:reduced?'reduce':'no-preference'});
    const cdp=await p.context().newCDPSession(p);
    p.on('pageerror',e=>errors.push(String(e)));
    await p.addInitScript(({scene,reduced})=>{
      const saved=window.requestAnimationFrame.bind(window), read=()=>JSON.parse(document.querySelector('#stage')?.dataset['f'+scene+'CandidateState']||'null');
      window.evidence={trace:[],hold:reduced?'':scene==='12'?'stations':'',resume(tag=''){this.hold=tag;}};
      const frame=window.evidence;
      window.requestAnimationFrame=cb=>{function run(t){
        const s=read();
        if(s){
          const key=JSON.stringify(s); if(key!==frame.last){frame.last=key;frame.trace.push(s);}
          const f=s.paperFeed, r=s.hookshotTraffic;
          if(frame.hold && (frame.hold==='pressure'?f?.press>.75:
            frame.hold==='hold-native'?r?.phase==='holding'&&r?.nativeShuttersReady&&!r?.crew?.clear:
              frame.hold==='full-grip'?r?.crew?.grip>.999:
                frame.hold==='following'?r?.phase==='transit'&&Math.abs(r?.marcelLook)>.50:
                  frame.hold==='invitation'?f?.portrait?.phase==='make-room'&&f.portrait.poses[2].glance>.65:
                  frame.hold===(f?.portrait?.phase||r?.crew?.phase))){saved(run);return;}
        }
        cb(t);
      }return saved(run);};
    },{scene,reduced});
    async function wait(f){
      return p.waitForFunction(f,null,{timeout:95000,polling:100}).then(x=>x.jsonValue()).catch(async e=>{
        const trace=await p.evaluate(()=>window.evidence.trace);
        throw new Error('F'+scene+' absent, recent feature evidence '+JSON.stringify(trace.slice(-1)),{cause:e});
      });
    }
    async function shot(key){
      if(!proof)return;
      const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
      writeFileSync(join(proof,['F'+scene,reduced?'reduced':'full',key].join('-')+'.png'),Buffer.from(data,'base64'));
    }
    const resume=tag=>p.evaluate(tag=>window.evidence.resume(tag),tag);
    await p.goto(origin+'/folio-vnext.html?folio='+folio,{waitUntil:'domcontentloaded'});
    await p.waitForFunction(scene=>document.querySelector('#stage')?.dataset.blenderFolio===scene,scene,{timeout:55000,polling:100});
    if(folio===8){
      const key=async k=>{await p.locator('#stage').focus();await p.keyboard.press(k);};
      await wait(()=>window.evidence.trace.at(-1)?.hookshotTraffic?.phase==='front-berth');
      if(!reduced)await resume('full-grip');
      await key('a');
      if(!reduced){
        const hand=await wait(()=>{const x=window.evidence.trace.at(-1)?.hookshotTraffic;return x?.crew?.grip>.999&&x;});
        assert.ok(hand.crew.gripGap<.001);
        assert.equal(hand.permitted,false);assert.equal(hand.crossings,0);
        await shot('01-hand-clasp');
        await resume('hold-native');
        const hold=await wait(()=>{const x=window.evidence.trace.at(-1)?.hookshotTraffic;return x?.nativeShuttersReady&&x.phase==='holding'&&!x.crew.clear&&x;});
        assert.ok(hold.z>hold.plane&&!hold.permitted);
        await shot('02-open-but-holding');
        await resume('following');
        const looking=await wait(()=>{const x=window.evidence.trace.at(-1)?.hookshotTraffic;return x?.crew?.clear&&x.phase==='transit'&&Math.abs(x.marcelLook)>.5&&x;});
        assert.equal(looking.permitted,true);
        assert.ok(looking.crew.positions.every(x=>x[0]>-1.24));
        await shot('03-marcel-follows');
        await resume('');
      }
      const dock=await wait(()=>{const x=window.evidence.trace.at(-1)?.hookshotTraffic;return x?.phase==='docked-far'&&x.crew?.clear&&x;});
      assert.equal(dock.crossings,reduced?0:1);
      await shot('04-far-berth');
      if(reduced)assert.ok(!(await p.evaluate(()=>window.evidence.trace.some(x=>x.hookshotTraffic?.crew?.grip>0))));
    }else{
      if(!reduced){
        const home=await wait(()=>{const f=window.evidence.trace.at(-1)?.paperFeed;return f?.portrait?.phase==='stations'&&f;});
        assert.equal(new Set(home.portrait.poses.map(x=>x.x)).size,4);
        await shot('01-four-stations');
        await resume('off-mark');
        const late=await wait(()=>{const f=window.evidence.trace.at(-1)?.paperFeed;return f?.portrait?.phase==='off-mark'&&f;});
        assert.ok(late.portrait.poses[3].z>late.portrait.poses[2].z+.11);
        await shot('02-out-of-line');
        await resume('invitation');
        await wait(()=>{const x=window.evidence.trace.at(-1)?.paperFeed?.portrait;
          return x?.phase==='make-room'&&x.poses[2].glance>.65;});
        await shot('03-makes-room');
        await resume('pressure');
      }
      const marks=await wait(()=>{const f=window.evidence.trace.at(-1)?.paperFeed;
        return f?.portrait?.grouped&&(f.press>.75||f.stage==='parked')&&f;});
      assert.ok(marks.portrait.poses.every(x=>x.z===1.28&&x.feet.every(y=>y===0)));
      if(reduced)assert.equal(marks.stage,'parked');
      await shot('04-portrait-at-press');
    }
    if(proof)writeFileSync(join(proof,`F${scene}-${reduced?'reduced':'full'}.json`),
      JSON.stringify(await p.evaluate(()=>window.evidence.trace),null,2));
    console.log('PASS native F'+scene,(reduced?'reduced':'full'));
    await p.close();
  }
  try{
    for(const reduced of motionModes)for(const folio of onlyFolios)await runFolio(folio,reduced);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
