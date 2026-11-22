# PALIMPSEST · F04 — Year 0: First Contact
**Separate Blender candidate · C-only folding proof, not a runtime replacement or historical reconstruction**

A six-panel verification strip genuinely opens as a connected Z-fold. Four inner panels print the documented teaching sequence: **OBSERVE → VERIFY → ACT → RECORD**. The outside panels are the bound origin and pull end. The intact colony plate and the existing Codec/rail tableau are source-grounded, static context in this proof.

## Pinned sources
All versioned source below refers to [`westkitty/Palimpsest` at `41dddee6383d94e8ce0f68303a506cd9290225ee`](https://github.com/westkitty/Palimpsest/tree/41dddee6383d94e8ce0f68303a506cd9290225ee).
- [F04 world's A, B, C and state targets](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/engine/folios/FoliosWar1.ts#L9-L181)
- [Base accordion builder](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/engine/folios/BaseFolioWorld.ts#L486-L538)
- [Living stagecraft, documentary settlement bands](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/vnext/livingStagecraft.ts#L149-L161)
- [F04 history manifest and verification cue](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/story/historyManifest.ts#L615-L736)
- [Actual Codec procedural mesh constructor](https://github.com/westkitty/Palimpsest/blob/41dddee6383d94e8ce0f68303a506cd9290225ee/src/engine/drakken/CharacterFigures.ts#L555-L692)

## Slot map
| Source slot | Asset in editable Blender candidate | Scope and verification |
|---|---|---|
| **A** – Flip colony overlay | `A • representative colony flip axis (context at rest)` and attached green city print, dome, wing, jagged dark reverse | Brass supports and axial plate are source-grounded; no A motion in this C rehearsal. Shapes are a representative instructional colony, not a newly named location. |
| **B** – Trace counter-Macro route | `B • Codec editorial model, exact source mesh` and three `B • counter-Macro slotted brass guide` tracks | Actual `buildCodecFigure(fiber,1.05)` geometry and hierarchy triangulated into `codec_editorial.json`; material swatches reconstructed, Canvas textures excluded. Tracks and arrows stay at rest. This is the existing procedural Codec, not newly certified canon art. |
| **C** – Unfold logistics verification | Six `C hinge • leaflet 01..06` objects, fixed binding saddle, scoring, and proof cameras | The runtime implementation calls this strip with six panels, 1.08 × 0.24, and rest/open targets 0.16/1.0. The narrative synopsis says '4-panel' and the cue has four terms; we put them on the four inner panels, leaving the first for binding and sixth for pulling. Actual shared-edge linkage replaces the source approximation's 0.94× center pitch. |
| Rear scenic layer | Three ink/foil citadel relief layers and seven receding cut-paper contact tiers | Fits the source's documentary atelier and green/dusk palette. The silhouette is not canonical geography, no additional species, and no invented casualty counts. |

Black-through cardstock carries colored surface printing, separate from pigmentation of the board itself. Pinned source themes and staging do not imply a pixel-matched transfer: the asset proof is editorially relettered and relit and validates only C's physical linkage, not WebGL, reader controls, or end-to-end release. No private testimony, speech, voice model, or unrelated narrative added. No source, other folio, repository, Drive original or deployment was changed.

## Reproduce / inspect
```sh
blender -b -t 3 -P build_f04.py
blender -b -t 3 -P build_f04.py -- --motion
blender -b -t 2 Palimpsest_F04_Fold_Candidate.blend -P verify_f04.py
```
`build_f04.py` needs only the supplied `codec_editorial.json`; the saved Blender file is self-contained. Alternate camera `02 • Low fold hinge geometry` for the cut-edge shot. Set frame 1 for source rest and 35 for open.

### Delivered proof media
- `Palimpsest_F04_Hero.png`: fully extended verification plate. `F04_Crease_Proof.png`: low-view detail while the common crease edges still rise.
- `Palimpsest_F04_Fold_Loop.mp4`: silent reversible C rehearsal, 4.4 s. Regenerate from the sampled frames with `bash encode_f04.sh`.
- `verify_f04.py`: independent Blender reopen checks nine poses, alternating rotation signs, two matching endpoints at every shared edge, exact start and reset angles, all four source lesson terms, the source-derived Codec object and absence of required external images.
