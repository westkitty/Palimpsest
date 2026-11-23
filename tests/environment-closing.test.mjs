import assert from 'node:assert/strict';
import test from 'node:test';
import {closingBeat,closingReadingPose,WALL_ANGLE,WALL_WIDTH} from '../src/vnext/environmentClosing.ts';
test('closing wall pulls upright, reveals blind impression and stops without a loop',()=>{
 assert.equal(closingBeat(0,false).stage,'rising');
 assert.equal(closingBeat(0,false).relief,0);
 assert.ok(closingBeat(1,false).angle>closingBeat(.3,false).angle);
 assert.equal(closingBeat(1.8,false).stage,'emboss');
 const held=closingBeat(2.35,false);
 assert.deepEqual(held,{stage:'held',relief:1,angle:WALL_ANGLE});
 assert.deepEqual(closingBeat(75,false),held);
 assert.deepEqual(closingBeat(0,true),held);
});
test('reading fit protects both ends in a narrow portrait viewport',()=>{
 for(const a of [.36,.47,.70,1.7]){
  const {distance}=closingReadingPose(a);
  assert.ok(WALL_WIDTH/(2*Math.tan(Math.PI/8)*a*distance)<.95);
 }
});
