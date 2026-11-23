# F08: The Aureal Gate · reviewed Blender stage

The shipped paper theatre is exported from the reviewed `Palimpsest_F08_The_Aureal_Gate.blend`. It replaces only the duplicate Living Book scenery, not the world rules or Archive. The public landmark text is visible outline geometry; no storyteller audio, hidden manuscript, textures, fonts, camera or lights are in the GLB. Existing source-authored Tiger and Codec remain as distinct observers rather than being re-modeled in this runtime pass. Marcel, his footing/weight shift, the circular Hookshot portal, registration collar, and plasma remain the Living Book's functional components. The five Blender cut-through arches frame a separate working circular aperture, not alternate gate geometry.

| Slot | Native Blender motion | Runtime constraint |
|---|---|---|
| A | Two actual shutter hinges rotate 11.5° to 87.1° in opposite directions, through authored frames 16–40. | The registration clip and active plasma appear only on A. Arrival and both other slots alone keep plasma off. |
| B | Slider advances, the original full gold ring changes to three asymmetrically displaced red arcs and the low broken profile at Tiger, distinct from the working portal. Frames 65–88. | No change to shutters, portal, or right wing. |
| C | The four linked paper creases open across frames 103–153, carrying five physical red-ringed medallions on each real card. | Twenty marks, not a map. C does not power the gate. |

The distinct native clip tracks are evaluated separately; reader-controlled motions can open, reverse, or run concurrently without colliding in the mixer. Reduced motion settles to the same authored end states. The real A/B/C UI and paper controls remain visible and clickable. An unavailable or malformed asset keeps the prior reader scene. `canvas.dataset.blenderFolio` is `08` only on successful mount; `f08CandidateState` records native frames, ring count and actual plasma power.

GLB: 1,416,988 bytes; SHA-256 `c2db9af31078765bd7e2b2f14ddb0f2d6ff4468d4906f557b400c08cfe7d8e91`. Rebuild with `blender -b Palimpsest_F08_The_Aureal_Gate.blend -t 2 -P production/folio_vnext/sources/export_f08_challenger.py` (approved source in the F08 candidate archive; writes `f08.glb` beside script). Structural verification: `node --test tests/challenger-f08.test.mjs`.

## Environmental cues

The two source A hinge curves are sampled with separate timing: one shutter leads, the second follows, then both hold open on a dark circular aperture. The existing collar lights before a short sweep on the rim; only then does the circular plasma rise, cast a brief paper/Marcel reflection, and settle to a quieter motion. A off cuts the portal and reflected light immediately. The shutters can still reverse without forcing B or C.

The independent B card is on the right of the binding so the intact gold and displaced red pieces can be compared without visually occupying the gate. The companion fracture remains with Tiger. The four original C crease curves now carry the native amber/obsidian leaves outward in order, with no change to the source track targets, glue joints, or exactly twenty physical Blood Rings. Reduced motion snaps each independent mechanism to the same endpoints.
