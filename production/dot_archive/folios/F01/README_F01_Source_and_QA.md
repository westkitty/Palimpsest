# PALIMPSEST · F01 — Before the First Stars
**Blender candidate · mechanical staging proof, not narrative or visual-canon approval**

This is a separate Blender production study of the published F01 triptych. It carries the three source-authored procedural models directly into editable Blender meshes; it does not redesign an identity or re-enact the rupture. No stars, nebula, added celestial objects, public confession, narrator, or score. The paper is the existing pre-All ivory registration stock, not an F02+ black-paper rule retroactively applied to F01.

## Exact source family
- Base: `westkitty/Palimpsest` at `86d6f4214af204dbbe347a04f7aa9e18f18b7876`.
- [Current deployed staging geometry and book rails](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/vnext/previewV2.ts#L611-L738), and [current F01 tab/hinge targets](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/vnext/previewV2.ts#L1129-L1135).
- [Published settled visual proof](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/production/folio_vnext/evidence/physical-theatre-20261120/03-F01-settled.png), inspected at native 1100×720.
- The old `FoliosEarly.ts` astrolabe, starfield, and star-core depiction is archival, not the active rationale. The falling into liquid paper / spreading black ink is discussed as an optional visual metaphor; exact accepted motion was not established for this build. The proof does **not** stage that motion. The active three-figure arrangement is [directly source-evidenced](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/production/folio_vnext/sources/Palimpsest_Folios_1-3_Observations_and_Ideas_2026-11-20.md#L28-L47).

## Exact slot-to-object mapping

| Source slot | Source identity | Blender target | What the rehearsal does |
| --- | --- | --- | --- |
| Left, source x −2.67 | [`buildShardGodFigure(fiber,1.36)`](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/engine/drakken/CharacterFigures.ts#L43) | `A • fold axis 1 / palimpsest-original-tiger` | Figure inherits its authored leaf transform; it is not restaged in isolation. |
| Right, source x +2.67 | [`preCaptivityNiAlBu()`](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/vnext/previewV2.ts#L437-L454) | `A • fold axis 3 / palimpsest-original-nialbu` | Exact existing extraction of the figure from the authored Geode constructor, then resetting orientation and stripping captivity rings; no new limb or costume interpretation. |
| A | `fold` | `Pull-tab A`, `A • fold axis 1–3` and twelve `Scored cardstock gusset` links | Slips front by 0.31 source units; left/right fold to -0.79 rad, center -0.94 rad. New virtual folded-paper support is mechanical scaffolding. |
| C | `compare` | `Pull-tab C` and hinge comparison yaw | Side pivots rotate −0.10 and +0.10 rad around Blender Z; center remains neutral. |

The original constructors annotate legacy sheet identifiers `1000190389.png` (Tiger), `1000190435.png` (Wordstreamer), and `1000188759.png` (NiAlBu). No image bytes were used as a mesh substitute or reapproved.

Source axes `(X,Y-up,Z-front)` map to Blender `(X,-Z,Y)`. The original page rails, slabs, pierced arches, platen layering, label text, and the three exact authored triangle hierarchies come from the pinned runtime source. The paper grain, typeface, studio lights/cameras, fixed-length articulated gussets and timing are candidate render/engineering choices. This is not a pixel-matched browser renderer: original CanvasTexture artwork and screen-space contour lines are excluded; cardstock grain and readable legends are regenerated. Source material opacity has not been reconstructed as an exact Three.js shader. The transferred Tiger and extracted pre-captivity NiAlBu are the **existing procedural editorial standees, not certified current canon likenesses**; the source's legacy anatomy styling was retained, not reauthorized. An exact approved earlier rupture performance and updated character likeness/era QA remain separate from this proof.

## Working files and review
- `Palimpsest_F01_Fold_Candidate.blend`: editable triangle meshes, paper axes, six pairs of fixed-length gussets, timeline markers and two cameras.
- `Palimpsest_F01_Paper_Proof.png`, `F01_Rest.png`, `F01_Cut_Edge_Proof.png`: visual proof from this exact .blend-generating source.
- `build_f01.py`, `f01_geometry.json`: reproducible Blender stage construction from the pinned source-derived mesh/transform dataset; no external lighting or font dependency at Blender open time. Build: `blender -b -t 3 -P build_f01.py`. Add `-- --motion` to export every other frame of the 72-frame timeline.
- The test timestamps are a reversible **mechanism rehearsal**, not a fictional timeline or approval of automatic interaction order.
- This package does not integrate into the Three.js reader, prove its secret-interaction logic, or authorize changing source, originals or release state. If adopted later, preserve all existing routing and narration separation.

- `Palimpsest_F01_Fold_Loop.mp4`: silent H.264 animation of the same source-staged rehearsal (4 seconds; 36 sampled Blender-rendered states delivered at 18 fps). Full decode passed.
- `verify_f01.py`: reopens and checks the editable artifact; trio, 12 linkage panels, matching creases, frame 45 targets, resting endpoints, hidden collection, and no external images verified. Run `blender -b -t 2 Palimpsest_F01_Fold_Candidate.blend -P verify_f01.py`.

Public archive note: inspection-only wording and private source references are omitted.
