# Palimpsest F02 · The All Unfolds
**Status:** editable review candidate. Separate Blender build only. No repository, existing source, Drive, live site, manuscript or audio changes.

## Pinned reference
Published source: `westkitty/Palimpsest@86d6f4214af204dbbe347a04f7aa9e18f18b7876`.
- [Living build: paper loom and F02](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/vnext/previewV2.ts#L757-L872), [animated state](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/vnext/previewV2.ts#L1136-L1150), [A/B/C and inspection rules](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/vnext/folioLogic.ts#L58-L81).
- [Author-built NiAlBu Digital Geode](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/engine/drakken/CharacterFigures.ts#L391-L546); translated and reframed from procedural geometry, not a replacement or prior-canon claim. `FoliosEarly.ts` contains the superseded original F02 triptych and is historical grounding, not this candidate’s staging.
- [Published F02 stills](https://github.com/westkitty/Palimpsest/tree/86d6f4214af204dbbe347a04f7aa9e18f18b7876/production/folio_vnext/evidence/physical-theatre-20261120): 05 starless arrival, 06 assembly, 11 corrected mobile view are preserved as source evidence. See `evidence/`; these captures are not proposed artwork.
- [Existing creative direction](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/production/folio_vnext/F01_F03_DIRECTION_AND_DELTA.md) plus the more recent black-through-stock and existing-inputs direction conveyed in the roster/task.

## Candidate slots
| Slot | Blender control/reference | Visible output | Review render |
| --- | --- | --- | --- |
| Arrival 0 | Frame 1, all three plates flat | No stars. The cut-through black stock is already black. Physical pre-existing laminae at the front feed into the loom; neutral index prints are editorial, not new substances, identities, or a living-triumvirate tableau. Zentrum left and Geode right stay anchored. | `F02_01_Starless.png` |
| A | Fold A at frames 18–39 | First points on lifted black stock, trace the first nested registration curves. | `F02_02_First_Points.png` |
| B | Fold B at frames 42–65 | Denser clusters reading along a second fold, with A still present. | `F02_03_Clusters.png` |
| C | Fold C at frames 68–97, settle 110 | Full galactic paper sculpture built from the prepared stack, with four supported cut strips and layered clusters. The four trails are editorial geometry, not a cosmology claim. | `F02_04_Galaxy.png` |
| Material and mechanism | Alternate camera at frame 110 | Black stock through edges, scored fold, fixed bonded rails, thickness, gussets and small printed azure/copper marks. | `F02_05_Black_Stock_And_Hinges.png` |

## Editorial boundaries
The All is assembled from pre-existing inputs; there is no ex nihilo act for Tiger and no insertion of a new named source, geometry-of-Zentrum claim or other canon. Wordstreamer and NiAlBu’s contributions are prior stakes, not gestures allocated to them by this Blender visualization. Colored marks on new paper are printed face markings only; structural surfaces and material through the cut edges are black. The existing model’s cyan and copper details are retained in the Geode translation. No Mother/Egg or Notebook Program insertion in this folio.

## Reproduce
`blender -b -t 2 -P build_f02.py` makes the editable .blend and six PNGs with Blender 4.3.2/Cycles CPU. `-- --build-only` saves the scene without renders. `blender -b Palimpsest_F02_The_All_Unfolds.blend -t 2 -P verify_f02.py` reopens and checks the four staged visibility states, rim material binding, source motifs and Gusset Hooks.

Public archive note: inspection-only wording and private source references are omitted.
