# PALIMPSEST — F01–F03 working sculpture preview

**Status:** isolated, un-narrated implementation experiment, not a canonical or live twelve-folio replacement.

Source of truth: [F01–F03 Creative Direction and Migration Contract](../production/folio_vnext/F01_F03_DIRECTION_AND_DELTA.md). The original submitted notes remain under production/folio_vnext/sources/.

## Run
Use the current repository dependencies, then start the existing Vite dev server:
```
bun install --frozen-lockfile
bunx vite --host 127.0.0.1
```
Visit `/folio-vnext.html` in the development server. The separate root HTML is included in the Vite multi-page production build for **review artifacts only**. No preview link is added to the main reader.

## Controls
Drag and zoom to orbit the cardstock sculpture; left/right arrows or the bottom tabs turn folios. M enters/exits miniature inspection, W/A/S/D moves at miniature scale. Close inspection within the relevant physical miniature location reveals azure maker testimony on F01 and F02. No discovery is stored and no narrator, music, or game reward responds.

## Visual content
- F01: no stellar geometry; three **abstract** paper identity standees (not canonical character anatomy) and a miniature inscription beneath Wordstreamer's placement.
- F02: first visible stars; folded celestial fan; Zentrum and Digital Geode features and hidden NiAlBu text.
- F03: finite stored template leaves, a demonstration compiler wheel, and three family-related procedural world models. These are **illustrative models**, not named canon planets.

## Not implemented / not authorized
No approved public narration was supplied. The preview is therefore **silent** rather than inventing public lines. The existing manuscript, active F01–F12 runtime, original DRAXIS art, store and save formats, and non-WebGL edition are untouched. No canonical F03 inscription, Vault-lock animation policy, or rescheduled Drakken folio is invented. Not a release candidate until cross-mode integration, source-backed art, reviewed narrator cues, miniature affordances, real-browser testing, and manuscript reconciliation.

## Checks
`node tests/folio-vnext-preview.test.cjs`, `bun run lint`, and `bun run build`. On a development branch, validate in a browser; do not change `main` or GitHub Pages for this experiment.
