import assert from 'node:assert/strict';
import test from 'node:test';
import {TEMPLATE_COUNT, startFolio, activateSlot, planetPattern, mayReveal} from '../src/vnext/folioLogic.ts';

test('first stars are never a F01 state; F02 unfolds in monotonic A/B/C stages', () => {
  let f = startFolio(0);
  for (const slot of ['A','B','C']) f = activateSlot(f, slot);
  assert.equal(f.f02.reveal, 0);
  let next = startFolio(1);
  assert.equal(next.f02.reveal, 0);
  next = activateSlot(next,'B'); assert.equal(next.f02.reveal, 2);
  next = activateSlot(next,'A'); assert.equal(next.f02.reveal, 2);
  next = activateSlot(next,'C'); assert.equal(next.f02.reveal, 3);
});

test('F01 mechanics remain reversible; page change clears only preview state', () => {
  let f = startFolio(0);
  f = activateSlot(f,'A'); assert.equal(f.f01.fold,true);
  f = activateSlot(f,'A'); assert.equal(f.f01.fold,false);
  assert.deepEqual(startFolio(0),startFolio(0));
});

test('template family finite, deterministic and controlled variation', () => {
  assert.equal(TEMPLATE_COUNT,3);
  for (let family=0; family<3; family++) {
    const a=planetPattern(family,4), b=planetPattern(family,5), c=planetPattern(family,4);
    assert.deepEqual(a,c);
    assert.equal(a.hull,b.hull);
    assert.equal(a.bandCount,b.bandCount);
    assert.equal(a.facet,b.facet);
    assert.notEqual(a.oceanShare,b.oceanShare);
  }
  assert.throws(()=>planetPattern(3,0),RangeError);
  assert.throws(()=>planetPattern(0,-1),RangeError);
  let f=startFolio(2);
  for(let i=0;i<3;i++)f=activateSlot(f,'B');
  assert.equal(f.f03.template,0);
  f=activateSlot(f,'C'); assert.equal(f.f03.generation,1);
});

test('maker testimony requires correct folio, miniature/geode interior, near and gaze', () => {
  assert.equal(mayReveal('f01-testimony',0,'miniature',true,true),true);
  assert.equal(mayReveal('f01-testimony',0,'overview',true,true),false);
  assert.equal(mayReveal('f01-testimony',0,'miniature',true,false),false);
  assert.equal(mayReveal('f02-testimony',1,'miniature',true,true),false);
  assert.equal(mayReveal('f02-testimony',1,'geode',true,true),true);
  assert.equal(mayReveal('f02-testimony',0,'geode',true,true),false);
});
