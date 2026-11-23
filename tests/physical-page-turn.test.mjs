import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { commitPageDrag, commonTurnCamera, pageDragTravel, pageSettlePosition, pageSettleSeconds,
  physicalLeafPosition, turnEase, turnTheatre } from '../src/vnext/physicalPageTurn.ts';

test('both paper faces settle precisely and reversibly without a midpoint handoff',()=>{
  for(const from of [0,.1,.4,.88,1])for(const to of [0,1]){
    const duration=pageSettleSeconds(from,to);
    for(const direction of [-1,1]){
      const samples=Array.from({length:101},(_,i)=>physicalLeafPosition(direction,pageSettlePosition(from,to,duration*i/100)));
      assert.equal(samples[0],physicalLeafPosition(direction,from));
      assert.equal(samples.at(-1),physicalLeafPosition(direction,to));
      const sign=Math.sign(direction*(to-from));
      samples.forEach((n,i)=>{if(i>0)assert.ok(sign*(n-samples[i-1])>=0);});
      assert.equal(physicalLeafPosition(direction,pageSettlePosition(from,to,duration+3)),samples.at(-1));
    }
  }
});
test('touch and mouse move the right way and release to a single endpoint',()=>{
  assert.equal(pageDragTravel(1,-180,500),1);
  assert.equal(pageDragTravel(-1,180,500),1);
  assert.equal(pageDragTravel(-1,-180,500),0);
  assert.equal(commitPageDrag(3,0),true); // deliberate corner tap
  assert.equal(commitPageDrag(31,.19),false);
  assert.equal(commitPageDrag(50,.24),true);
  assert.equal(commitPageDrag(-50,0),false); // outward drag
});
test('paper conceals the scenery handoff and the arrival unfolds during the turn',()=>{
  const frames=Array.from({length:101},(_,i)=>turnTheatre(i/100));
  assert.deepEqual(frames[0],{outgoing:1,incoming:0});
  assert.deepEqual(frames.at(-1),{outgoing:0,incoming:1});
  assert.ok(frames[46].outgoing<.02&&frames[46].incoming===0);
  assert.ok(frames[66].incoming>0&&frames[66].incoming<1);
  assert.ok(frames[80].incoming>frames[66].incoming);
  frames.forEach((f,i)=>{if(i>0){assert.ok(f.outgoing<=frames[i-1].outgoing);assert.ok(f.incoming>=frames[i-1].incoming);}});
});
test('the neutral camera is direction/folio independent, centered and portrait safe',()=>{
  const desk=commonTurnCamera(1.42),phone=commonTurnCamera(.56);
  assert.deepEqual(phone.target,desk.target);
  assert.equal(desk.position[0],0);
  assert.ok(phone.position[1]>desk.position[1]);
  assert.ok(phone.position[2]>desk.position[2]);
  assert.ok(turnEase(.01)<.001&&turnEase(.99)>.999);
  const preview=readFileSync(new URL('../src/vnext/previewV2.ts',import.meta.url),'utf8');
  assert.match(preview,/dialTurnCamera\(neutral,neutral,1\)/);
  assert.match(preview,/Land the stock first/);
  assert.match(preview,/if\(reducedMotion\)\{\s*if\(turn\.dragging\)return/);
});
