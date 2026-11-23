# F06 · Living Book native Blender port

Asset: polished F06 master from the reviewed Q2 archive, SHA-256
`d7f3e965566c6d2097e87293ed94092b5915d9dfc86ac6658ed411339b9b3e32`.
`export_f06.py` derives the browser GLB without saving or altering the input.
The stored GLB is 1,285,660 bytes (exact source and export digest can be verified
with the exporter and `sha256sum`). Source cameras, lights and desk are not
bundled. No Archives reader or original scene class is modified.

- **A:** original chronology wheel mesh and single authored quarter-turn
  (18 fps, samples at frames 8–42), reused under a fixed four-detent collar.
  Moving A immediately updates both the era slip and the same record in C;
  the hinged ledger receives a small, physically linked paper jog.
- **B:** retains the Blender cradle and its keyed turn (frames 45–66). The
  two static proof specimens are replaced at the named seat by all seven
  original Living choices: 003, 004, 009, 032, 012, 019, 030. That teaching
  sequence does not enlarge or reduce the underlying 14-ID catalog.
- **C:** six original independent transform clips sample together
  (frames 69–111; reverse samples close). The selected era stays visible on
  the actual first leaf. The source's blank total cell and unknown-total
  labels stay intact. A changes C's heading and jog, never its open state.
- Existing keyboard and accessible controls remain. WebGL pickers use the
  actual exported wheel, stage plate, and ledger pull grip. Reduced motion
  snaps meaningfully to detents and omits the jiggle. Load failure retains
  the prior Living scene.

Checks: `npm run lint`, `npm run build`, and
`node --test tests/challenger-f06-asset.test.mjs`.
The focused WebGL smoke is `node tests/challenger-f06-browser.mjs`, with
`PALIMPSEST_PREVIEW_URL` pointing to a built local Vite preview and optional
`PALIMPSEST_CHROME_PATH`, `PALIMPSEST_PLAYWRIGHT_MODULE` and
`PALIMPSEST_PROOF_DIR`. It records arrival, an open changed-era ledger and a
hinge-motion frame when a proof directory is supplied.
