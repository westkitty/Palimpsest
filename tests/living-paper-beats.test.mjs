import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reliefFoldCue,pressPaperFlex,historicalMachineBeat} from '../src/vnext/livingPaperBeats.ts';
test('the recipient actually folds before their support catches and both recover',()=>{
  assert.equal(reliefFoldCue(1,false).receive,0);
  assert.ok(reliefFoldCue(3.2,false).receive>reliefFoldCue(3.2,false).brace);
  assert.ok(reliefFoldCue(3.72,false).brace>.9);
  assert.equal(reliefFoldCue(4.8,false).receive,0);
  assert.ok(reliefFoldCue(5.4,false).load>.9);
  assert.equal(reliefFoldCue(3.72,true).receive,0);
});
test('press makes stock bow and returns it to original datum',()=>{
  assert.ok(pressPaperFlex(.28,1)>.045);
  assert.ok(pressPaperFlex(0,1)<0);
  assert.equal(pressPaperFlex(.28,0),0);
});
test('historical mechanism cuts dead at final star and remains quiet on restore',()=>{
  assert.ok(historicalMachineBeat(1.1,2.4,true,false).beat>0);
  for(const time of [-1,2.72,3.55])assert.deepEqual(historicalMachineBeat(1.1,time,true,false),{beat:0,moving:false});
});
