import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const {chromium,devices}=await import(process.env.PALIMPSEST_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4640';
const proof=process.env.PALIMPSEST_PROOF_DIR;
const errors=[];
async function open(f,options={}){
  const p=await browser.newPage({ viewport:{width:1100,height:735}, ...options });
  p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(origin+'/folio-vnext.html?folio='+f);
  await p.waitForFunction(f=>{
    const el=document.querySelector('#stage');
    return !el.hidden&&el.dataset.blenderFolio==='0'+f;
  },f,{timeout:45000});
  return p;
}
const key=(p,k)=>p.locator('#stage').focus().then(()=>p.keyboard.press(k));
const wait=(p,expression,name)=>{
  const code=`(() => {
    const s=JSON.parse(document.querySelector('#stage').dataset.${name}||'{}');
    return ${expression} ? s : null;
  })()`;
  return p.waitForFunction(code,null,{timeout:45000}).then(v=>v.jsonValue());
};
async function screen(p,f){
  if(!proof)return;
  await mkdir(proof,{recursive:true});
  await p.screenshot({path:join(proof,f),timeout:45000});
}
try{
  const f04=await open(4);
  await wait(f04,'s.endpointRoutine && !s.endpointRoutine.active','f04CandidateState');
  await key(f04,'b');
  await wait(f04,'s.expansionFrame>5 && !s.endpointRoutine.active && s.unfinishedLaneDark','f04CandidateState');
  const end=await wait(f04,'s.expansion==="complete" && s.endpointRoutine.active && s.endpointRoutine.cover>.94 && s.endpointRoutine.receipt>.7','f04CandidateState');
  assert.deepEqual([end.litPlanets,end.litEchoes,end.relaysUnfolded,end.pulseSegment,end.unfinishedLaneDark],[5,5,5,-1,true]);
  await screen(f04,'F04-final-dock-and-unlit-next-lane.png');
  await key(f04,'b'); // motion at the end is life in the dock, not a new route
  await wait(f04,'s.expansion==="complete" && s.endpointRoutine.active && s.endpointRoutine.cover<.12 && s.expansionFrame===38','f04CandidateState');
  await f04.close();

  const f05=await open(5);
  await wait(f05,'s.factory?.bay===0&&!s.ring&&!s.record','f05CandidateState');
  await key(f05,'a');
  await key(f05,'c');
  await wait(f05,'s.ring && s.record && s.factory?.bay===0','f05CandidateState');
  await key(f05,'b');
  await wait(f05,'s.factory?.bay===1&&s.factory.rhythm.phase>.12&&s.step===1','f05CandidateState');
  await key(f05,'b');
  const held=await wait(f05,'s.factory?.bay===2&&s.factory.rhythm.arrested','f05CandidateState');
  assert.equal(held.ring,true);
  assert.equal(held.record,true);
  const later=await wait(f05,`s.factory?.rhythm.arrested && s.orbitalPhase>${held.orbitalPhase+.061}`,'f05CandidateState');
  assert.ok(Math.abs(later.factory.rhythm.phase-held.factory.rhythm.phase)<1e-10);
  assert.equal(later.nativeLineFrame,held.nativeLineFrame);
  assert.ok(later.planetPhase>held.planetPhase&&later.orbitalPhase>held.orbitalPhase);
  assert.notEqual(later.orbitalPhase-held.orbitalPhase,later.planetPhase-held.planetPhase);
  const released=await wait(f05,`s.factory?.bay===2&&!s.factory.rhythm.arrested&&s.nativeLineFrame>${later.nativeLineFrame}`,'f05CandidateState');
  assert.ok(released.ring&&released.record);
  await key(f05,'b');
  await wait(f05,'s.factory?.bay===3&&s.step===3&&!s.factory.moving&&!s.factory.rhythm.arrested','f05CandidateState');
  await key(f05,'b');
  await wait(f05,'s.factory?.bay===4&&s.step===4&&!s.factory.moving&&!s.factory.rhythm.arrested','f05CandidateState');
  await screen(f05,'F05-native-fourth-bay-ring-and-record.png');
  await f05.close();

  const phone=await open(5,{ ...devices['Pixel 7'], reducedMotion:'reduce' });
  await phone.locator('#toggle-panels').tap();
  await phone.locator('[data-mechanism="a" i]').tap();
  await phone.locator('[data-mechanism="b" i]').tap();
  await phone.locator('[data-mechanism="b" i]').tap();
  const reduced=await wait(phone,'s.ring&&s.factory?.bay===2&&s.step===2','f05CandidateState');
  assert.equal(reduced.factory.moving,false);
  assert.equal(reduced.factory.rhythm.arrested,false);
  assert.equal(reduced.factory.rhythm.phase,0);
  await phone.locator('#toggle-panels').tap();
  await screen(phone,'F05-phone-second-bay-reduced.png');
  assert.deepEqual(errors,[]);
  console.log('PASS native F04 dock works only at fifth lit relay; unfinished lane dark. F05 one native+paper rhythm arrests/resumes independently of planet/orbit and C; mobile reduced pose works.');
}finally{await browser.close();}
