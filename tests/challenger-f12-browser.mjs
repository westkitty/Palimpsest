import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';

const {chromium}=await import(process.env.PALIMPSEST_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4612';
const proof=process.env.PALIMPSEST_PROOF_DIR;
const errors=[],native=[];
const [width,height]=(process.env.PALIMPSEST_F12_VIEWPORT||'1440x950').split('x').map(Number);
async function screen(page,name){
  if(proof){await mkdir(proof,{recursive:true});await page.screenshot({path:join(proof,name),timeout:90000});}
}
const getState=page=>page.locator('#stage').evaluate(c=>JSON.parse(c.dataset.f12CandidateState??'{}'));
const wait=async(page,key,value)=>page.waitForFunction(([k,v])=>JSON.parse(
  document.querySelector('#stage')?.dataset.f12CandidateState??'{}')[k]===v,[key,value],{timeout:45000});
const use=async(options={})=>{
  const page=await browser.newPage({viewport:{width,height},...options});
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('console',message=>{if(/PropertyBinding|F12.*unavailable|GL_INVALID/.test(message.text()))errors.push(message.text());});
  page.on('response',r=>{if(/palimpsest-f12-.*\.glb$/.test(new URL(r.url()).pathname)&&r.ok())native.push(r.url());});
  await page.goto(origin+'/folio-vnext.html?folio=12',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const d=document.querySelector('#stage')?.dataset;return d?.blenderFolio==='12'&&d?.f12CandidateState;});
  return page;
};
const tap=async(page,key)=>{await page.locator('#stage').focus();await page.keyboard.press(key);};
const noLegacy=async page=>assert.doesNotMatch(await page.locator('body').innerText(),
  /\bKail\b|last known surviving initiate|your fate is in our hands\./i);
try{
  const reduced=await use({reducedMotion:'reduce'});
  const initial=await getState(reduced);
  assert.equal(initial.horizonPieces,6);
  assert.equal(initial.creaseFixed,true);
  assert.equal(initial.archiveFrame,1);
  assert.equal(initial.claimFrame,1);
  assert.equal(initial.study.inert,false);
  assert.equal(initial.stampPresent,true);
  assert.equal(initial.recruitmentPresent,true);
  assert.equal(initial.stationCount,4);
  assert.equal(initial.archiveRecessVisible,true);
  assert.ok(initial.cityGap>.40);
  assert.equal(initial.stampPress,0);
  assert.equal(initial.stampFaceMarked,true);
  assert.ok(['Rebuilders','Surveyors','Relief Crews','Record Keepers'].includes(initial.role));
  await noLegacy(reduced);
  await screen(reduced,'F12-01-closed.png');

  // Separate B can act while both of the authored paper tracks stay put.
  await tap(reduced,'b');
  await reduced.waitForFunction(()=>JSON.parse(document.querySelector('#stage')?.dataset.f12CandidateState??'{}').study?.inert===true);
  let state=await getState(reduced);
  assert.equal(state.archiveFrame,1);assert.equal(state.claimFrame,1);
  assert.equal(state.study.emission,0);
  await tap(reduced,'a');await wait(reduced,'claimFrame',28);
  state=await getState(reduced);assert.ok(state.splitDistance>initial.splitDistance+.40);
  assert.ok(state.cityGap>initial.cityGap+.40,'same physical split as the native A tracks');
  assert.equal(state.archiveFrame,1);assert.equal(state.study.inert,true);
  await tap(reduced,'c');await wait(reduced,'archiveFrame',67);
  state=await getState(reduced);
  assert.equal(state.claimFrame,28);assert.equal(state.study.inert,true);
  assert.ok(state.archiveAngle<-1.82&&state.archiveAngle>-1.84);assert.equal(state.creaseFixed,true);
  await noLegacy(reduced);
  await screen(reduced,'F12-02-open-B-inert.png');
  await tap(reduced,'b');
  await reduced.waitForFunction(()=>JSON.parse(document.querySelector('#stage')?.dataset.f12CandidateState??'{}').study?.inert===false);
  assert.equal((await getState(reduced)).archiveFrame,67);
  const beforeRole=await getState(reduced);
  const seenRole=beforeRole.role;
  await reduced.waitForFunction(role=>{const s=JSON.parse(document.querySelector('#stage')?.dataset.f12CandidateState??'{}');return s.role&&s.role!==role;},seenRole,{timeout:75000});
  assert.notEqual((await getState(reduced)).stationIndex,beforeRole.stationIndex);
  await screen(reduced,'F12-05-next-role.png');
  await tap(reduced,'a');await wait(reduced,'claimFrame',1);
  await tap(reduced,'c');await wait(reduced,'archiveFrame',1);
  await tap(reduced,'ArrowRight');
  await reduced.waitForFunction(()=>document.querySelector('#folio-title')?.textContent==='Closing imprint');
  assert.equal(await reduced.locator('#stage').getAttribute('data-blender-folio'),null);
  assert.equal(await reduced.locator('#stage').getAttribute('data-f12-candidate-state'),null);
  assert.equal(await reduced.locator('#stage').getAttribute('data-authored-sculptures'),'0');
  assert.equal(await reduced.locator('#folio-description').textContent(),'Your fate is in our hands.');
  await screen(reduced,'F12-04-separate-coda.png');
  await reduced.close();

  const moving=await use({reducedMotion:'no-preference'});
  // Capture actual intermediate poses even if remote Playwright polling only
  // happens after a busy software renderer has moved through the interval.
  await moving.locator('#stage').evaluate(canvas=>{
    const evidence={crease:false,press:false};
    const observer=new MutationObserver(()=>{
      const s=JSON.parse(canvas.dataset.f12CandidateState??'{}');
      if(s.archiveFrame>22&&s.archiveFrame<42&&s.creaseFixed)evidence.crease=true;
      if(s.stampPress>.65)evidence.press=true;
      if(evidence.crease&&evidence.press)observer.disconnect();
    });
    observer.observe(canvas,{attributes:true,attributeFilter:['data-f12-candidate-state']});
    window.f12MotionEvidence=evidence;
  });
  await tap(moving,'c');
  await wait(moving,'archiveFrame',67);
  assert.equal(await moving.evaluate(()=>window.f12MotionEvidence.crease),true);
  await screen(moving,'F12-03-native-crease-open.png');
  await tap(moving,'c');await wait(moving,'archiveFrame',1);
  assert.equal((await getState(moving)).study.inert,false);
  await moving.waitForFunction(()=>window.f12MotionEvidence.press===true,undefined,{timeout:65000});
  assert.ok(native.length>=2,'Vite-served F12 GLB loaded in both sessions');
  assert.deepEqual(errors,[]);
  console.log('PASS F12 native A/C, independent original B, public archive, role cycling, separate coda and reversibility');
}finally{await browser.close();}
