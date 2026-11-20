# Operational State — PALIMPSEST F01–F03 Development

project_id: westkitty/Palimpsest
scope: isolated folio-vnext experimental route; not the active reader
base_revision: 3ac3f7ae328d8b04d0641a454f16a01fc20d71cf
status: implementation candidate; runtime visual acceptance NOT VERIFIED
last_updated: 2026-11-20

## Protected invariants
- The twelve-folio live edition on main is intact.
- No changes to canonical manuscript, approved DRAXIS models, narration, speech engine, saved sessions, or existing accessibility fallback.
- F01 visually starless; F02 first stars and Digital Geode; F03 templates before Drakken; hidden F03 inscription not approved.
- The narrator never acknowledges hidden atrocity; preview has no narrator.
- No merge or deployment until explicitly requested and source+browser evidence passes.

## Implemented candidate
- A standalone multi-page Vite entry \`folio-vnext.html\` with Three.js paper-folio illustrations for F01–F03.
- Mouse/touch orbit, page navigation, mobile buttons, miniature movement, optional close-inspection azure testimony.
- Hidden phrases only in miniature; no rewards or speech response.
- Reduced-motion aware, accessible text fallback when WebGL is unavailable, finite scene resource cleanup.

## Unverified / pending
- Full build, TypeScript and browser interaction checks; record results here after running them.
- F01 model-sheet fidelity (current standees abstract), F02 miniature Geode interior navigation (simplified), F03 exact template geometries, truthful original text.
- Approved public narration, chronology relocation of older F03 Drakken material, third inscription words/location, visible Vault lock and protected fallback equivalence.
- Staging and push state should be checked against GitHub after any changes.
