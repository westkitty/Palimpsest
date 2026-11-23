// Native scene proof against the Vite dev server. The same candidate-stage
// entry points as the reader render actual Blender GLBs at deterministic times.
const {chromium}=await import(process.env.PALIMPSEST_PLAYWRIGHT_MODULE||'playwright');
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const out=process.env.PALIMPSEST_PROOF_DIR;
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4640';
if(out)mkdirSync(out,{recursive:true});
const errors=[];
try{
 const p=await browser.newPage({viewport:{width:1100,height:730}});
 p.on('pageerror',e=>errors.push(String(e)));
 p.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text());});
 await p.route('**/workline-harness.html',r=>r.fulfill({body:'<!doctype html><body></body>',contentType:'text/html'}));
 await p.goto(origin+'/workline-harness.html',{waitUntil:'domcontentloaded'});
 for(const n of [4,5]){
  await p.evaluate(async n=>{
   globalThis[Symbol.for('palimpsest.qa.f05-offcut-sample')]=.03;
   document.body.replaceChildren();
   document.body.style.background='#151a20';
   const {newLaterState,operateLater}=await import('/src/vnext/laterFolioState.ts');
   const mod=await import('/src/vnext/proof/f0'+n+'CandidateStage.ts');
   const THREE=await import('/node_modules/three/build/three.module.js');
   const scene=new THREE.Scene();scene.background=new THREE.Color(0x151a20);
   const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
   renderer.setSize(960,640);renderer.setPixelRatio(1);
   renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;document.body.append(renderer.domElement);
   const camera=new THREE.PerspectiveCamera(36,960/640,.1,100);
   camera.position.set(n===4?.8:1.33,n===4?3.25:3.75,n===4?5.6:6.8);camera.lookAt(n===4?.47:1.60,.12,.22);
   scene.add(new THREE.HemisphereLight(0xf3f5ff,0x3a2921,1.35));
   const light=new THREE.DirectionalLight(0xffe1aa,2.25);light.position.set(2,6,4);scene.add(light);
   const blue=new THREE.DirectionalLight(0x9cbef5,.5);blue.position.set(-3,3,1);scene.add(blue);
   let stage, fail, ready;
   const loaded=new Promise((res,rej)=>{ready=res;fail=()=>rej(new Error('native scene unavailable'));});
   stage=n===4?mod.makeF04CandidateStage(null,()=>{},ready,fail):mod.makeF05CandidateStage(ready,fail);
   scene.add(stage.root);await loaded;
   let state=newLaterState(n-1);
   stage.update(state,0,false);
   window.worklineStage={
    action(k){state=operateLater(state,k);stage.update(state,0,false);},
    still(){stage.update(state,0,true);return stage.root.userData;},
    run(fn){
     const predicate=new Function('s','return ('+fn+')');
     let okay=false;
     for(let i=0;i<300;i++){
      const data=stage.root.userData;
      if(predicate(data)){okay=true;break;}
      stage.update(state,.034,false);
     }
     const data=stage.root.userData;
     if(!okay)throw new Error('Condition missed: '+fn+' / '+JSON.stringify(data,(k,v)=>k==='interactables'?null:v));
     renderer.render(scene,camera);
     return {data:n===4?{relay:data.relayChoreography,frame:data.expansionFrame,lit:data.litPlanets,echoes:data.litEchoes,dark:data.unfinishedLaneDark,receipt:data.endpointRoutine}:{line:data.factory,native:data.nativeLineFrame,ring:data.ring,planet:data.planetPhase,orbit:data.orbitalPhase},image:renderer.domElement.toDataURL()};
    },
    async reset(){stage.dispose();renderer.forceContextLoss();renderer.dispose();window.worklineStage=null;}
   };
  },n);
  async function action(k){await p.evaluate(k=>window.worklineStage.action(k),k);}
  async function cap(name,fn){
   const result=await p.evaluate(fn=>window.worklineStage.run(fn),fn);
   if(out)writeFileSync(join(out,'NATIVE-'+name+'.png'),Buffer.from(result.image.split(',')[1],'base64'));
   return result.data;
  }
  if(n===4){
   await cap('F04-1-before','s.expansionFrame===1');await action('B');
   const signal=await cap('F04-2-call','s.relayChoreography.call>.91&&s.relayChoreography.acknowledge<.5');assert.equal(signal.lit,4);
   const press=await cap('F04-3-press','s.relayChoreography.dispatch>.9&&!s.relayChoreography.relayFiveLit');assert.equal(press.lit,4);
   const wait=await cap('F04-4-wait','s.relayChoreography.waits>.815&&s.relayChoreography.relayFiveLit');assert.equal(wait.lit,5);
   const final=await cap('F04-5-end','s.expansionFrame===38&&s.endpointRoutine.cover>.95&&s.endpointRoutine.receipt>.75');
   assert.ok(final.dark&&final.lit===5&&final.echoes===5);
   const still=await p.evaluate(()=>{const s=window.worklineStage.still();return [s.litPlanets,s.relayChoreography.beat,s.relayChoreography.dispatch];});
   assert.deepEqual(still,[5,'dark-stop',0]);
  }else{
   await action('A');await action('B');
   await cap('F05-1-regular','s.factory.bay===1&&s.nativeLineFrame>63');await action('B');
   const flag=await cap('F05-2-flag','s.factory.snag.call>.9&&s.factory.rhythm.arrested');
   const clear=await cap('F05-3-clear','s.factory.snag.cohere>.950&&s.factory.snag.crease>.8');
   const reset=await cap('F05-4-restart','s.factory.snag.beat==="resume"&&!s.factory.rhythm.arrested');
   assert.equal(flag.native,clear.native);assert.equal(flag.line.rhythm.phase,clear.line.rhythm.phase);
   assert.equal(reset.line.snag.crease,0);
   assert.ok(flag.ring&&clear.ring&&clear.planet>flag.planet&&clear.orbit>flag.orbit);
   const fire=await cap('F05-5-independent-fire','s.factory.snag.beat==="settled"&&s.factory.offcut.heat>.875');
   assert.equal(fire.line.rhythm.arrested,false);
   const last=await cap('F05-6-settled','s.factory.snag.beat==="settled"&&s.factory.offcut.phase==="aftermath"');
   assert.ok(last.line.offcut.gone&&last.native>clear.native);
  }
  await p.evaluate(()=>window.worklineStage.reset());
 }
 assert.deepEqual(errors,[]);
 console.log('PASS native WebGL: relay call, physical switch, five lights and dark spur; B2 line freezes while two workers clear the strip, then resumes independently of A and the rare fire.');
} finally {await browser.close();}
