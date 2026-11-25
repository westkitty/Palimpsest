import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  PUBLIC_HISTORICAL_FOLIOS,
  PUBLIC_CODA_INDEX,
  NEW_PUBLIC_FOLIO_INDEX,
  ORIGINAL_SOURCE_FOLIOS,
  publicPage,
  sourceToPublicIndex,
  isPublicPageIndex,
} from '../src/vnext/publicFolioMap.ts';

test('the new fourth spread and closing imprint have distinct public identities',()=>{
  assert.equal(PUBLIC_HISTORICAL_FOLIOS,13);
  assert.equal(PUBLIC_CODA_INDEX,13);
  assert.equal(NEW_PUBLIC_FOLIO_INDEX,3);
  assert.equal(ORIGINAL_SOURCE_FOLIOS,12);
  assert.deepEqual(publicPage(3),{kind:'great-misunderstanding',publicIndex:3});
  assert.deepEqual(publicPage(13),{kind:'coda',publicIndex:13});
});

test('all original source and study indices survive public renumbering',()=>{
  const mapped=Array.from({length:ORIGINAL_SOURCE_FOLIOS},(_,sourceIndex)=>{
    const publicIndex=sourceToPublicIndex(sourceIndex);
    assert.deepEqual(publicPage(publicIndex),{kind:'existing',publicIndex,sourceIndex});
    return publicIndex;
  });
  assert.deepEqual(mapped,[0,1,2,4,5,6,7,8,9,10,11,12]);
});

test('invalid public and source indices are rejected',()=>{
  for(const value of [-1,14,1.5,NaN,Infinity]){
    assert.equal(isPublicPageIndex(value),false);
    assert.throws(()=>publicPage(value),RangeError);
  }
  assert.equal(isPublicPageIndex(13),true);
  for(const value of [-1,12,3.5,NaN,Infinity]) assert.throws(()=>sourceToPublicIndex(value),RangeError);
});

test('the production compiler rejects unpinned input before creating an edition',()=>{
  const directory=mkdtempSync(join(tmpdir(),'palimpsest-unpinned-'));
  try {
    const input=join(directory,'unreviewed.html');
    const output=join(directory,'output.html');
    writeFileSync(input,'<!doctype html><title>Unreviewed</title>');
    const compiler=fileURLToPath(new URL('../production/atmosphere/build.mjs',import.meta.url));
    const result=spawnSync('node',[compiler,output,input,'pages'],{encoding:'utf8'});
    assert.equal(result.error,undefined);
    assert.equal(result.status,1);
    assert.match(result.stderr,/exact reviewed 360-action Encore/);
    assert.equal(existsSync(output),false);
  } finally {
    rmSync(directory,{recursive:true,force:true});
  }
});
