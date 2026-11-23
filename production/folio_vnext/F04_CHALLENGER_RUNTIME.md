# F04 Living Book challenger: Year 0, First Contact

Public runtime GLB: `src/vnext/proof/assets/palimpsest-f04.glb` (915,036 bytes, SHA-256 `5c6dca22e6230bec041ff91e64ad406e4378a3556edba3708a0a427028263c5f`). It is a Blender 4.3.2 export of a new editable challenger copy based on the reviewed `Palimpsest_F04_Fold_Candidate.blend`: black book, type, three cleated skyline layers, the colony plate and six genuinely linked logistics folds. The later revision brief governs this Living Book view: no Codec. Separately compiled Archive, evidence, manuscript, lore and chronology stay unchanged.

| Slot | Actual authored action used by browser | Behavior |
| --- | --- | --- |
| A | `A__ColonyCardAndLift` | The candidate plate rises in two pairs of guides before turning to the scarred underside; reverse lowers it into the same mounts. |
| B | Three `B__RouteSlider*` tracks; five `B__Lamp*` and five paired `B__Echo*` tracks | Five anonymous teaching positions brighten in order, with the same progression in the die-cut apertures. B stops the exact animation sample, or allows it to resume, and the complete pattern holds. These are not an asserted world count, destination names or locations. |
| C | Six `C__Leaf*` candidate original tracks | Open and close the four source terms on the connected panel strip, independently of A and B. |

Press the visible 3D tabs on the candidate or use the same keyboard/panel controls. Reduced motion sets A/C to authored end detents and, on activating B, advances immediately to the stable final B sample. B’s partial stopped position survives turning away and back during this page session; an actual browser reload restores the existing logical B preference, not a new stored progress field. Explicit Study Reset clears both. The hashed GLB loads only for F04 visits, and the prior F04 paper stage remains if the asset fails validation or load.

## Reproduce

Using an authorized copy of the original source file:
```sh
blender -b -t 2 Palimpsest_F04_Fold_Candidate.blend -P production/folio_vnext/sources/export_f04_challenger.py -- /tmp/palimpsest-f04-export
node --import tsx --test tests/challenger-f04.test.mjs
npm run lint
npm run build
```

The exporter saves a separate editable Blender challenger and a standalone runtime GLB. It does not overwrite the reviewed candidate. The local runtime browser proof is ANGLE/SwiftShader WebGL, not a physical GPU FPS claim or art acceptance sign-off.
