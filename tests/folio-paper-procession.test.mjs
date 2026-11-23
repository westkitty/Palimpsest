import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clearanceCrewClock,clearanceCrewPose,F08_CREW_CLEAR} from '../src/vnext/f08ClearanceCue.ts';
import {F12_PORTRAIT_DWELL,F12_FEED_START,f12PortraitPose,f12FeedTime,paperFoot} from '../src/vnext/folioPaperProcession.ts';
import {paperFeedMotion} from '../src/vnext/paperFeedMotion.ts';

test('F08 clearance crew crosses the real lane, makes contact, and clears it before release',()=>{
  const home=clearanceCrewPose(0);
  const crossing=clearanceCrewPose(1.22);
  const pulling=clearanceCrewPose(1.75);
  const clear=clearanceCrewPose(F08_CREW_CLEAR);
  assert.ok(home.positions.every(p=>p[0]<-1.8)&&!home.clear);
  assert.ok(crossing.positions[0][0]>-1.66&&crossing.positions[1][0]<-1.66&&!crossing.clear);
  assert.ok(pulling.grip>.9&&!pulling.clear);
  assert.ok(clear.positions.every(p=>p[0]>-1.24)&&clear.clear&&!clear.grip);
  assert.equal(clearanceCrewClock(0,true,1,true),F08_CREW_CLEAR);
  assert.equal(clearanceCrewClock(1.5,false,1,true),0);
  assert.equal(clearanceCrewClock(F08_CREW_CLEAR,false,1,false),F08_CREW_CLEAR);
  assert.ok(clearanceCrewClock(1.35,true,1,false)<F08_CREW_CLEAR);
});

test('each stock shoe stays fixed in support then sets down before its next stride',()=>{
  assert.deepEqual(paperFoot(.08,4,0),[0,0]); // starting support
  const toe=paperFoot(.14,4,0);
  assert.ok(toe[0]>0&&toe[1]>0);
  assert.deepEqual(paperFoot(.25,4,0),[.25,0]);
  assert.deepEqual(paperFoot(.25,4,1),[.25,0]);
  assert.deepEqual(paperFoot(1,4,1),[1,0]);
});

test('F12 staff make room for the late worker before grouping, ink, and reset',()=>{
  assert.deepEqual(f12PortraitPose(0,false).actors.map(x=>x.move),[0,0,0,0]);
  const early=f12PortraitPose(.9,false);
  assert.ok(early.actors[0].move>early.actors[3].move);
  const unset=f12PortraitPose(1.52,false);
  assert.ok(unset.actors[3].miss>.85&&unset.actors[2].give===0);
  const adjust=f12PortraitPose(2.24,false);
  assert.ok(adjust.actors[2].give>0&&adjust.actors[3].miss>0&&adjust.actors[3].miss<1);
  const atPress=F12_FEED_START+1.02;
  const portrait=f12PortraitPose(atPress,false);
  assert.ok(portrait.grouped&&portrait.actors.every(x=>x.move===1&&x.give===0&&x.miss===0));
  assert.equal(paperFeedMotion(f12FeedTime(atPress),false).press,1);
  const home=f12PortraitPose(F12_PORTRAIT_DWELL,false);
  assert.ok(home.actors.every(x=>x.move===0));
  assert.ok(f12PortraitPose(0,true).grouped);
  assert.ok(!paperFeedMotion(f12FeedTime(1.4),false).marked);
});

test('F08 actual Three carrier waits for figures after native portal opening and does not rerun release on reopen',async()=>{
  const {createF08HookshotTraffic}=await import('../src/vnext/f08HookshotTraffic.ts');
  const traffic=createF08HookshotTraffic(()=>0);
  const reset=traffic.update(true,false,0,0,false);
  assert.equal(reset.phase,'front-berth');
  let previous, holds=0, contact=0;
  for(let n=0;n<105;n++){
    const view=traffic.update(true,true,n*.05>1.8?1:0,.05,false);
    if(view.nativeShuttersReady&&!view.crew.clear){
      holds+=1;
      assert.equal(view.phase,'holding');
      assert.equal(view.permitted,false);
      assert.equal(view.crossings,0);
    }
    if(view.crew.grip>=.999){
      contact+=1;
      assert.ok(view.crew.gripGap<.001);
    }
    previous=view;
  }
  assert.ok(holds>=8&&contact>=5);
  assert.equal(previous.phase,'docked-far');assert.equal(previous.crossings,1);
  const off=traffic.update(true,false,0,.05,false);
  assert.equal(off.crew.clear,true);assert.equal(off.phase,'docked-far');
  const held=traffic.update(true,true,0,.05,false);
  assert.equal(held.crew.phase,'lane-clear');
  assert.equal(held.permitted,false);
  for(let n=0;n<60;n++)previous=traffic.update(true,true,1,.05,false);
  assert.equal(previous.phase,'docked-front');assert.equal(previous.crossings,2);
  const snap=createF08HookshotTraffic(()=>0).update(true,true,1,.05,true);
  assert.equal(snap.phase,'docked-far');assert.equal(snap.crossings,0);
  assert.equal(snap.crew.phase,'lane-clear');assert.equal(snap.crew.grip,0);
});
