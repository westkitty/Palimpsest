import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PUBLIC_HISTORICAL_FOLIOS,
  PUBLIC_CODA_INDEX,
  NEW_PUBLIC_FOLIO_INDEX,
  ORIGINAL_SOURCE_FOLIOS,
  publicPage,
  sourceToPublicIndex,
  isPublicPageIndex,
} from '../src/vnext/publicFolioMap.ts';

test('approved public sequence has thirteen folios and independent closing imprint', () => {
  assert.equal(PUBLIC_HISTORICAL_FOLIOS, 13);
  assert.equal(PUBLIC_CODA_INDEX, 13);
  assert.equal(NEW_PUBLIC_FOLIO_INDEX, 3);
  assert.equal(ORIGINAL_SOURCE_FOLIOS, 12);
  assert.deepEqual(publicPage(3), {kind:'great-misunderstanding',publicIndex:3});
  assert.deepEqual(publicPage(13), {kind:'coda',publicIndex:13});
});

test('all twelve original source worlds map uniquely to public pages without mutating source indices', () => {
  const mapped=[];
  for(let source=0;source<ORIGINAL_SOURCE_FOLIOS;source++){
    const index=sourceToPublicIndex(source);
    const target=publicPage(index);
    assert.deepEqual(target,{kind:'existing',publicIndex:index,sourceIndex:source});
    mapped.push(index);
  }
  assert.deepEqual(mapped,[0,1,2,4,5,6,7,8,9,10,11,12]);
});

test('invalid public or source indices are rejected at the boundary', () => {
  for(const n of [-1,14,1.5,NaN,Infinity]){
    assert.equal(isPublicPageIndex(n),false);
    assert.throws(()=>publicPage(n),RangeError);
  }
  for(const n of [-1,12,3.5,NaN,Infinity]){
    assert.throws(()=>sourceToPublicIndex(n),RangeError);
  }
  assert.equal(isPublicPageIndex(13),true);
});

test('approved public narration is locked as a separate source from the historical manuscript', async () => {
  const {readFileSync}=await import('node:fs');
  const narration=readFileSync(new URL('../production/folio_vnext/PALIMPSEST_PUBLIC_NARRATION_LOCKED.md',import.meta.url),'utf8');
  assert.equal((narration.match(/^### F\d{2} — /gm)||[]).length,13);
  assert.equal((narration.match(/\*\*ADMINISTRATION VOICE:\*\* Your fate is in our hands\./g)||[]).length,1);
  assert.match(narration,/### F04 — THE GREAT MISUNDERSTANDING[\s\S]*Now lift the little roof\./);
  assert.match(narration,/### F12 — THIRTY-ONE DAYS LATER: THE FIRST DIRT/);
  assert.match(narration,/A little living soil\. A few blades of wheat\./);
  assert.ok(!narration.includes('He murdered her.'));
  assert.ok(!narration.includes('NiAlBu still watches her die.'));
});
