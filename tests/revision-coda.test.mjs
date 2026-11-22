import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMINISTRATION_SLOGAN, CODA_INDEX, playableIndex } from '../src/vnext/revisionCodaLogic.ts';
import { isLivingIndex } from '../src/vnext/laterFolioState.ts';

test('append a closing leaf without adding a thirteenth historical world',()=>{
  assert.equal(CODA_INDEX,12);
  assert.equal(ADMINISTRATION_SLOGAN,'Your fate is in our hands.');
  for(let index=0;index<=CODA_INDEX;index++)assert.ok(playableIndex(index));
  assert.equal(isLivingIndex(CODA_INDEX),false);
  assert.equal(playableIndex(-1),false);
  assert.equal(playableIndex(13),false);
  assert.equal(playableIndex(12.5),false);
});
