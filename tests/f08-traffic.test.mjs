import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HOOKSHOT_PLANE,HOOKSHOT_CROSS as crossing,f08TrafficStep,f08TrafficPosition as position,
  f08TrafficPhase,restingF08Traffic as rest} from '../src/vnext/f08TrafficLogic.ts';
const step=(state,on,ready,count)=>Array.from({length:count}).reduce(s=>f08TrafficStep(s,on,ready,.05,false),state);

test('F08 travelling craft waits until permission, traverses actual Hookshot aperture and takes a far berth',()=>{
  const holding=step(rest,true,false,40);
  assert.equal(f08TrafficPhase(holding,false),'holding');
  assert.ok(holding.p<crossing&&position(holding.p)[2]>HOOKSHOT_PLANE);
  assert.deepEqual(position(crossing),[-1.66,.965,HOOKSHOT_PLANE]);
  assert.ok(position(crossing+.001)[2]<HOOKSHOT_PLANE&&position(crossing-.001)[2]>HOOKSHOT_PLANE);
  const states=[holding];
  for(let i=0;i<40;i++)states.push(step(states.at(-1),true,true,1));
  assert.ok(states.some(s=>f08TrafficPhase(s,true)==='transit'));
  assert.ok(states.some(s=>f08TrafficPhase(s,true)==='exit'));
  assert.equal(states.at(-1).crossings,1);assert.equal(states.at(-1).p,1);
  assert.deepEqual(position(1),[-3.17,.55,-1.19]);
});
test('F08 closure can only clear traffic on its current side; reduced motion uses no visible transit',()=>{
  const holding=step(rest,true,false,40);
  const pre=step(holding,true,true,2),post=step(holding,true,true,6);
  assert.ok(pre.p<crossing&&post.p>crossing);
  assert.equal(step(pre,false,false,40).p,0);assert.equal(step(post,false,false,40).p,1);
  const reopened=step(step(post,false,false,40),true,false,40);
  assert.ok(reopened.p>crossing);assert.equal(f08TrafficPhase(reopened,false),'holding');
  const returned=step(reopened,true,true,40);assert.equal(returned.crossings,2);assert.equal(returned.p,0);
  const reduced=f08TrafficStep(rest,true,true,.016,true);assert.equal(reduced.p,1);assert.equal(reduced.crossings,0);
});
