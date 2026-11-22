# Palimpsest · Living Book review build

The separate Living Book path now implements the approved twelve-folio revision in Three.js, with a physical thirteenth leaf for the closing imprint. It builds from the archived approved branch. It does not change the historical manifest or the Archive runtime.

## Open the build

For a review, download **Palimpsest_Living_Book.html** and open it in a browser. No local server or install is needed for that file. Tap the cover, then turn the lower outside paper corners. Keyboard: Enter opens the book; left/right arrows turn; A/B/C operate the current spread. The bottom chevron opens panel controls. The link to the Archive opens the existing published Archive. Audio is not included.

## Rebuild

From this checkout: npm install --legacy-peer-deps --no-audit --no-fund --package-lock=false --ignore-scripts, npm run lint, npm run build, then node scripts/make-living-review.mjs dist. The checkout's existing Bun lockfile is a newer version than the locally available Bun 1.3.14 understands, and npm's strict peer resolver rejects the existing Vite/esbuild version pairing. No project dependency manifests or lockfiles were changed.

## What is included

- A Living-only art layer on every existing spread, from F01’s physical three-notch register to F12’s Administration recruitment role panels and stamp.
- F02 lifts the paper-book rules through progressive ink and a star/cluster/galaxy mask. F03 names and links three source families to their actual folds. F04–F10 preserve individual physical controls while staging expansion, ring motion, chronology, relief, the Hookshot gate, the gravity demonstration and wall intake.
- F11 orders Codec, Marcel, paper growth, Tiger and the split in their reactions. The jungle depicts potential on the paper stage, not verified planetary restoration. F12 and the closing pop-out are separate.
- The spoken script is a separate draft for review. It does not use the Archive narration indexed by old folio order, and no voices are recorded or played by this build.
- F01/F11 editable acting proofs are separate Blender files. They are not imported into the runtime. All other spreads have only the procedural motion in this review; the full per-actor Blender animation and asset polish pass is not complete. A review build is not production acceptance or deployment.

## Verification commands

- npm run lint
- npm run build
- node --import tsx --test tests/*.test.*
- tests/browser-revision-proof.cjs accepts PALIMPSEST_CHROME_PATH, PALIMPSEST_PLAYWRIGHT, PALIMPSEST_STANDALONE, and PALIMPSEST_PROOF_DIR.
