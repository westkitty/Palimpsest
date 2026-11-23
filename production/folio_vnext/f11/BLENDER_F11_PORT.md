# F11 dimensional paper and acting import
Private review branch, not a production deployment. Built from the editable dimensional-quality Blender proof (see source SHA in the motion manifest); original Living binding, crater/base, tab/lever controls, specimen A, comparison B, quotation C and Archive are retained. No new voice, canon, or concealed content.

- The exported Blender material and motion selection comprises 27 roots, 27 stem hinges, 108 frond controllers, 238 modeled leaf solids with scored paper thickness, rooted feet, window, the Marcel effect, and the three articulated actor meshes. GPU geometry uses 208 material batches (about 66k triangles), batched only inside a preserved moving pivot. Plants use authored dye as vertex color; cameras, lights, fonts, archived inscription and the retired planar foliage are not shipped.
- Story source is Blender at 24 fps, frames 1–180. Living presentation maps the authored local transform clips to a paced sequence: quiet spread, Codec, Marcel/effects, roots into canopy, mature hold, Tiger last, and the emotional split. Projected actor mounts preserve the existing Living stations. Reduced motion preserves the event order while disabling separate idles and eye flutter; no independent wink is auto-fired.
- Facial eye shapes retain the two cyan slit apertures and four dark facet closure modifiers. Exported source local-idle profiles and their weights remain independent of body and head story motion. Blink and both deliberate wink source arrays are included as verification data, not UI controls. Blender's original procedural roughness/bump response and renderer lighting were not baked or claimed equivalent; the Living Book lights and source-adjusted paper roughness are used.
- The neutral local transforms of generated static batches are deliberately not mesh animation. Blender's scene-sampling path inferred phantom +4/+8 translations when calculating these leaves beneath a very small parent. The post-export check removes only the generated meshes' redundant TRS binding and maintains the exact parent transform/cut geometry; no leaf geometry was discarded.
- Runtime asset is gzip-compressed with deterministic gzip headers; browser detects the byte signature and decompresses before GLTFLoader parsing. The raw GLB is a private verification intermediate, not a tracked asset.

## Regenerate
Open the verified F11 dimensional proof with Blender 4.3.2, pass an isolated output directory, then use deterministic gzip. Do not overwrite the source:
```sh
blender -b /path/to/Palimpsest_F11_Dimensional_Quality_Proof.blend -t 3 --python-exit-code 13 -P production/folio_vnext/f11/export_challenger.py -- /tmp/f11-export
gzip -n -9 -c /tmp/f11-export/palimpsest-f11-challenger.glb > src/vnext/assets/palimpsest-f11-challenger.glb.gz
cp /tmp/f11-export/palimpsest-f11-motion.json src/vnext/assets/
node --test tests/challenger-f11.test.mjs
npm run lint
npm run build
```
Browser test: `tests/browser-f11-challenger.cjs` against the built preview or standalone file, desktop normal motion and narrow touch with reduced motion. It requires the actual imported asset, exact distinct phases, and independent working A/B/C controls. Software Chromium is smoke evidence, not a physical-device performance benchmark.

### One rooted witness through the change

The first new cut-paper root starts in Codec’s lone loam patch, follows the gutter, and reaches the exact native `PLANT_22` floor position before the broad root network or the canopy rise. A narrow ochre center fold and three short forks distinguish the same path after the split opens; no new plant replaces the Blender specimen. `PLANT_22` uses its original stem/frond tracks, resampled as the first sprout. The remaining rooted stems keep their existing growth wave, bloom, and later parting. The foreground neighbor rooted in front of Codec bends aside without translating, and `PLANT_22` remains fixed and legible in the opened silhouette. Tiger still enters only after the canopy parts and holds. The final hold is paced to show Codec’s original head/body motion with the same specimen rooted in view, not by changing the actors or their order. Reduced motion uses the same sequence and omits idle oscillation.

### Small living witnesses

Only after the already rooted canopy has spread, a hand-cut six-legged moth lands on the actual upper geometry of the imported `FROND_26_3`; its resting transform follows a triangle on that same native leaf. A compact ground bird walks in from the outside lane, lowers its head to inspect the newly grown space, then comes to stillness before Tiger. Neither crosses the actors, pilot root/plant, or record. These generic paper animals are a visual response to the growing scene, not a new species, event, cause of growth, or addition to the text. Reduced motion shows the moth perched without flutter and grounds the bird without stepping cycles. The existing Codec and Marcel paper heads omit eye anatomy, so their independent source body/head reactions and idles are preserved without inventing eyes. Tiger retains independent native crystalline slit/fold closure and a pupil-free source blink.

### Capillary water mark

The small condensate bead appears in the side paper lip only after Marcel’s redirection and the identifiable pilot reaches the gutter. It shrinks in place as an irregular two-tone capillary margin follows the dyed paper. The actual front edge cockles and sags while the back crease and side paste points stay fixed. The darkened stain and slight deformed silhouette stay there under the canopy and through the final acting. This is a secondary material observation only: it does not drive the roots, wildlife, actor timings, or growth. The wet patch avoids the hero plant and stays smaller than the paper cutaway.

The small ground bird’s existing two printed eyes close briefly before the late entrance and occasionally in the indefinite settled idle. Its torso and neck make a tiny local resting movement without shifting the feet. From Tiger’s entry through Codec’s final authored reaction, the bird is still. The moth re-seats its folded wings once before the late entrance; neither cue loops or runs in reduced motion.
