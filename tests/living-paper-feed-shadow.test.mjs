import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {paperFeedMotion,paperFeedStep,depthShadowPosition} from '../src/vnext/paperFeedMotion.ts';

test('the paper seats before the press; the mark remains when the slide leaves',()=>{
  assert.deepEqual(paperFeedMotion(0,false),{feed:0,grip:0,press:0,eject:0,marked:false,stage:'waiting'});
  assert.ok(paperFeedMotion(.7,false).feed>0&&paperFeedMotion(.7,false).press===0);
  assert.equal(paperFeedMotion(1.08,false).press,1);
  assert.equal(paperFeedMotion(1.08,false).feed,1);
  assert.equal(paperFeedMotion(1.08,false).marked,false);
  assert.equal(paperFeedMotion(1.12,false).marked,true);
  assert.equal(paperFeedMotion(1.7,false).press,0);
  assert.ok(paperFeedMotion(1.7,false).eject>0&&paperFeedMotion(1.7,false).eject<1);
  assert.equal(paperFeedMotion(2.1,false).stage,'residue');
  assert.deepEqual(paperFeedMotion(0,true),{feed:1,grip:0,press:0,eject:0,marked:true,stage:'parked'});
});
test('a late frame cannot skip the paper contact, seal, or ejection sample',()=>{
  const press=.86+paperFeedStep(.86,.55);
  assert.equal(paperFeedMotion(press,false).press,1);
  const marked=1.05+paperFeedStep(1.05,.55);
  assert.ok(marked<1.2&&paperFeedMotion(marked,false).marked);
  const eject=1.42+paperFeedStep(1.42,.55);
  assert.ok(paperFeedMotion(eject,false).eject>.1);
});
test('the F02 occlusion crosses in world depth, not screen coordinates',()=>{
  assert.equal(depthShadowPosition(0),3.8);
  assert.ok(Math.abs(depthShadowPosition(5.5))<1e-12);
  assert.equal(depthShadowPosition(11),-3.8);
  const field=readFileSync(new URL('../src/vnext/f02DepthField.ts',import.meta.url),'utf8');
  assert.match(field,/sceneP\.x\+\.46\*sceneP\.z-\.57\*sceneP\.y/);
  assert.match(field,/p\.x\+\.46\*p\.z-\.57\*p\.y/);
  assert.match(field,/presented=root\.visible&&!reduce&&!pageHidden&&creaseCollapse\.value<\.98/);
});
