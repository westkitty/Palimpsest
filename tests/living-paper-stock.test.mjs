import test from 'node:test';
import assert from 'node:assert/strict';
import { folioStock, isDarkStock, cssStock } from '../src/vnext/livingPaperStock.ts';

test('original ivory opening and white vellum precede the dyed-through stock', () => {
  assert.equal(folioStock(0).face, 0xf0e6d2);
  assert.equal(folioStock(1).face, 0xf6f3ea);
  assert.equal(folioStock(1, true).face, 0x181c22);
  for (let i = 2; i <= 12; i++) {
    assert.ok(isDarkStock(folioStock(i)));
    assert.notEqual(folioStock(i).edge, folioStock(i).face);
  }
});
test('stock is chapter-specific, and the turn/fallback can render it as sRGB', () => {
  assert.equal(cssStock(folioStock(2).face), '#1f2430');
  assert.equal(cssStock(folioStock(10).face), '#1d1d1e');
  assert.notEqual(folioStock(4).face, folioStock(7).face);
  assert.equal(cssStock(0x00000a), '#00000a');
});
