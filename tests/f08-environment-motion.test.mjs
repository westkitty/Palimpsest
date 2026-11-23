import {test} from 'node:test';
import assert from 'node:assert/strict';
import {F08_ACT_DURATION,f08CueClock,f08Cue,f08LeafTravel} from '../src/vnext/f08Motion.ts';
test('F08 leads one real shutter, reveals a dark open aperture, then collar, rim, plasma',()=>{
  const lead=f08Cue(.22,true),second=f08Cue(.55,true),dark=f08Cue(.835,true), collar=f08Cue(1.10,true),rim=f08Cue(1.35,true);
  assert.ok(lead.left>.30&&lead.right===0);assert.ok(second.right>0&&second.right<1);
  assert.deepEqual([dark.left,dark.right,dark.collar,dark.rim,dark.plasma],[1,1,0,0,0]);
  assert.equal(dark.phase,'open-dark');
  assert.ok(collar.collar>0&&collar.rim===0&&collar.plasma===0);
  assert.ok(rim.collar===1&&rim.rim>0&&rim.rim<1&&rim.plasma===0);
  assert.ok(f08Cue(1.76,true).impulse>.90);
  const steady=f08Cue(F08_ACT_DURATION,true);
  assert.equal(steady.phase,'settled');assert.equal(steady.impulse,0);assert.equal(steady.plasma,1);
});
test('F08 cuts light immediately on A off, with reversible paper and safe reactivation',()=>{
  const cut=f08Cue(F08_ACT_DURATION,false);
  assert.equal(cut.phase,'off');assert.equal(cut.plasma,0);assert.equal(cut.collar,0);assert.equal(cut.rim,0);assert.equal(cut.impulse,0);
  const re=f08CueClock(1.9,false,true,.05,false);
  assert.equal(f08Cue(re,true).phase,'open-dark');
  assert.equal(f08CueClock(0,false,true,.05,true),F08_ACT_DURATION);
  assert.equal(f08CueClock(2,true,false,.05,true),0);
});
test('F08 unfolds four exact attached hinges as one traveling release',()=>{
  assert.deepEqual(f08LeafTravel(0),[0,0,0,0]);
  const parts=f08LeafTravel(.5);
  assert.ok(parts[0]>parts[1]&&parts[1]>parts[2]&&parts[2]>parts[3]);
  assert.deepEqual(f08LeafTravel(1),[1,1,1,1]);
});
