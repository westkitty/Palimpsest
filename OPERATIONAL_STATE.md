# Operational State — PALIMPSEST F01–F03 Development

project_id: westkitty/Palimpsest
scope: isolated folio-vnext experimental route; not the active reader
base_revision: 3ac3f7ae328d8b04d0641a454f16a01fc20d71cf
status: separate public review-preview release authorized; interactive visual acceptance NOT VERIFIED
last_updated: 2026-11-20

## Protected invariants
- The twelve-folio live edition on main is intact.
- No changes to canonical manuscript, approved DRAXIS models, narration, speech engine, saved sessions, or existing accessibility fallback.
- F01 visually starless; F02 first stars and Digital Geode; F03 templates before Drakken; hidden F03 inscription not approved.
- The narrator never acknowledges hidden atrocity; preview has no narrator.
- User expressly requested staging, committing, pushing and updating Pages on 2026-11-20. This permits publication of the isolated **review preview** on the existing Pages site; it does not approve the F01–F03 manuscript, figure art, hidden F03 text, or integration into the active reader. Browser walkthrough remains unverified and must not be claimed complete.

## Implemented candidate
- A standalone multi-page Vite entry \`folio-vnext.html\` with Three.js paper-folio illustrations for F01–F03.
- Mouse/touch orbit, page navigation, mobile buttons, miniature movement, optional close-inspection azure testimony.
- Hidden phrases only in miniature; no rewards or speech response.
- Reduced-motion aware, accessible text fallback when WebGL is unavailable, finite scene resource cleanup.

## Unverified / pending
- **Verified on GitHub Actions:** TypeScript (`bun run lint`) and Vite production bundle (`bun run build`) passed on commit `e600c8ca1d48f2f08c4e719da749e1b65eda4a17`, run https://github.com/westkitty/Palimpsest/actions/runs/44726866251 (build job **success**; deployment job **failure** because this branch is not authorized for GitHub Pages). The run's overall "failure" is NOT a build failure. 
- **Still unverified:** targeted `node tests/folio-vnext-preview.test.cjs` runner, actual WebGL visual quality, miniature traversal/hidden-text discoverability, touch controls, accessibility interaction and renderer lifecycle. No claim of completed browser QA.
- F01 model-sheet fidelity (current standees abstract), F02 miniature Geode interior navigation (simplified), F03 exact template geometries, truthful original text.
- Approved public narration, chronology relocation of older F03 Drakken material, third inscription words/location, visible Vault lock and protected fallback equivalence.
- Branch source and build were read back; the next publication step is a non-forced fast-forward to `main` after targeted regression assertions and production build pass. Verify public `folio-vnext.html` and unchanged home route after GitHub Actions deploy. Record actual deployed SHA and workflow outcome in the release handoff; no such deployment is asserted in this preflight record.
