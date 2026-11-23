const assert=require('node:assert/strict');
const {writeFileSync}=require('node:fs');
const {join}=require('node:path');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const base=(process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8841')+'/folio-vnext.html';
const output=process.env.PALIMPSEST_PROOF_DIR;
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:800,height:650}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&/shader|webgl/i.test(m.text()))errors.push(m.text());});
  await p.addInitScript(save=>{
    const get=HTMLCanvasElement.prototype.getContext;
    if(save)HTMLCanvasElement.prototype.getContext=function(kind,opts){return get.call(this,kind,kind.startsWith('webgl')?{...opts,preserveDrawingBuffer:true}:opts);};
    if(location.search.includes('folio=2'))sessionStorage.setItem('palimpsest.folio.review.study-state.v1',JSON.stringify({version:1,folios:[null,{folio:1,f02:{reveal:3}}]}));
    window.trace=[];window.frames={};
    const prior=window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame=cb=>prior(now=>{
      cb(now);
      const stage=document.querySelector('#stage');
      if(!stage)return;
      const q=JSON.parse(stage.dataset.f12CandidateState||'null')?.paperFeed;
      if(q){
        window.trace.push(q);
        if(save&&(!window.frames[q.stage])){
          const png=stage.toDataURL('image/png');window.frames[q.stage]=png;
        }
      }
    });
  },Boolean(output));
  await p.goto(base+'?folio=12');
  await p.waitForFunction(()=>{
   const states=window.trace;
   return states.some(s=>s.stage==='residue'&&s.residues>0)&&states.some(s=>s.stage==='pressing'&&s.press>.25)&&states.some(s=>s.stage==='feeding'&&s.feed>.1)&&states.some(s=>s.stage==='leaving'&&s.eject>.1);
  },{},{timeout:65000});
  const proof=await p.evaluate(()=>({trace:window.trace,frames:window.frames,native:document.querySelector('#stage').dataset.blenderFolio}));
  assert.equal(proof.native,'12');
  assert.ok(new Set(proof.trace.map(x=>x.arm)).size>2);
  assert.ok(proof.trace.find(x=>x.residues>0).marked);
  assert.ok(proof.trace.every(x=>x.residues>=0&&x.residues<=4));
  for(const [k,raw] of Object.entries(proof.frames))writeFileSync(join(output,'f12-'+k+'.png'),Buffer.from(raw.split(',')[1],'base64'));
  await p.goto(base+'?folio=2');
  await p.waitForFunction(()=>{const s=document.querySelector('#stage');const q=JSON.parse(s?.dataset.f02Depth||'null');return s?.dataset.f02Detent==='3'&&q?.shadowStrength>.2&&q.shadowAt<3.70;},{},{timeout:60000});
  const shadow=await p.locator('#stage').getAttribute('data-f02-depth');
  console.log(JSON.stringify({native:proof.native,feedStages:[...new Set(proof.trace.map(x=>x.stage))],frames:proof.trace.length,shadow}));
  assert.deepEqual(errors,[]);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
