import assert from 'node:assert/strict';
import test from 'node:test';
import {closingBeat,closingReadingPose,WALL_ANGLE,WALL_WIDTH} from '../src/vnext/environmentClosing.ts';
test('closing wall begins readable, then rests through one restrained non-looping light rake',()=>{
 const start=closingBeat(0,false);
 assert.equal(start.stage,'resting');
 assert.ok(start.relief>.85);
 assert.ok(WALL_ANGLE-start.angle<.04);
 assert.ok(closingBeat(1.2,false).rake>closingBeat(.46,false).rake);
 const held=closingBeat(1.9,false);
 assert.deepEqual(held,{stage:'held',relief:1,angle:WALL_ANGLE,rake:1});
 assert.deepEqual(closingBeat(75,false),held);
 assert.deepEqual(closingBeat(0,true),held);
});
test('reading fit protects both ends in a narrow portrait viewport',()=>{
 for(const a of [.36,.47,.70,1.7]){
  const {distance}=closingReadingPose(a);
  assert.ok(WALL_WIDTH/(2*Math.tan(Math.PI/8)*a*distance)<.95);
 }
});
