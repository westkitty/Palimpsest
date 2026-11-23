const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const base=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4541';
const out=process.env.PALIMPSEST_PROOF_DIR;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  for(const [mode,viewport,motion] of [['desktop',{width:1120,height:760},'no-preference'],['touch',{width:412,height:830},'reduce']]){
   const p=await browser.newPage({viewport,reducedMotion:motion,hasTouch:mode==='touch'});
   const errors=[];p.on('pageerror',x=>errors.push(String(x)));
   await p.addInitScript(()=>{
    window.__f01Trace=[];
    const attach=()=>{
     const stage=document.querySelector('#stage');if(!stage){requestAnimationFrame(attach);return;}
     new MutationObserver(()=>{
      if(!stage.dataset.f01Stage)return;
      const s=JSON.parse(stage.dataset.f01Stage),last=window.__f01Trace.at(-1);
      const beat=s.stations.filter(n=>n===1).length;
      const next={beat,stations:s.stations,arch:s.archJoin>0,territories:s.territories};
      if(!last||[last.beat,last.arch].join()!==[next.beat,next.arch].join())window.__f01Trace.push(next);
     }).observe(stage,{attributes:true,attributeFilter:['data-f01-stage']});
    };attach();
   });
   await p.goto(base+'/folio-vnext.html?folio=1');
   const stage=p.locator('#stage');
   const snap=label=>out?p.screenshot({path:path.join(out,'F01-'+mode+'-'+label+'.png')}):Promise.resolve();
   const verify=(state,timeout=90000)=>p.waitForFunction(req=>{
     const node=document.querySelector('#stage');if(!node?.dataset.f01Stage)return false;
     const s=JSON.parse(node.dataset.f01Stage);
     return (req.detent===undefined||node.dataset.f01Detent===String(req.detent))
        && (req.beat===undefined||s.stations.filter(n=>n>=1).length===req.beat)
        && (req.join===undefined||s.archJoin===req.join)
        && (req.phase===undefined||node.dataset.bookPhase===req.phase)
        && (req.moving===undefined||node.dataset.f01Moving===String(req.moving));
   },state,{timeout});
   const press=async key=>{await stage.focus();await p.keyboard.press(key);};
   await p.waitForFunction(()=>document.querySelector('#stage')?.dataset.f01Challenger==='ready');
   if((await stage.getAttribute('data-book-phase'))==='closed')await press('Enter');
   await verify({beat:0,join:0,phase:'open',detent:0});
   await snap('stored');
   await press('a');
   if(mode==='desktop'){
     await verify({beat:1,join:0});
     await snap('first-arrival');
   }
   await verify({beat:3,join:1,phase:'open',detent:1,moving:false});
   await snap('resolved');
   const s=await stage.evaluate(node=>JSON.parse(node.dataset.f01Stage));
   assert.ok(s.depths.every(v=>v>.12));
   assert.deepEqual(s.territories,[.77,.77,.77]);
   const trace=await p.evaluate(()=>window.__f01Trace);
   if(mode==='desktop'){
     assert.deepEqual([...new Set(trace.map(t=>t.beat))],[0,1,2,3]);
     assert.ok(trace.every(t=>!t.arch||t.beat===3));
     assert.ok(trace.some(t=>t.beat===1&&t.territories[0]>t.territories[2]));
     assert.equal(new Set(s.idleTimes.map(v=>v.toFixed(2))).size,3);
   }else{
     assert.deepEqual([...new Set(trace.map(t=>t.beat))],[0,3]);
     assert.deepEqual(s.idleTimes,[0,0,0]);
   }
   for(const [key,detent] of [['b',3],['c',7]]){
     await press(key);await verify({detent,join:1,moving:false});
   }
   await press('a');await verify({detent:6,join:0,beat:0,moving:false});
   assert.deepEqual(errors,[]);
   console.log('F01_ENVIRONMENT_BROWSER_PASS',mode,trace.map(t=>t.beat+'/'+Number(t.arch)).join('→'));
   await p.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
