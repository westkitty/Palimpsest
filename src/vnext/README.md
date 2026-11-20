# PALIMPSEST · The Twelve Living Folios

This folder provides the **continuous sculptural edition F01–F12** served at `/folio-vnext.html`. It coexists with, rather than replacing, the original archival twelve-folio manuscript. The governing direction is [`production/folio_vnext/F01_F03_DIRECTION_AND_DELTA.md`](../../production/folio_vnext/F01_F03_DIRECTION_AND_DELTA.md); refer to the supplied source notes for approved/proposed/open distinctions.

## Full twelve-folio extension · 2026-11-20

The current living edition is a continuous **F01–F12** sculptural book. F04–F12 no longer send the reader into a second renderer, and all twelve folios appear in one living navigation rail. The independent archival manuscript and its cue narration are accessible only through the explicit Archive / Archival counterpart controls.

F04–F12 mount the existing authored `F04FolioWorld` through `F12FolioWorld` paper sculptures from `src/engine/folios/FoliosWar1.ts`, `FoliosWar2.ts`, and `FoliosAftermath.ts`, retaining their individually designed A/B/C demonstrations, figures, DRAXIS models, palettes, and exact sourced historical subject matter. No generic replacement gallery is used. Their mechanism state is validated and persisted separately in the versioned session key `palimpsest.living.f04-f12.study.v1`; maker secrets, narrator/camera data and the archival session are excluded. F09's model-star filament remains irreversible within that study until Reset study.

The non-WebGL accessible route has nine unique source-grounded 4:3 schematic plates, descriptive labels and functional A/B/C state feedback. `src/vnext/laterFolioDiagrams.ts` owns the no-remote-asset SVG plates. Reduced-motion and software-GPU rendering adapt the experience without claiming visual equivalence to physical-device review.

Build and validation are governed by `.github/workflows/living-twelve-ci.yml`, including original F01–F03 canon tests, all nine new mechanics, TypeScript, Vite and the full twelve-folio built-browser journey. Physical device polish, source-to-figure visual fidelity, and long-running GPU lifecycle still require review before a final AAA-quality certificate.

## Visual language

The physical object belongs beside PALIMPSEST's existing archival folios: layered ivory/blue cardstock, slate-linen boards, multiple cut-out depth planes, brass hinge axes and rivets, engraved material indicators, deterministic paper fibre, theatrical but controlled azure/copper lighting, and a genuine 4:3 reading plate. F01 and F02 now reuse the authored paper sculptures from `src/engine/drakken/CharacterFigures.ts` (Tiger, Wordstreamer, NiAlBu and his Digital Geode); the character-image approval registry remains untouched. The F01 NiAlBu figure is an editorial reuse of the existing source sculpture with imprisonment rings removed; the exact pre-captivity anatomy remains unverified.

- **F01**: entirely starless primordial order; three existing ink-contoured, hand-colored sculptural figures, paper arches and delicate rule traces. Concealed maker testimony under Wordstreamer reads exactly **He murdered her.**
- **F02**: A raises the first points, B releases clusters, C completes the folded galaxy. Zentrum and the Digital Geode remain distinct landmarks, never asserted as the literal center of the universe. Miniature exploration of the Geode reveals exactly **NiAlBu still watches her die. Again and again.** No murder animation or narrator reaction.
- **F03**: finite archive leaves; a mechanical compiler and a trio of worlds share one selected source template but differ through bounded, repeatable variations. The third inscription, the public Vault lock, any invented named planets and revised narration are **not implemented** pending approval.

## Repositionable instruments

There are **four independent floating panels**: folio index, camera/inspection guide, reading notes and mechanism console. Drag their handles with mouse, finger, or pen. On a focused handle, use **arrow keys** for a 12px move, **Shift+arrows** for a 36px move, and **Home** to restore that panel's starting placement. Each panel can collapse or reopen. **Reset layout** restores all panels, while **Hide instruments** clears the viewport and remains accessible as a small fixed control.

Panels are constrained to the visible viewport and automatically clamped after resizing. Layout only persists in `sessionStorage` for this tab/session and carries no folio progression, discovery, voice, or canon state. Unavailable storage never disables the controls. Keyboard and pointer input on handles is isolated from folio shortcuts and camera orbit.

Outside the panels, **drag** to orbit the sculpture, **Shift+drag** or right-drag to pan/reposition the 3D view, and pinch/wheel to zoom. Miniature inspection uses **M**, **WASD** or movement buttons, with **I** for deliberate close inspection. The actual geometric secret reveal still requires the correct mode, near distance, and gaze; it does not reward, narrate or save the discovery. The independent screen-reader live region remains available even if reading notes are collapsed.

