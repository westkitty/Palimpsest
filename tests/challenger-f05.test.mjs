import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const raw=readFileSync('src/vnext/proof/assets/palimpsest-f05.glb');
const doc=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)));
test('F05 contains real node curves, a physical ring, and no studio baggage',()=>{
  assert.equal(raw.subarray(0,4).toString(),'glTF');
  const clip=(n)=>doc.animations.filter(a=>a.name.startsWith(n+'__'));
  assert.deepEqual([clip('A').length,clip('B').length,clip('C').length],[2,17,2]);
  assert.equal(clip('B').filter(a=>a.name.includes('rotating punched board')).length,4);
  const node=doc.nodes.find(n=>n.name.includes('PHYSICAL opaque crimson'));
  assert.ok(node&&doc.meshes[node.mesh].primitives.length===3);
  for(const {material} of doc.meshes[node.mesh].primitives){
    assert.equal(doc.materials[material].alphaMode??'OPAQUE','OPAQUE');
    assert.ok(!(doc.materials[material].emissiveFactor??[]).some(Boolean));
  }
  assert.ok(!doc.cameras&&!doc.extensions?.KHR_lights_punctual);
});
