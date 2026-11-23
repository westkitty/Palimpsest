import test from 'node:test';
import assert from 'node:assert/strict';
import {factoryRead} from '../src/vnext/proof/f05FactoryFloor.ts';
test('one piece travels between four physically separate steps, then settles',()=>{
 assert.equal(factoryRead(1,3,false).operation,'settle');
 assert.equal(factoryRead(2,0,false).x,factoryRead(1,3,false).x);
 assert.equal(factoryRead(2,.2,false).moving,true);
 assert.equal(factoryRead(2,2,false).operation,'compress');
 assert.equal(factoryRead(3,.9,false).operation,'extrude');
 assert.equal(factoryRead(4,0,true).operation,'close');
 assert.equal(factoryRead(4,0,true).x,3.53);
});
