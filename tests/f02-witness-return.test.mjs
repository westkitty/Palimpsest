import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import { F02_RETURN_CREASE,F02_RETURN_SECONDS,f02WitnessReturn } from '../src/vnext/f02WitnessReturn.ts';

test('F02 gathers its existing world field into the ink crossing, holds, then returns',()=>{
  assert.deepEqual(F02_RETURN_CREASE,[-.09,.224,.27]);
  assert.deepEqual(f02WitnessReturn(0),{stage:'gathering',collapse:0,glint:0,approach:0,recede:0});
  assert.ok(f02WitnessReturn(.55).collapse>0&&f02WitnessReturn(.55).collapse<1);
  for(const t of [.97,1.15,1.32]){
    const s=f02WitnessReturn(t);
    assert.equal(s.stage,'crease-hold');
    assert.equal(s.approach,1);
    assert.equal(s.recede,0);
    assert.equal(s.collapse,1);
    assert.ok(s.glint>0&&s.glint<.6);
  }
  assert.equal(f02WitnessReturn(1.8).stage,'receding');
  const complete={stage:'page',collapse:1,glint:0,approach:1,recede:1};
  assert.deepEqual(f02WitnessReturn(F02_RETURN_SECONDS),complete);
  assert.deepEqual(f02WitnessReturn(0,true),complete);
});

test('The exact pre-existing vellum crossing now also anchors the world geometry and gaze',()=>{
  const read=(name)=>readFileSync(new URL('../src/vnext/'+name,import.meta.url),'utf8');
  assert.match(read('revisionEarlyArt.ts'),/gutter=returnCrease/);
  assert.match(read('revisionEarlyArt.ts'),/creaseGlint\*scoreGlint\*safeInterior/);
  assert.match(read('f02DepthField.ts'),/v=creasePoint\+loose\*mix/);
  assert.match(read('f02DepthField.ts'),/p=creasePoint\+\(p-creasePoint\)\*mix/);
  assert.match(read('previewV2.ts'),/controls\.target\.copy\(crease\)\.lerp\(f\.lookTo,cue\.recede\)/);
});
