import assert from 'node:assert/strict';
import test from 'node:test';
import { LIVING_THEATRE_PROFILES, LivingStagecraft } from '../src/vnext/livingStagecraft.ts';
import { newLaterState, operateLater } from '../src/vnext/laterFolioState.ts';

test('every later folio has its own source-bounded manufactured-paper signature',()=>{
  assert.equal(Object.keys(LIVING_THEATRE_PROFILES).length,9);
  assert.equal(new Set(Object.values(LIVING_THEATRE_PROFILES).map(p=>p.name)).size,9);
  for(let index=3;index<12;index++){
    const theatre=new LivingStagecraft(index);
    assert.equal(theatre.root.userData.editorialOnly,true);
    assert.equal(theatre.root.userData.sourceFolio,'F'+String(index+1).padStart(2,'0'));
    assert.equal(theatre.root.children.length,3);
    let silhouetteCount=0;
    theatre.root.traverse(obj=>{
      if(obj.name.startsWith('distinct folio paper silhouette'))silhouetteCount++;
      assert.ok(!/new strain|new world|canonical character/i.test(obj.name));
    });
    assert.equal(silhouetteCount,3);
    let state=newLaterState(index);
    theatre.sync(state);
    theatre.update(0.016,true);
    const initial=theatre.root.children.map(g=>g.rotation.x);
    state=operateLater(state,'B');
    theatre.sync(state);
    theatre.update(0.016,true);
    assert.ok(theatre.root.children[1].rotation.x>initial[1]);
    theatre.dispose();
    assert.equal(theatre.root.children.length,0);
  }
});
test('F05 shows only four documented manufacturing stages',()=>{
  const theatre=new LivingStagecraft(4);
  let state=newLaterState(4);
  const markers=[];
  theatre.root.traverse(o=>{if(o.name.startsWith('F05 documented manufacturing stage'))markers.push(o);});
  assert.equal(markers.length,4);
  for(let stage=0;stage<=4;stage++){
    theatre.sync(state);
    assert.equal(markers.filter(m=>m.visible).length,stage);
    if(stage<4)state=operateLater(state,'B');
  }
  theatre.dispose();
});
test('F09 model-star heliocide becomes black absence and never restores within a session',()=>{
  const theatre=new LivingStagecraft(8);
  const objects=[];
  theatre.root.traverse(o=>{if(o.name.startsWith('F09'))objects.push(o);});
  assert.equal(objects.length,2);
  let state=newLaterState(8);
  theatre.sync(state);
  assert.equal(objects[0].visible,true);
  assert.equal(objects[1].visible,false);
  state=operateLater(state,'A');
  theatre.sync(state);
  assert.equal(objects[0].visible,false);
  assert.equal(objects[1].visible,true);
  state=operateLater(state,'A');
  theatre.sync(state);
  assert.equal(objects[1].visible,true);
  theatre.dispose();
});
test('F10 inhabitable sky has only pitch black streak, no bright orbital grid; F11 adds no plants',()=>{
  const wall=new LivingStagecraft(9);
  const objects=[];
  wall.root.traverse(o=>{if(o.name.startsWith('F10'))objects.push(o);});
  assert.equal(objects.length,1);
  assert.equal(objects[0].material.color.getHex(),0x101622);
  wall.sync(newLaterState(9));
  assert.equal(objects[0].visible,false);
  wall.sync(operateLater(newLaterState(9),'B'));
  assert.equal(objects[0].visible,true);
  wall.dispose();
  const nacreous=new LivingStagecraft(10);
  const names=[];
  nacreous.root.traverse(o=>names.push(o.name));
  assert.equal(names.some(x=>/plant|grass|new life|wheat/i.test(x)),false);
  nacreous.dispose();
});
