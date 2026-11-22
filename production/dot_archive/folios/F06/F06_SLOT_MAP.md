# F06 — The Long Attrition | Blender candidate

**Scope:** folded-paper asset study, not a shipped folio or canon revision. The fixed book spread is an inspection stage; this file does not implement the reader or replace the source.

| Slot | Candidate mechanism | Future integration |
|---|---|---|
| A, Chronology | Layered indexed cardstock gear; one demonstrated detent. Four printed headings are exactly 7–30, 31–60, 61–90, 91–120. | `F06FolioWorld.chronoWheel`. Keep current four indexed steps, not new event-day claims. |
| B, Campaign plate | Native editable mesh transfer of the first two authored DRAXIS IDs: 003 Fault-Tongue and 004 Obsidian Gul. No new creature anatomy. | Existing source roster and specimen-pedestal swap. Do not replace the 14-ID catalog with the two proof examples. |
| C, Cumulative loss | Six independently hinged Z-pleated leaves with a tab; attachment points stay closed at every sampled keyframe. Data cells are deliberately empty. | `buildAccordionStrip`, C reversible action and livingStagecraft's receding account cards. Keep totals unprinted. |
| Scenery | Scored cardstock horizon layers in charcoal and rust. | Editorial backdrop only, not new location/canon. |

Authority: [pinned F06 scene](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/engine/folios/FoliosWar1.ts), [history manifest](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/story/historyManifest.ts), [campaign catalog](https://github.com/westkitty/Palimpsest/blob/86d6f4214af204dbbe347a04f7aa9e18f18b7876/src/story/draxisCatalog.ts). Derived specimen mesh coordinates are in `f06_specimens.json`; materials are translated to matte cardstock in Blender. Source 3D runtime designs and original plates remain authoritative. No narration, graphic reenactment, or replacement of prior assets.

Rebuild with Blender 4.3.2: `blender -b -t 3 -P build_f06.py`. Reopen to verify: `blender -b Palimpsest_F06_The_Long_Attrition.blend -t 2 -P verify_f06.py`. The hinge proof is visual/kinematic, not a printable fabrication or collision certification.
