# PALIMPSEST · F10 — The Siege Wall & the Postwar Protocols
**Standalone Blender staging candidate, not a retelling, runtime deployment, or canon change.**

Twelve rigid tapered paper fins lift inward-to-upright around the unchanged dark core of the teaching diagram. A separate inhabited-horizon diorama shows one opaque pitch-black streak over anonymous cottages, without displaying a schematic grid, orbital scaffolding, stars, or any extra inhabited-sky mark. The official protocol card provides public context only.

## Source mapping
Source revision: [`41dddee6383d94e8ce0f68303a506cd9290225ee`](https://github.com/westkitty/Palimpsest/tree/41dddee6383d94e8ce0f68303a506cd9290225ee).

| Slot | Source | Blender scope |
|---|---|---|
| A · Boundary collar | [FoliosAftermath.ts, 12 fins around a dark core](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/engine/folios/FoliosAftermath.ts#L40-L73) and [runtime turns vertical scale 0.16 → 1](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/engine/folios/FoliosAftermath.ts#L175-L189) | **Animated.** Twelve tapered, creased black-cardstock leaves rotate about twelve fixed tangential axes instead of using the runtime's vertical squashing. The dark disk is fixed. Taper and minor sequencing are engineering/staging choices, not new geometry or astronomy about the Wall. |
| B · Viewpoint | [Source separate schematic and inhabited views; four cottages, exactly one unlit black streak](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/engine/folios/FoliosAftermath.ts#L74-L154) and [living stagecraft's closed-world restriction](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/vnext/livingStagecraft.ts#L229-L233) | **Static, already toggled to inhabited horizon.** No lattice, grid, sparkle, glow, or decorative extra mark appears in this sky. The black streak is one mesh, unlit by design. Arc around the core on the facing page is an explicitly labeled boundary diagram, not the optical view. |
| C · Postwar Protocols | [Exact public prohibition label](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/engine/folios/FoliosAftermath.ts#L156-L170) | **Static public context.** “POSTWAR PROTOCOLS” and “HELIOCIDE STUDY STRICTLY PROHIBITED” only; no method, hidden testimony, or narration. |
| Overall | [F10 history/interaction manifest](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/story/historyManifest.ts#L1699-L1873) | Slate, wheat-gold, azure-slate surface ink over post-All black cardstock. Dusk framing and type placements are candidate design, not parity claims. |

## Working files and limitations
- `Palimpsest_F10_Fold_Candidate.blend`: editable radial hinge empties, dark-board die cuts, and historical peripheral context. Frame 1 folded; 19 intermediate; 35 upright; 66 restored.
- `Palimpsest_F10_Hero.png`, `F10_Before_Fold.png`, `F10_Mid_Fold.png`: same camera and staging in three states.
- `Palimpsest_F10_Fold_Loop.mp4`: silent reversed mechanism rehearsal; animation is order-of-actuation proof, not story chronology.
- `build_f10.py`, `verify_f10.py`, `encode_f10.sh`: reproducible construction, independent saved-file checks and silent encoding.
- This tests the A geometry only, not source integration, full reader interactions, astronomical accuracy, or hidden content. No other source, previous folio, originals, remote repository, Drive or publication state was changed.

```sh
blender -b -t 3 -P build_f10.py
blender -b -t 3 -P build_f10.py -- --motion
blender -b -t 2 Palimpsest_F10_Fold_Candidate.blend -P verify_f10.py
bash encode_f10.sh
```
