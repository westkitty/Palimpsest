import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRevisionEarlyArt, REVISION_VAULT_TEMPLATES } from '../src/vnext/revisionEarlyArt.ts';
import { activateSlot, sourceInkRegistration, startFolio } from '../src/vnext/folioLogic.ts';

test('F01 uses three pierced cardstock apertures and state-linked physical tongues', () => {
  const art = createRevisionEarlyArt(0);
  const holder = art.root.children[0];
  const plate = holder.children[0];
  assert.equal(plate.geometry.parameters.shapes.holes.length, 3);
  const tongues = holder.children.filter(node => node.name.startsWith('Paired standee register tongue'));
  assert.equal(tongues.length, 3);
  const neutral = startFolio(0);
  art.update(neutral, 0, true);
  assert.ok(tongues.every(tongue => tongue.children[1].rotation.x === 0));
  art.update(activateSlot(neutral, 'A'), 0, true);
  assert.ok(tongues.every(tongue => tongue.children[1].rotation.x < -0.65));
});

test('F02 spreads locally and stages stars only on the same saturated ink sample', () => {
  const art = createRevisionEarlyArt(1);
  let state = startFolio(1);
  art.update(state, 0, false);
  assert.equal(art.root.userData.inkAdvance, 0);
  state = activateSlot(state, 'A');
  art.update(state, .06, false);
  assert.ok(art.root.userData.inkAdvance > 0 && art.root.userData.inkAdvance < .31);
  for (const [i, slot] of ['A', 'B', 'C'].entries()) {
    state = activateSlot(state, slot);
    art.update(state, 0, true);
    assert.equal(art.root.userData.inkAdvance, [.31, .66, 1][i]);
  }
  const sheets = art.root.children.filter(node => node.material?.isShaderMaterial);
  assert.equal(sheets.length, 2);
  assert.strictEqual(sheets[0].material.uniforms.advance, sheets[1].material.uniforms.advance);
  assert.match(sheets[0].material.fragmentShader, /safeInterior=smoothstep\(\.059,\.090,tide\)\*step\(\.001,advance\)/);
  assert.match(sheets[0].material.fragmentShader, /paper\+=stellar\*safeInterior/);
  const revisit = createRevisionEarlyArt(1);
  revisit.update(state, 0, false);
  assert.equal(revisit.root.userData.inkAdvance, 1);
  revisit.update(startFolio(1), 0, false);
  assert.equal(revisit.root.userData.inkAdvance, 0);
});

test('F03 switches dossier-based template body, plate and inherited outputs together', () => {
  const createElement = () => ({ getContext: () => ({
    fillRect() {}, strokeRect() {}, fillText() {},
  }) });
  globalThis.document = {createElement};
  try {
    const art = createRevisionEarlyArt(2);
    let state = startFolio(2);
    const proof = (family, generation, vaultOpen) => {
      art.update(state, 0, true);
      assert.equal(art.root.userData.template, REVISION_VAULT_TEMPLATES[family].name);
      const globe = [], registers = [];
      art.root.traverse(node => {
        if (node.userData.model) globe.push(node);
        if (node.userData.mark) registers.push(node.userData.mark);
      });
      assert.equal(globe.length, 3);
      assert.equal(globe[0].visible, vaultOpen);
      assert.deepEqual(globe.map(node => node.userData.generation), [0, generation, generation + 1]);
      assert.ok(globe.every(node => node.userData.family === family));
      assert.ok(globe.every(node => node.children.filter(child => child.name.startsWith('Scored and folded cardstock gore')).length === 8 + 2 * family));
      assert.deepEqual(registers, Array(3).fill(sourceInkRegistration(family).join('')));
    };
    proof(0, 0, false);
    state = activateSlot(state, 'A');
    proof(0, 0, true);
    state = activateSlot(state, 'B');
    proof(1, 0, true);
    state = activateSlot(state, 'C');
    proof(1, 1, true);
    state = activateSlot(state, 'B');
    proof(2, 1, true);
  } finally {
    delete globalThis.document;
  }
});
