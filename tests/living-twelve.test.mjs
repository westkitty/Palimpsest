import assert from 'node:assert/strict';
import test from 'node:test';
import { FOLIO_BY_WORLD } from '../src/story/historyManifest.ts';
import { FIRST_LATER_FOLIO, LATER_STUDY_STORAGE_KEY, newLaterState, operateLater, restoreLaterStudy, serializeLaterStudy } from '../src/vnext/laterFolioState.ts';

test('all nine later folios have individual source-authored A/B/C contracts', () => {
  for(let index=3;index<12;index++){
    const base=newLaterState(index);
    assert.equal(base.id,index);
    assert.equal(base.folioId,FOLIO_BY_WORLD[index].id);
    assert.equal(FOLIO_BY_WORLD[index].interactions.length,3);
    for(const slot of ['A','B','C']){
      const change=operateLater(base,slot);
      assert.equal(change.id,index);
      assert.notDeepEqual(change.interactions[slot],base.interactions[slot],`F${index+1} slot ${slot} must work`);
      assert.deepEqual(base.discoveredSecrets,[]);
      assert.deepEqual(change.discoveredSecrets,[]);
    }
  }
  assert.equal(FIRST_LATER_FOLIO,3);
  assert.match(LATER_STUDY_STORAGE_KEY,/living/);
});
test('F09 silk filament remains irreversible even across study restoration',()=>{
  let state=newLaterState(8);
  state=operateLater(state,'A');
  assert.equal(state.interactions.A.locked,true);
  state=operateLater(state,'A');
  assert.equal(state.interactions.A.active,true);
  let states=Array.from({length:9},(_,i)=>newLaterState(i+3));
  states[5]=state;
  const recovered=restoreLaterStudy(serializeLaterStudy(states));
  assert.equal(recovered[5].interactions.A.locked,true);
  assert.equal(recovered[5].interactions.A.step,1);
  let wave=recovered[5];
  for(let i=0;i<5;i++) wave=operateLater(wave,'B');
  assert.equal(wave.interactions.B.locked,true);
});
test('study stores no secrets, voice state, narration or archival progress',()=>{
  const states=Array.from({length:9},(_,i)=>operateLater(newLaterState(i+3),'A'));
  const serialized=JSON.stringify(serializeLaterStudy(states));
  for(const forbidden of ['discoveredSecrets','activeWorld','narration','history','camera','activeSecret','wearLevel']){
    assert.equal(serialized.includes(forbidden),false,forbidden);
  }
  assert.deepEqual(restoreLaterStudy(JSON.parse(serialized)).map(s=>s.interactions.A.active),Array(9).fill(true));
});
test('malformed study-state cannot inject hidden content or invalid steps',()=>{
  const data={version:1,folios:Array.from({length:9},(_,i)=>({
    id:i+3,discoveredSecrets:['forged'],interactions:{
      A:{active:true,step:9999,locked:true},B:{active:'true',step:-10},C:{active:true,step:1},
    }
  }))};
  const recovered=restoreLaterStudy(data);
  assert.equal(recovered.length,9);
  assert.ok(recovered.every(s=>s.discoveredSecrets.length===0));
  assert.ok(recovered.every(s=>s.interactions.A.step===0));
  assert.ok(recovered.every(s=>!s.interactions.A.locked));
  assert.ok(recovered.every(s=>s.interactions.C.active));
  assert.deepEqual(restoreLaterStudy(null),restoreLaterStudy({version:2,folios:data.folios}));
});
test('F06 specimen selection stays within seven source candidates',()=>{
  let f=newLaterState(5);
  const seen=new Set();
  for(let i=0;i<9;i++){
    f=operateLater(f,'B');
    seen.add(f.selectedCampaignIndex);
    assert.ok(f.selectedCampaignIndex>=0&&f.selectedCampaignIndex<7);
  }
  assert.ok(seen.size>=7);
});