## Files and validation

- `previewV2.ts` is the preserved TypeScript renderer, now with high-fidelity papercraft additions and separate camera pan.
- `folioLogic.ts` is a pure, deterministic 3-folio state and testimony gate.
- `panelDock.js` owns pointer/keyboard floating panel layout and session-only UI positions.
- `folio-vnext.html` owns the responsive 4:3 experience shell, panel handles, accessible reading fallback, and reset/hide controls.
- `tests/preview-v2-contract.test.cjs` safeguards canon and state rules.
- `tests/folio-logic.test.mjs` verifies deterministic scene behavior and discovery gates.
- `tests/panel-layout-contract.test.cjs` checks UI interactions and papercraft boundaries without a WebGL dependency.
- `qa/test_draggable_ui.py` and `qa/test_panel_touch.py` are optional browser-only local validation tools; the source-only CI does not pretend they test the actual Three.js framebuffer.

With existing project dependencies installed, use:

```bash
node tests/preview-v2-contract.test.cjs
node tests/panel-layout-contract.test.cjs
bun test tests/folio-logic.test.mjs
bun run lint
bun run build
```

View `folio-vnext.html` through the Vite dev/preview server. The existing `index.html`, original folios F01–F12, source manuscript, narration, DRAXIS models, source approver ledger, save/session schema and non-WebGL reader are untouched.

**Remaining verification:** full application TypeScript and bundle CI at the new revision, real WebGL render inspection on desktop and mobile, repeated life-cycle and GPU disposal runs, 3D view controls under pointer/touch in the actual app, and separate narrator/manuscript approvals prior to replacing the canonical folios. Do not interpret green source tests as complete visual playtest approval.

## Signature interaction — The Fold That Contains the All

On F02, operate A, then B, then C. The optional **Enter the All (G)** instrument appears only after the galactic paper structures are fully unfolded. Activate it to view the anchored cardstock stellar forms from within; choose **Return to the page (G)** or press Escape to recover the exact prior camera. Reduced-motion preference snaps directly rather than animating a cinematic move. This is an educational-scale interpretation, not a new source claim about the shape of the actual All. The public narrator remains absent and unaware of maker inscriptions.

On F03, triggering C advances bounded variation and gives the paper source die a short, non-flashing physical press animation. It adds no new planets or events to canon.

Regression: `node tests/awe-signature.test.cjs` in addition to the prior source/folio/dock checks. Browser proof must still inspect actual geometry, keyboard/touch and hidden testimony after deployment.

## Source-asset and ink fidelity correction (2026-11-20)

- Figure source is **existing PALIMPSEST code**, not new invented anatomy or an AI-generated approximation: `buildShardGodFigure`, `buildWordstreamerFigure`, `buildNiAlBuGeode`. F01 uses three authored figures; F02 mounts the full existing Digital Geode assembly. No original model functions were edited.
- Preserve the source's matte, **hand-painted cel colors** and sculptural silhouettes. Add geometry-derived dark ink contours as a separate removable layer, with no grayscale desaturation, material replacement, glossy CGI makeover, or gold-colored secret markings. Source figures retain obsidian, slate indigo, azure fissures and copper captivity rings where applicable.
- The current Drive visual-canon contracts for Wordstreamer and NiAlBu list **no approved primary image**. These figures are existing *Palimpsest editorial sculptures*, not newly canonical reference approvals. F01 NiAlBu's pre-captivity historical state still needs a source-approved era reference. Do not invent missing limbs/appendages to resolve it.
- The 21 DRAXIS sculptures have separate scoped visual acceptance; they should **not** be inserted into F01–F03 merely to increase asset count, because the first three folios precede their introduction.

## Study continuity and source-ink lineage (2026-11-20)

The three authored opening folios now retain their *teaching mechanisms* when revisited and on reload in the same browser session. This uses a separate, validated `palimpsest.folio.review.study-state.v1` session key. It does **not** store discovered maker testimony, narration, camera state, or the archival twelve-folio save.

In Folio III, all three variants share a physically printed four-square dark ink register corresponding to one of the three bounded source plates. Their individual geometry and features still vary. The register describes the relationship between source and descendants in the book's archival visual language; it does not introduce new canon. Use **Reset study** in the floating mechanisms panel to restore all three opening folios to initial teaching states without disturbing the panel layout or original manuscript.
