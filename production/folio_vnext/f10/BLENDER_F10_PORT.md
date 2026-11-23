# F10 · Authored Siege Wall import (Living Book review)
The editable donor is `Palimpsest_F10_Fold_Candidate.blend` (SHA-256 `4d1e3e547592967b134fb088fea7fcd026986aaca05592a431e900a2c964caeb`). The public asset contains only its A-slot solid cutout, exact unlit receiver, paper thickness, local fold axes, glue feet and crease rules. The mesh source numbers leaves 00–11 and axes 01–12; the exporter aligns each by actual parent and emits no font, camera, lamp, B scene or protocol text.

- Twelve separately authored rotation tracks travel from folded through staggered lift to upright; refold scrubs those exact keys in reverse. The receiver is a single geometry, never a second sky streak. Its material is forced unlit after glTF load and it stays fixed.
- The live Three.js scene retains the existing three DRAXIS figures. Their recoil, inward motion and below-receiver cutoff follow the sampled mean hinge angle rather than the lever target. Reduced motion applies the exact authored detents.
- The original A collar is hidden only when every imported root, child, receiver and clip passes validation. Pointer pick targets are the visible paper leaves/core plus the original lever. Independent B schematics/inhabited horizon and C public protocol remain governed by the same Living logic. B still presents exactly one pitch-black streak in the optical view, no orbital lattice. Neither archive runtime nor narration changes.
- Browser stage is review-grade. Blender procedural paper bumps and studio lighting are not a promise of matching Cycles; solid geometry, material palette and visible cuts are transported.

## Build and evidence
```sh
blender -b /path/to/Palimpsest_F10_Fold_Candidate.blend -t 2 --python-exit-code 13 -P production/folio_vnext/f10/export_f10_challenger.py -- src/vnext/assets/palimpsest-f10-challenger.glb
node --test tests/challenger-f10.test.mjs
npm run lint && npm run build
```
`tests/browser-f10-challenger.cjs` requires the actual loaded WebGL donor, shows mid-travel in normal motion, checks settled capture, holds A steady during B/C operations, and then restores the closed collar and three visible figures. It also checks the reduced-motion portrait variant, not physical-device FPS.

### Structural shadow reading

The twelve existing opaque fin meshes cast individually resolved matte silhouettes onto the adjacent paper as their pinned hinges rise in sequence. The cutout shows the reach of the boundary on land outside the well while the original recess, inhabited horizon, and independent Postwar Protocols reading remain unchanged. The cast follows evaluated Blender geometry, disappears as the collar folds back down, and is drawn on receiving stock even without renderer shadow maps. No new light effect, camera, or control is required.
### Two external study views, one mechanism

Under **Paper viewpoints** the reader can choose **Wall overview**, **Inhabited street**, or return to the existing **Whole book**. These are camera controls, not historical variants or new mechanism slots. Moving between them leaves all twelve hinge samples, the continuing capture, the B-side window choice, C's protocol, and the paper motion clock alone. The inhabited view frames the already visible source ground (the existing miniature margin or the B-side horizon). A small quiet shutter movement in the margin does not follow the capture or suggest a new event. Optional framing widens on portrait and reduced motion snaps the camera only. Both cameras remain above and in front of the paper, on the inhabited side of the tableau. On F05, F06 and F10 the same exterior-only constraint covers manual rotation, zoom and the miniature shortcut. The reader never takes a Drakken or DRAXIS viewpoint; the depicted figures and capture remain subjects of the Administration exhibit.
