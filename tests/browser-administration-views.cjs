const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require(process.env.PALIMPSEST_PLAYWRIGHT||'playwright');
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:8795';
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
    args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try{
    for(const [label,viewport,reducedMotion] of [['desktop',{width:952,height:654},'no-preference'],['portrait',{width:412,height:830},'reduce']]){
      if(process.env.PALIMPSEST_QA_VIEWPORT&&process.env.PALIMPSEST_QA_VIEWPORT!==label)continue;
      const p=await browser.newPage({viewport,reducedMotion,hasTouch:label==='portrait'});
      const cdp=await p.context().newCDPSession(p);
      await p.addInitScript(()=>{
        const frame=window.requestAnimationFrame.bind(window);
        let sample=performance.now();
        window.requestAnimationFrame=fn=>frame(()=>fn(sample+=56));
      });
      p.on('pageerror',error=>{console.error(error);process.exitCode=1;});
      const s=p.locator('#stage');
      const nav=number=>p.goto(origin+'/folio-vnext.html?folio='+number,{waitUntil:'domcontentloaded',timeout:90000});
      const camera=async()=>JSON.parse(await s.getAttribute('data-administration-view'));
      const verify=(sample)=>{
        const [x,y,z]=sample.position.map((value,i)=>value-sample.target[i]);
        assert.ok(Math.abs(Math.atan2(x,z))<=.821,'exterior front sector');
        assert.ok(Math.atan2(Math.hypot(x,z),y)<=1.101,'above paper figures');
        assert.ok(Math.hypot(x,y,z)>=2.399,'outside subject scale');
      };
      const key=async k=>{await s.focus();await p.keyboard.press(k);};
      const panel=async()=>{if(await p.locator('#toggle-panels').getAttribute('aria-expanded')==='false')await p.locator('#toggle-panels').click();};
      for(const folio of label==='portrait'&&!process.env.PALIMPSEST_QA_F10_ONLY?[5,6,10]:[10]){
        await nav(folio);
        await p.waitForFunction(()=>document.querySelector('#stage').dataset.administrationView,{},{timeout:45000});
        verify(await camera());
        await key('m');
        assert.equal(await p.locator('body').evaluate(el=>el.classList.contains('miniature')),false);
        assert.equal(await p.locator('#mini').isDisabled(),true);
      }
      await p.waitForFunction(()=>document.querySelector('#stage').dataset.blenderFolio==='10',{},{timeout:45000});
      await key('a');
      await p.waitForFunction(()=>{const state=JSON.parse(document.querySelector('#stage').dataset.f10CandidateState||'{}');return state.captured===3&&state.lift>=.9998;},{},{timeout:90000,polling:100});
      const state=()=>s.getAttribute('data-f10-candidate-state');
      const finalA=await state();
      await panel();
      const shot=async view=>{if(process.env.PALIMPSEST_PROOF_DIR){
        const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
        fs.writeFileSync(path.join(process.env.PALIMPSEST_PROOF_DIR,`F10-${label}-${view}.png`),Buffer.from(data,'base64'));
      }};
      const pose={};
      const targetX={wall:-.94,street:1.87,book:.38};
      for(const view of ['wall','street','book']){
        const button=p.locator(`button[data-f10-view="${view}"]`);
        await button.click();
        await p.waitForFunction(({view,expected})=>{
          const {f10View,f10ViewMotion,administrationView}=document.querySelector('#stage').dataset;
          const sample=administrationView?JSON.parse(administrationView):null;
          // Reduced-motion landing is synchronous; wait for the same pose to
          // be sampled at the next actual rendering frame.
          return f10View===view&&f10ViewMotion==='settled'&&sample&&Math.abs(sample.target[0]-expected)<.005;
        },{view,expected:targetX[view]},{timeout:45000});
        assert.equal(await button.getAttribute('aria-pressed'),'true');
        pose[view]=await camera();verify(pose[view]);
        assert.equal(await state(),finalA,'alternate reading never affects the operated wall');
        if(view!=='book'){
          await p.locator('#toggle-panels').click();await shot(view);await panel();
        }
      }
      assert.ok(pose.wall.target[0]<-.9&&pose.street.target[0]>1.6);
      if(label==='desktop'){
        await p.locator('#toggle-panels').click();
        await p.mouse.move(500,327);await p.mouse.down();await p.mouse.move(84,62,{steps:6});await p.mouse.up();
        await p.mouse.move(491,327);await p.mouse.wheel(0,-2600);await p.waitForTimeout(300);
        verify(await camera());
        assert.equal(await state(),finalA);
      }
      // The unrelated Geode inspection remains available and is not a Drakken viewpoint.
      if(!process.env.PALIMPSEST_QA_F10_ONLY){
        await nav(2);await key('m');
        assert.equal(await p.locator('body').evaluate(el=>el.classList.contains('miniature')),true);
      }
      await p.close();
      console.log('ADMINISTRATION_EXTERIOR_WEBGL_PASS',label);
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
