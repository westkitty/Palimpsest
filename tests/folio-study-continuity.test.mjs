import assert from 'node:assert/strict';
import test from 'node:test';
import {startFolio,activateSlot,restoreFolioStudy,sourceInkRegistration,planetPattern} from '../src/vnext/folioLogic.ts';

test('all three sculptural pages recover only finite nonsecret teaching state',()=>{
  let a=activateSlot(startFolio(0),'A');
  let b=activateSlot(activateSlot(startFolio(1),'B'),'C');
  let c=activateSlot(activateSlot(startFolio(2),'B'),'C');
  const serialized=JSON.parse(JSON.stringify({version:1,folios:[a,b,c],discoveredSecrets:['He murdered her.'],narrationEnabled:false,activeWorld:11}));
  const recovered=restoreFolioStudy(serialized);
  assert.deepEqual(recovered,[a,b,c]);
  assert.equal(recovered[0].f01.fold,true);
  assert.equal(recovered[1].f02.reveal,3);
  assert.equal(recovered[2].f03.template,1);
  assert.equal(recovered[2].f03.generation,1);
  assert.equal('discoveredSecrets' in recovered[0],false);
  assert.equal('narrationEnabled' in recovered[0],false);
  assert.equal('activeWorld' in recovered[0],false);
});

test('malicious or corrupt session state cannot inject or expand folio values',()=>{
  const defaults=[startFolio(0),startFolio(1),startFolio(2)];
  for(const input of [null,[],{},'',{version:0,folios:defaults},{version:1,folios:'bad'},{version:1,folios:[{folio:99}]}]){
    assert.deepEqual(restoreFolioStudy(input),defaults);
  }
  const injection=restoreFolioStudy({version:1,folios:[
    {folio:0,f01:{fold:'true',detail:1,compare:false}},
    {folio:1,f02:{reveal:999}},
    {folio:2,f03:{vaultOpen:true,template:3,generation:Infinity}},
  ]});
  assert.deepEqual(injection[0].f01,{fold:false,detail:false,compare:false});
  assert.equal(injection[1].f02.reveal,0);
  assert.deepEqual(injection[2].f03,{vaultOpen:true,template:0,generation:0});
  for (const f of injection) assert.equal(Object.keys(f).sort().join(','),'f01,f02,f03,folio');
});

test('an ink-register identity is inherited by variations but differs between families',()=>{
  const signatures = [0,1,2].map(family=>sourceInkRegistration(family).join(''));
  assert.deepEqual(signatures,['1001','0110','1100']);
  assert.equal(new Set(signatures).size,3);
  for(let family=0;family<3;family++){
    const root=planetPattern(family,0);
    const children=[1,2,99].map(g=>planetPattern(family,g));
    assert.ok(children.every(child=>child.hull===root.hull && child.facet===root.facet));
    assert.ok(children.some(child=>child.oceanShare!==root.oceanShare));
    assert.equal(sourceInkRegistration(family).join(''),signatures[family]);
  }
  assert.throws(()=>sourceInkRegistration(-1),RangeError);
  assert.throws(()=>sourceInkRegistration(3),RangeError);
});
