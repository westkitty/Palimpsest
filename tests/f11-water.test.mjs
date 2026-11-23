import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {f11WickBeats,createF11WaterWick} from '../src/vnext/f11WaterWick.ts';
import {f11PaperBeats,F11_GUTTER_MARK} from '../src/vnext/f11StoryPaper.ts';

test('bead follows established gravity and first root, wicks before canopy and leaves bounded edge sag',()=>{
 assert.equal(f11WickBeats(55).bead,0);
 assert.equal(f11PaperBeats(64).gutterRoot,1);
 assert.ok(f11PaperBeats(64).redirected>.99&&f11WickBeats(64).bead>.98);
 assert.equal(f11PaperBeats(68).canopy,0);
 assert.ok(f11WickBeats(68).bead<.60&&f11WickBeats(68).wet>0);
 assert.ok(f11WickBeats(75).strain>.90);
 assert.deepEqual([f11WickBeats(108).wet,f11WickBeats(108).bead,f11WickBeats(108).strain],[1,0,.76]);
 assert.equal(f11WickBeats(175).phase,'stained');
});

test('visible stain follows actual irregular array and bonded boundaries stay put while the edge sags',()=>{
 const work=new T.Group(),water=createF11WaterWick(work,()=>0);
 const bead=work.getObjectByName('F11 distinct bead of condensation');
 const rim=work.getObjectByName('F11 irregular capillary wet edge');
 const card=work.getObjectByName('F11 scored stock physically cockles at its wet free edge');
 const attr=card.geometry.getAttribute('position'),original=attr.array.slice();
 water.update(64);assert.ok(bead.visible&&!rim.visible);
 assert.ok(bead.position.x+.12<F11_GUTTER_MARK.x);
 const done=water.update(155);
 assert.ok(!bead.visible&&rim.visible&&done.edgeSag>.020&&done.edgeSag<.040);
 assert.equal(attr.getY(0),original[1]); // scored back edge remains bonded
 assert.equal(attr.getY(5*13),original[(5*13)*3+1]); // lateral glue point
 assert.ok(attr.getY(5*13+6)<original[(5*13+6)*3+1]-.020);
 const a=rim.geometry.getAttribute('position'),radii=[];
 for(let i=1;i<a.count;i++)radii.push(Math.hypot(a.getX(i)-a.getX(0),a.getZ(i)-a.getZ(0)));
 assert.ok(Math.max(...radii)-Math.min(...radii)>.18);
 water.dispose();assert.equal(work.children.length,0);
});
