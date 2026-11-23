# F09 Living Book: reviewed Blender apparatus

The imported object is the nonhistorical **MODEL STAR** teaching mechanism. Only its geometry and channel A are imported. The Hal’Ven teaching chart (B), containment survey (C), browser book, controls, existing three-tab witness comb, source text, and Archive remain distinct.

The input is `Palimpsest_F09_The_HalVen_Heliocide.blend` (SHA-256 `22dc04b507e1720f0b269caeff3d02d9b2695e8149adbcd39bbefbd1b3674a14`). Rebuild using:

```sh
blender -b --factory-startup --disable-autoexec /absolute/path/Palimpsest_F09_The_HalVen_Heliocide.blend -P production/dot_archive/folios/F09/export_f09_living.py -- src/vnext/assets/palimpsest-f09-challenger.glb
node --test tests/challenger-f09.test.mjs
npm run lint
npm run build
```

The selective export preserves the armillary, bonded paper steps, rails, original cyan ring, eight scored hinge pivots and their beveled leaves, and the matte black aperture. The moving filament is actual Blender-evaluated geometry: 44 changing authored morphs are keyed into one GLB clip alongside ring translation, eight hinge rotations, and aperture scale. Frame 1 is the returned unpulled mount; 28 is the pulled cyan thread; 43 is the scored fold; 70 is permanent matte absence. The 18 fps browser cue uses the same frame for spatial witness flex and inward paper slivers, not colored lights or historical movement. A previously latched or reduced-motion view starts held at frame 70. B and C never consume animation time or change A.

The actual asset is loaded only in Living F09. If it is missing, fails validation, or the viewer changes page before it resolves, the pre-existing working scene remains. No images, external fonts, lights, camera, stage doubles, hidden copy, or archival assets are in the bundle. The unlit aperture has no emissive behavior. Native browser paper/lighting and procedural studio grain are not part of the mesh export.
