import test from 'node:test';
import assert from 'node:assert/strict';
import {factoryRead,factoryRhythm,factoryStroke} from '../src/vnext/proof/f05FactoryFloor.ts';
test('one piece travels between four physically separate steps, then settles',()=>{
 assert.equal(factoryRead(1,3,false).operation,'settle');
 assert.equal(factoryRead(2,0,false).x,factoryRead(1,3,false).x);
 assert.equal(factoryRead(2,.2,false).moving,true);
 assert.equal(factoryRead(2,2,false).operation,'compress');
 assert.equal(factoryRead(3,.9,false).operation,'extrude');
 assert.equal(factoryRead(4,0,true).operation,'close');
 assert.equal(factoryRead(4,0,true).x,3.53);
});

test('one phase crosses the bays, mechanically arrests, and resumes without catching up',()=>{
 const at=factoryRhythm(.80,.80,false,true);
 const still=factoryRhythm(1,1,false,true);
 assert.equal(at.arrested,true);assert.equal(still.arrested,true);
 assert.equal(at.phase,still.phase);
 const resume=factoryRhythm(1.20,1.20,false,true);
 assert.equal(resume.arrested,false);assert.ok(resume.phase>still.phase);
 assert.equal(factoryRhythm(.9,.9,false,false).arrested,false);
 assert.equal(factoryRhythm(.9,.9,true,true).arrested,false);
 assert.ok(factoryStroke(.19,0)>factoryStroke(.19,2));
 assert.ok(factoryStroke(.44,2)>factoryStroke(.44,0));
});
