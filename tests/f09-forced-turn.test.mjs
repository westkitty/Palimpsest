import {test} from 'node:test';
import assert from 'node:assert/strict';
import {F09_INDEX,armsF09,f09ForcedBeat,F09_AUTO_TURN_SECONDS} from '../src/vnext/f09ForcedTurn.ts';
import {makeF09RuptureBed} from '../src/vnext/f09EnvironmentalTheatre.ts';
import {Group,Vector3} from 'three';

test('only the first deliberate pull on F09 arms the forced page turn',()=>{
  for(let folio=0;folio<13;folio++){
    for(const slot of ['A','B','C']){
      assert.equal(armsF09(folio,slot,false,true),folio===F09_INDEX&&slot==='A');
      assert.equal(armsF09(folio,slot,true,true),false);
      assert.equal(armsF09(folio,slot,false,false),false);
    }
  }
});
test('destruction and ruined hold precede the turn; reduced skips motion but not the hold',()=>{
  assert.equal(f09ForcedBeat(1,false),'pull');
  assert.equal(f09ForcedBeat(3,false),'rupture');
  assert.equal(f09ForcedBeat(4,false),'aftermath');
  assert.equal(f09ForcedBeat(F09_AUTO_TURN_SECONDS,false),'turn');
  assert.equal(f09ForcedBeat(0,true),'aftermath');
  assert.equal(f09ForcedBeat(1.15,true),'turn');
  const mount=new Group();
  const bed=makeF09RuptureBed(mount,new Vector3(-1.16,.5,-.37));
  assert.equal(bed.update(-1,false),0);assert.equal(mount.children[0].visible,false);
  assert.equal(bed.update(.18,false),13);
  assert.equal(bed.update(1,false),4);
  assert.equal(bed.update(.22,true),4);
});
